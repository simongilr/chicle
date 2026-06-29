import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { AuthContext } from '../modules/auth/auth.types';
import { DynamicServicesService } from '../modules/dynamic-services/dynamic-services.service';
import { FlowsService } from '../modules/flows/flows.service';
import { TenantMembership } from '../modules/tenants/tenant-membership.entity';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);
  const flows = app.get(FlowsService);
  const services = app.get(DynamicServicesService);
  const suffix = Date.now().toString(36);
  const createdServiceIds: string[] = [];
  let flowId: string | undefined;

  try {
    const membershipRows = (await dataSource.query(
      `
        SELECT tm.id
        FROM tenant_memberships tm
        INNER JOIN tenants t ON t.id = tm.tenantId
        INNER JOIN users u ON u.id = tm.userId
        WHERE tm.active = 1
          AND t.active = 1
          AND u.active = 1
        ORDER BY tm.createdAt ASC
        LIMIT 1
      `
    )) as Array<{ id: string }>;
    const membership = membershipRows[0]
      ? await dataSource.getRepository(TenantMembership).findOneBy({ id: membershipRows[0].id })
      : null;
    if (!membership) {
      throw new Error('Smoke test requires one active tenant membership');
    }
    const tenant = await dataSource.getRepository(Tenant).findOneByOrFail({ id: membership.tenantId });
    const user = await dataSource.getRepository(User).findOneByOrFail({ id: membership.userId });
    const auth: AuthContext = {
      tenant,
      user,
      membership,
      sessionId: `smoke-session-${suffix}`,
      tokenId: `smoke-token-${suffix}`,
      roles: [{ key: membership.systemRole, name: membership.systemRole }],
      permissions: ['*']
    };

    const userService = await services.create(auth, {
      key: `smoke_user_${suffix}`,
      name: 'Smoke buscar usuario',
      active: true
    });
    createdServiceIds.push(userService.id);
    const userVersion = await services.createVersion(auth, userService.id, {
      definition: {
        intent: 'get_one',
        source: 'internal_table',
        resultKind: 'single',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'users',
          filters: [
            {
              field: 'email',
              operator: 'equals',
              valueSource: 'input',
              inputKey: 'email',
              required: true
            }
          ]
        },
        method: 'GET',
        url: '',
        responseMap: {
          userId: '{{response.result.id}}'
        }
      }
    });
    await services.publishVersion(auth, userService.id, userVersion.id);

    const membershipService = await services.create(auth, {
      key: `smoke_membership_${suffix}`,
      name: 'Smoke buscar membresía',
      active: true
    });
    createdServiceIds.push(membershipService.id);
    const membershipVersion = await services.createVersion(auth, membershipService.id, {
      definition: {
        intent: 'get_one',
        source: 'internal_table',
        resultKind: 'single',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'tenant_memberships',
          filters: [
            {
              field: 'userId',
              operator: 'equals',
              valueSource: 'input',
              inputKey: 'userId',
              required: true
            }
          ]
        },
        method: 'GET',
        url: '',
        responseMap: {
          role: '{{response.result.systemRole}}'
        }
      }
    });
    await services.publishVersion(auth, membershipService.id, membershipVersion.id);

    const flow = await flows.create(auth, {
      key: `smoke_chain_${suffix}`,
      name: 'Smoke encadenar servicios',
      description: 'Prueba integral de Flow Assistant V3.1',
      category: 'testing',
      metadata: {
        inputFields: [
          {
            key: 'email',
            label: 'Correo',
            type: 'email',
            required: true,
            example: user.email
          }
        ]
      }
    });
    flowId = flow.id;

    await flows.createStep(auth, flow.id, {
      key: 'buscar_usuario',
      name: 'Buscar usuario',
      type: 'dynamic_service',
      position: 10,
      outputKey: 'usuario',
      nextStepKey: 'buscar_membresia',
      config: { serviceKey: userService.key, timeoutMs: 8000 },
      inputMap: { email: '{{input.email}}' }
    });
    await flows.createStep(auth, flow.id, {
      key: 'buscar_membresia',
      name: 'Buscar membresía',
      type: 'dynamic_service',
      position: 20,
      outputKey: 'membresia',
      nextStepKey: 'respuesta',
      config: { serviceKey: membershipService.key, timeoutMs: 8000 },
      inputMap: { userId: '{{steps.usuario.response.mapped.userId}}' }
    });
    await flows.createStep(auth, flow.id, {
      key: 'respuesta',
      name: 'Construir respuesta',
      type: 'response',
      position: 30,
      outputKey: 'respuesta',
      config: {
        status: 'success',
        body: {
          ok: true,
          email: '{{input.email}}',
          userId: '{{steps.usuario.response.mapped.userId}}',
          role: '{{steps.membresia.response.mapped.role}}'
        }
      }
    });

    const preview = await flows.preview(auth, flow.id, { input: { email: user.email } });
    if (preview.status !== 'success') {
      throw new Error(
        `Draft preview failed: ${JSON.stringify('error' in preview ? preview.error : preview.output)}`
      );
    }

    const version = await flows.createVersion(auth, flow.id);
    await flows.publishVersion(auth, flow.id, version.id);
    const execution = await flows.execute(auth, flow.id, {
      input: { email: user.email },
      triggerType: 'test',
      triggerKey: 'container-smoke'
    });
    const body = (execution.output?.['body'] ?? {}) as Record<string, unknown>;
    if (execution.status !== 'success' || body['userId'] !== user.id || body['role'] !== membership.systemRole) {
      throw new Error(`Published execution returned an unexpected result: ${JSON.stringify(execution.output)}`);
    }

    console.log(
      JSON.stringify({
        ok: true,
        previewSteps: preview.steps.length,
        publishedRunStatus: execution.status,
        output: execution.output
      })
    );
  } finally {
    if (flowId) {
      await dataSource.query('DELETE FROM flow_step_runs WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_runs WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_steps WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_versions WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flows WHERE id = ?', [flowId]);
    }
    for (const serviceId of createdServiceIds) {
      await dataSource.query('DELETE FROM dynamic_service_runs WHERE serviceId = ?', [serviceId]);
      await dataSource.query('DELETE FROM dynamic_service_versions WHERE serviceId = ?', [serviceId]);
      await dataSource.query('DELETE FROM dynamic_services WHERE id = ?', [serviceId]);
    }
    await dataSource.query("DELETE FROM audit_events WHERE action LIKE 'flow.%' AND resourceId = ?", [flowId ?? '']);
    for (const serviceId of createdServiceIds) {
      await dataSource.query('DELETE FROM audit_events WHERE resourceId = ?', [serviceId]);
    }
    await app.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
