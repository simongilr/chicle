import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { AuthContext } from '../modules/auth/auth.types';
import { DynamicServicesService } from '../modules/dynamic-services/dynamic-services.service';
import { FlowJob } from '../modules/flows/flow-job.entity';
import { FlowRuntimeService } from '../modules/flows/flow-runtime.service';
import { FlowsService } from '../modules/flows/flows.service';
import { RbacService } from '../modules/rbac/rbac.service';
import { TenantMembership } from '../modules/tenants/tenant-membership.entity';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn']
  });
  const dataSource = app.get(DataSource);
  const flows = app.get(FlowsService);
  const runtime = app.get(FlowRuntimeService);
  const services = app.get(DynamicServicesService);
  const rbac = app.get(RbacService);
  const suffix = Date.now().toString(36);
  const createdServiceIds: string[] = [];
  const createdFlowIds: string[] = [];
  const createdTemplateIds: string[] = [];
  let createdRoleId = '';

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
          role: '{{response.result.systemRole}}',
          tenantId: '{{response.result.tenantId}}'
        }
      }
    });
    await services.publishVersion(auth, membershipService.id, membershipVersion.id);

    const tenantService = await services.create(auth, {
      key: `smoke_tenant_${suffix}`,
      name: 'Smoke buscar organización',
      active: true
    });
    createdServiceIds.push(tenantService.id);
    const tenantVersion = await services.createVersion(auth, tenantService.id, {
      definition: {
        intent: 'get_one',
        source: 'internal_table',
        resultKind: 'single',
        dataTarget: {
          queryMode: 'single_table',
          primaryTable: 'tenants',
          filters: [
            {
              field: 'id',
              operator: 'equals',
              valueSource: 'input',
              inputKey: 'tenantId',
              required: true
            }
          ]
        },
        method: 'GET',
        url: '',
        responseMap: {
          tenantName: '{{response.result.name}}'
        }
      }
    });
    await services.publishVersion(auth, tenantService.id, tenantVersion.id);

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
    createdFlowIds.push(flow.id);

    await flows.replaceDefinition(auth, flow.id, {
      flow: {
        name: flow.name,
        description: flow.description,
        category: flow.category
      },
      entry: {
        mode: 'direct',
        key: 'direct',
        config: {}
      },
      inputFields: flow.metadata?.['inputFields'] as unknown[],
      steps: [
        {
          key: 'buscar_usuario',
          name: 'Buscar usuario',
          type: 'dynamic_service',
          position: 10,
          outputKey: 'usuario',
          nextStepKey: 'buscar_membresia',
          config: { serviceKey: userService.key, timeoutMs: 8000 },
          inputMap: { email: '{{input.email}}' }
        },
        {
          key: 'buscar_membresia',
          name: 'Buscar membresía',
          type: 'dynamic_service',
          position: 20,
          outputKey: 'membresia',
          nextStepKey: 'buscar_tenant',
          config: { serviceKey: membershipService.key, timeoutMs: 8000 },
          inputMap: { userId: '{{steps.usuario.response.mapped.userId}}' }
        },
        {
          key: 'buscar_tenant',
          name: 'Buscar organización',
          type: 'dynamic_service',
          position: 30,
          outputKey: 'tenant',
          nextStepKey: 'respuesta',
          config: { serviceKey: tenantService.key, timeoutMs: 8000 },
          inputMap: {
            tenantId: '{{steps.membresia.response.mapped.tenantId}}'
          }
        },
        {
          key: 'respuesta',
          name: 'Construir respuesta',
          type: 'response',
          position: 40,
          outputKey: 'respuesta',
          config: {
            status: 'success',
            body: {
              ok: true,
              email: '{{input.email}}',
              userId: '{{steps.usuario.response.mapped.userId}}',
              role: '{{steps.membresia.response.mapped.role}}',
              tenantName: '{{steps.tenant.response.mapped.tenantName}}'
            }
          }
        }
      ],
      output: {
        stepKey: 'respuesta',
        responseTo: 'caller'
      }
    });

    const preview = await flows.preview(auth, flow.id, {
      input: { email: user.email }
    });
    if (preview.status !== 'success') {
      throw new Error(`Draft preview failed: ${JSON.stringify('error' in preview ? preview.error : preview.output)}`);
    }

    const version = await flows.createVersion(auth, flow.id);
    await flows.publishVersion(auth, flow.id, version.id);

    const manualTrigger = await flows.createTrigger(auth, flow.id, {
      type: 'manual',
      key: `smoke.manual.${suffix}`,
      active: true
    });
    const manualIdempotencyKey = `smoke-manual-${suffix}`;
    const queuedManual = await runtime.fireTrigger(auth, 'manual', manualTrigger.key, {
      input: { email: user.email },
      idempotencyKey: manualIdempotencyKey
    });
    const duplicateManual = await runtime.fireTrigger(auth, 'manual', manualTrigger.key, {
      input: { email: user.email },
      idempotencyKey: manualIdempotencyKey
    });
    if (queuedManual.id !== duplicateManual.id) {
      throw new Error('Manual trigger idempotency did not return the existing job');
    }
    await runtime.processNow();
    const manualJob = await waitForJob(runtime, auth, queuedManual.id);
    if (manualJob.status !== 'success') {
      throw new Error(`Queued manual trigger failed: ${JSON.stringify(manualJob)}`);
    }

    const eventKey = `smoke.record.created.${suffix}`;
    const eventTrigger = await flows.createTrigger(auth, flow.id, {
      type: 'record_event',
      key: eventKey,
      active: true
    });
    await runtime.emitEvent(auth, eventKey, {
      payload: { email: user.email },
      aggregateType: 'smoke',
      aggregateId: user.id,
      idempotencyKey: `smoke-event-${suffix}`
    });
    await runtime.processNow();
    const eventJob = await waitForTriggerJob(dataSource, runtime, auth, eventTrigger.id);
    if (eventJob.status !== 'success') {
      throw new Error(`Outbox event trigger failed: ${JSON.stringify(eventJob)}`);
    }

    const webhookSecret = `smoke-secret-${suffix}`;
    const webhookTrigger = await flows.createTrigger(auth, flow.id, {
      type: 'http',
      key: `smoke.webhook.${suffix}`,
      config: { secret: webhookSecret },
      active: true
    });
    const webhookJob = await runtime.fireWebhook(tenant.slug, webhookTrigger.key, webhookSecret, {
      input: { email: user.email },
      idempotencyKey: `smoke-webhook-${suffix}`
    });
    await runtime.processNow();
    if ((await waitForJob(runtime, auth, webhookJob.id)).status !== 'success') {
      throw new Error('Signed webhook trigger failed');
    }

    const scheduleTrigger = await flows.createTrigger(auth, flow.id, {
      type: 'schedule',
      key: `smoke.schedule.${suffix}`,
      config: { intervalSeconds: 10, input: { email: user.email } },
      active: true
    });
    await dataSource.query('UPDATE flow_triggers SET nextFireAt = ? WHERE id = ?', [
      new Date(Date.now() - 1000),
      scheduleTrigger.id
    ]);
    await runtime.processNow();
    const scheduleJob = await waitForTriggerJob(dataSource, runtime, auth, scheduleTrigger.id);
    if (scheduleJob.status !== 'success') {
      throw new Error(`Schedule trigger failed: ${JSON.stringify(scheduleJob)}`);
    }

    const draftTest = await flows.createTestCase(auth, flow.id, {
      name: 'Smoke borrador con tres servicios',
      target: 'draft',
      expectedStatus: 'success',
      input: { email: user.email },
      assertions: [
        { path: 'output.body.userId', operator: 'equals', expected: user.id },
        {
          path: 'output.body.role',
          operator: 'equals',
          expected: membership.systemRole
        },
        {
          path: 'output.body.tenantName',
          operator: 'equals',
          expected: tenant.name
        }
      ]
    });
    const draftTestResult = await flows.runTestCase(auth, flow.id, draftTest.id);
    if (!draftTestResult.passed) {
      throw new Error(`Draft test case failed: ${JSON.stringify(draftTestResult)}`);
    }
    await flows.createTestCase(auth, flow.id, {
      name: 'Smoke versión publicada',
      target: 'published',
      expectedStatus: 'success',
      input: { email: user.email },
      assertions: [
        { path: 'output.body.ok', operator: 'equals', expected: true },
        {
          path: 'output.body.tenantName',
          operator: 'equals',
          expected: tenant.name
        }
      ]
    });
    const suite = await flows.runTestSuite(auth, flow.id);
    if (suite.failed > 0 || suite.passed !== 2) {
      throw new Error(`Flow test suite failed: ${JSON.stringify(suite)}`);
    }

    const execution = await flows.execute(auth, flow.id, {
      input: { email: user.email },
      triggerType: 'test',
      triggerKey: 'container-smoke'
    });
    const body = (execution.output?.['body'] ?? {}) as Record<string, unknown>;
    if (
      execution.status !== 'success' ||
      body['userId'] !== user.id ||
      body['role'] !== membership.systemRole ||
      body['tenantName'] !== tenant.name
    ) {
      throw new Error(`Published execution returned an unexpected result: ${JSON.stringify(execution.output)}`);
    }

    const concurrentRuns = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        flows.execute(auth, flow.id, {
          input: { email: user.email },
          triggerType: 'test',
          triggerKey: `concurrency-smoke-${index}`
        })
      )
    );
    if (concurrentRuns.some((run) => run.status !== 'success')) {
      throw new Error('Concurrent flow execution failed');
    }

    const secondDraft = await flows.update(auth, flow.id, {
      description: 'Smoke version comparison changed description'
    });
    if (!secondDraft) {
      throw new Error('Flow draft update failed before version comparison');
    }
    const secondVersion = await flows.createVersion(auth, flow.id);
    const comparison = await flows.compareVersions(auth, flow.id, version.id, secondVersion.id);
    if (!comparison.summary.changed || comparison.summary.changeCount < 1) {
      throw new Error(`Version comparison did not detect changes: ${JSON.stringify(comparison)}`);
    }
    const restoredDraft = await flows.restoreVersionDraft(auth, flow.id, version.id);
    if (restoredDraft.steps.length !== 4 || restoredDraft.publishedVersion?.id !== version.id) {
      throw new Error('Restoring a version changed the active publication or lost draft steps');
    }

    const duplicate = await flows.duplicate(auth, flow.id, {
      key: `smoke_duplicate_${suffix}`,
      name: 'Smoke flow duplicado'
    });
    createdFlowIds.push(duplicate.id);
    if (duplicate.steps.length !== 4 || duplicate.publishedVersion) {
      throw new Error('Duplicated flow is not an independent draft');
    }

    const savedTemplate = await flows.saveAsTemplate(auth, flow.id, {
      key: `smoke_template_${suffix}`,
      name: 'Smoke plantilla tenant'
    });
    createdTemplateIds.push(savedTemplate.id);
    const templateCatalog = await flows.listTemplates(auth);
    if (!templateCatalog.some((template) => template.id === savedTemplate.id && template.scope === 'tenant')) {
      throw new Error('Tenant flow template is missing from the catalog');
    }
    const systemTemplate = templateCatalog.find((template) => template.scope === 'system');
    if (!systemTemplate) {
      throw new Error('System flow templates were not seeded');
    }
    const templateFlow = await flows.instantiateTemplate(auth, systemTemplate.id, {
      key: `smoke_from_template_${suffix}`,
      name: 'Smoke desde plantilla'
    });
    createdFlowIds.push(templateFlow.id);
    if (!templateFlow.steps.length) {
      throw new Error('Flow instantiated from template has no draft steps');
    }

    const observability = await flows.observability(auth, flow.id, {
      limit: 100
    });
    if (
      observability.summary.total < concurrentRuns.length + 1 ||
      observability.summary.successRate !== 100 ||
      !observability.steps.length
    ) {
      throw new Error(`Flow observability returned unexpected metrics: ${JSON.stringify(observability.summary)}`);
    }

    const role = await rbac.createRole(tenant.id, {
      key: `smoke_role_${suffix}`,
      name: 'Smoke resource access',
      permissions: ['services.execute', 'flows.execute']
    });
    createdRoleId = role.id;
    await rbac.setRoleResourceAccess(tenant.id, role.id, 'dynamic_service', {
      mode: 'selected',
      resourceIds: [userService.id]
    });
    await rbac.setRoleResourceAccess(tenant.id, role.id, 'flow', {
      mode: 'selected',
      resourceIds: [flow.id]
    });
    const roleAuth: AuthContext = {
      ...auth,
      roles: [{ key: role.key, name: role.name }],
      permissions: ['services.execute', 'flows.execute']
    };
    const availableServices = await services.listAvailable(roleAuth);
    const availableFlows = await flows.listAvailable(roleAuth);
    const allowedServiceRun = await services.executeByKey(roleAuth, userService.key, {
      context: { email: user.email }
    });
    const allowedFlowRun = await flows.executeByKey(roleAuth, flow.key, {
      input: { email: user.email },
      triggerType: 'test',
      triggerKey: 'resource-access-smoke'
    });
    let deniedService = false;
    try {
      await services.executeByKey(roleAuth, membershipService.key, {
        context: { userId: user.id }
      });
    } catch {
      deniedService = true;
    }
    await rbac.setRoleResourceAccess(tenant.id, role.id, 'flow', {
      mode: 'none'
    });
    let deniedFlow = false;
    try {
      await flows.executeByKey(roleAuth, flow.key, {
        input: { email: user.email },
        triggerType: 'test',
        triggerKey: 'resource-access-denied-smoke'
      });
    } catch {
      deniedFlow = true;
    }
    if (
      availableServices.length !== 1 ||
      availableServices[0]?.id !== userService.id ||
      !availableFlows.some((item) => item.id === flow.id) ||
      allowedServiceRun.status !== 'success' ||
      allowedFlowRun.status !== 'success' ||
      !deniedService ||
      !deniedFlow
    ) {
      throw new Error('Role resource access smoke test failed');
    }

    const childFlow = await flows.create(auth, {
      key: `smoke_child_${suffix}`,
      name: 'Smoke subflow',
      description: 'Flow hijo reutilizable',
      category: 'testing'
    });
    createdFlowIds.push(childFlow.id);
    await flows.createStep(auth, childFlow.id, {
      key: 'respuesta_hija',
      name: 'Responder desde subflow',
      type: 'response',
      position: 10,
      outputKey: 'respuesta_hija',
      config: {
        status: 'success',
        body: { child: true, email: '{{input.email}}' }
      }
    });
    const childVersion = await flows.createVersion(auth, childFlow.id);
    await flows.publishVersion(auth, childFlow.id, childVersion.id);

    const advancedFlow = await flows.create(auth, {
      key: `smoke_advanced_${suffix}`,
      name: 'Smoke nodos avanzados',
      description: 'Prueba paralelo, foreach, subflow, espera y evento',
      category: 'testing'
    });
    createdFlowIds.push(advancedFlow.id);
    await flows.createStep(auth, advancedFlow.id, {
      key: 'consultas_paralelas',
      name: 'Consultar en paralelo',
      type: 'parallel',
      position: 10,
      outputKey: 'paralelo',
      config: {
        branches: [
          { key: 'usuario_a', serviceKey: userService.key },
          { key: 'usuario_b', serviceKey: userService.key }
        ]
      },
      inputMap: { email: '{{input.email}}' }
    });
    await flows.createStep(auth, advancedFlow.id, {
      key: 'consultar_cada_correo',
      name: 'Consultar cada correo',
      type: 'foreach',
      position: 20,
      outputKey: 'por_cada',
      config: {
        itemsPath: 'input.emails',
        serviceKey: userService.key,
        itemInputKey: 'email',
        concurrency: 2
      }
    });
    await flows.createStep(auth, advancedFlow.id, {
      key: 'espera_breve',
      name: 'Esperar brevemente',
      type: 'delay',
      position: 30,
      outputKey: 'espera',
      config: { durationMs: 5 }
    });
    await flows.createStep(auth, advancedFlow.id, {
      key: 'ejecutar_subflow',
      name: 'Ejecutar flow hijo',
      type: 'subflow',
      position: 40,
      outputKey: 'subflow',
      config: { flowKey: childFlow.key },
      inputMap: { email: '{{input.email}}' }
    });
    await flows.createStep(auth, advancedFlow.id, {
      key: 'emitir_evento',
      name: 'Emitir evento',
      type: 'emit_event',
      position: 50,
      outputKey: 'evento',
      config: {
        eventKey: `smoke.advanced.completed.${suffix}`,
        payload: {
          email: '{{input.email}}',
          child: '{{steps.subflow.output.body.child}}'
        }
      }
    });
    await flows.createStep(auth, advancedFlow.id, {
      key: 'respuesta_avanzada',
      name: 'Construir respuesta avanzada',
      type: 'response',
      position: 60,
      outputKey: 'respuesta',
      config: {
        status: 'success',
        body: {
          parallelOk: '{{steps.paralelo.ok}}',
          foreachCount: '{{steps.por_cada.count}}',
          child: '{{steps.subflow.output.body.child}}',
          eventPersisted: '{{steps.evento.persisted}}'
        }
      }
    });
    const advancedPreview = await flows.preview(auth, advancedFlow.id, {
      input: { email: user.email, emails: [user.email, user.email] }
    });
    if (advancedPreview.status !== 'success' || advancedPreview.steps.length !== 8) {
      throw new Error(`Advanced preview failed: ${JSON.stringify(advancedPreview)}`);
    }
    const advancedVersion = await flows.createVersion(auth, advancedFlow.id);
    await flows.publishVersion(auth, advancedFlow.id, advancedVersion.id);
    const advancedRun = await flows.execute(auth, advancedFlow.id, {
      input: { email: user.email, emails: [user.email, user.email] },
      triggerType: 'test',
      triggerKey: 'advanced-container-smoke'
    });
    const advancedBody = (advancedRun.output?.['body'] ?? {}) as Record<string, unknown>;
    if (
      advancedRun.status !== 'success' ||
      advancedBody['parallelOk'] !== true ||
      advancedBody['foreachCount'] !== 2 ||
      advancedBody['child'] !== true ||
      advancedBody['eventPersisted'] !== true
    ) {
      throw new Error(`Advanced execution returned an unexpected result: ${JSON.stringify(advancedRun)}`);
    }

    const compensationFlow = await flows.create(auth, {
      key: `smoke_compensation_${suffix}`,
      name: 'Smoke compensación',
      description: 'Comprueba compensación en orden inverso',
      category: 'testing'
    });
    createdFlowIds.push(compensationFlow.id);
    await flows.createStep(auth, compensationFlow.id, {
      key: 'operacion_compensable',
      name: 'Operación compensable',
      type: 'dynamic_service',
      position: 10,
      outputKey: 'operacion',
      config: {
        serviceKey: userService.key,
        compensationServiceKey: userService.key
      },
      inputMap: { email: '{{input.email}}' }
    });
    await flows.createStep(auth, compensationFlow.id, {
      key: 'forzar_error',
      name: 'Forzar error',
      type: 'formula',
      position: 20,
      outputKey: 'error',
      config: {
        language: 'json_logic',
        rule: { '/': [1, 0] }
      }
    });
    const compensationVersion = await flows.createVersion(auth, compensationFlow.id);
    await flows.publishVersion(auth, compensationFlow.id, compensationVersion.id);
    const compensationRun = await flows.execute(auth, compensationFlow.id, {
      input: { email: user.email },
      triggerType: 'test',
      triggerKey: 'compensation-container-smoke'
    });
    const compensationError = (compensationRun.error ?? {}) as Record<string, unknown>;
    const compensation = (compensationError['compensation'] ?? {}) as Record<string, unknown>;
    if (compensationRun.status !== 'failed' || compensation['succeeded'] !== 1) {
      throw new Error(`Compensation did not run: ${JSON.stringify(compensationRun)}`);
    }

    console.log(
      JSON.stringify({
        ok: true,
        authoringJson: 'success',
        previewSteps: preview.steps.length,
        chainedServices: 3,
        reactiveRuntime: {
          manual: manualJob.status,
          event: eventJob.status,
          webhook: 'success',
          schedule: scheduleJob.status,
          idempotent: queuedManual.id === duplicateManual.id
        },
        testSuite: { passed: suite.passed, failed: suite.failed },
        resourceAccess: {
          catalogFiltered: true,
          directServiceDenied: deniedService,
          directFlowDenied: deniedFlow,
          flowInternalServices: allowedFlowRun.status
        },
        publishedRunStatus: execution.status,
        lifecycle: {
          versionChanges: comparison.summary.changeCount,
          restoredDraftSteps: restoredDraft.steps.length,
          duplicatedDraftSteps: duplicate.steps.length,
          templates: templateCatalog.length,
          concurrentRuns: concurrentRuns.length,
          observedRuns: observability.summary.total,
          successRate: observability.summary.successRate
        },
        advancedRuntime: {
          previewSteps: advancedPreview.steps.length,
          parallel: advancedBody['parallelOk'],
          foreachItems: advancedBody['foreachCount'],
          subflow: advancedBody['child'],
          event: advancedBody['eventPersisted'],
          compensation: compensation['succeeded']
        },
        output: execution.output
      })
    );
  } finally {
    for (const templateId of createdTemplateIds) {
      await dataSource.query('DELETE FROM flow_templates WHERE id = ?', [templateId]);
      await dataSource.query('DELETE FROM audit_events WHERE resourceId = ?', [templateId]);
    }
    if (createdRoleId) {
      await dataSource.query('DELETE FROM role_resource_grants WHERE roleId = ?', [createdRoleId]);
      await dataSource.query('DELETE FROM role_resource_policies WHERE roleId = ?', [createdRoleId]);
      await dataSource.query('DELETE FROM role_permissions WHERE roleId = ?', [createdRoleId]);
      await dataSource.query('DELETE FROM roles WHERE id = ?', [createdRoleId]);
    }
    for (const flowId of [...createdFlowIds].reverse()) {
      await dataSource.query('DELETE FROM flow_test_cases WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_jobs WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_triggers WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_step_runs WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_runs WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_steps WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flow_versions WHERE flowId = ?', [flowId]);
      await dataSource.query('DELETE FROM flows WHERE id = ?', [flowId]);
    }
    await dataSource.query("DELETE FROM flow_outbox_events WHERE eventKey LIKE 'smoke.%'");
    for (const serviceId of createdServiceIds) {
      await dataSource.query('DELETE FROM dynamic_service_runs WHERE serviceId = ?', [serviceId]);
      await dataSource.query('DELETE FROM dynamic_service_versions WHERE serviceId = ?', [serviceId]);
      await dataSource.query('DELETE FROM dynamic_services WHERE id = ?', [serviceId]);
    }
    for (const flowId of createdFlowIds) {
      await dataSource.query("DELETE FROM audit_events WHERE action LIKE 'flow.%' AND resourceId = ?", [flowId]);
    }
    for (const serviceId of createdServiceIds) {
      await dataSource.query('DELETE FROM audit_events WHERE resourceId = ?', [serviceId]);
    }
    await app.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});

async function waitForJob(runtime: FlowRuntimeService, auth: AuthContext, jobId: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const job = await runtime.getJob(auth, jobId);
    if (['success', 'failed', 'cancelled'].includes(job.status)) {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    await runtime.processNow();
  }
  throw new Error(`Timed out waiting for flow job ${jobId}`);
}

async function waitForTriggerJob(
  dataSource: DataSource,
  runtime: FlowRuntimeService,
  auth: AuthContext,
  triggerId: string
) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const job = await dataSource.getRepository(FlowJob).findOne({
      where: { tenantId: auth.tenant.id, triggerId },
      order: { createdAt: 'DESC' }
    });
    if (job) {
      return waitForJob(runtime, auth, job.id);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    await runtime.processNow();
  }
  throw new Error(`Timed out waiting for trigger job ${triggerId}`);
}
