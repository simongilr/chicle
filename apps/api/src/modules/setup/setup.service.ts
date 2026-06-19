import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { DataSource, EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AuditEvent } from '../audit/audit-event.entity';
import { AuthSession } from '../auth/auth-session.entity';
import { ConfisysService } from '../confisys/confisys.service';
import { DynamicForm } from '../dynamic-forms/dynamic-form.entity';
import { RecordEntity } from '../records/record.entity';
import { RolePermission } from '../rbac/role-permission.entity';
import { Role } from '../rbac/role.entity';
import { RbacService } from '../rbac/rbac.service';
import { UserRole } from '../rbac/user-role.entity';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

interface SetupRequest {
  organization: string;
  email: string;
  password: string;
  template?: string;
}

interface ResetRequest {
  confirm: string;
}

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly confisys: ConfisysService,
    private readonly rbac: RbacService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource
  ) {}

  async status() {
    const count = await this.tenants.count();
    const initialized = count > 0;

    return {
      state: initialized ? 'ready' : 'not_created',
      initialized,
      canRunSetup: !initialized,
      tenantCount: count,
      requiredAction: initialized ? 'login' : 'run_setup',
      seedProfile: this.confisys.get<string>('setup.seedProfile', 'blank')
    };
  }

  async createInitialTenant(request: SetupRequest) {
    const current = await this.tenants.count();
    if (current > 0) {
      throw new BadRequestException('System already initialized');
    }
    this.assertPasswordPolicy(request.password);

    const tenant = this.tenants.create({
      name: request.organization,
      slug: this.slugify(request.organization),
      settings: {
        appName: request.organization,
        template: request.template ?? this.confisys.get<string>('setup.seedProfile', 'blank'),
        security: this.confisys.getSecurityPolicy()
      }
    });

    const passwordHash = await hash(request.password, 12);
    const savedTenant = await this.tenants.manager.transaction(async (manager) => {
      const createdTenant = await manager.save(Tenant, tenant);
      const owner = await manager.save(
        User,
        this.users.create({
          tenantId: createdTenant.id,
          email: request.email.toLowerCase().trim(),
          passwordHash,
          systemRole: 'owner'
        })
      );
      await this.rbac.ensureTenantDefaults(createdTenant.id, manager);
      await this.rbac.assignRoleToUser(createdTenant.id, owner.id, 'owner', manager);

      return createdTenant;
    });

    return {
      tenant: savedTenant,
      admin: {
        email: request.email.toLowerCase().trim(),
        role: 'owner'
      },
      next: 'login'
    };
  }

  async resetForDevelopment(request: ResetRequest, resetKey?: string) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('System reset is disabled in production');
    }

    if (this.config.get<string>('CHICLE_ALLOW_SYSTEM_RESET', 'false') !== 'true') {
      throw new ForbiddenException('System reset is disabled');
    }

    const expectedKey = this.config.get<string>('CHICLE_RESET_KEY');
    if (!expectedKey || resetKey !== expectedKey) {
      throw new ForbiddenException('Invalid reset key');
    }

    if (request.confirm !== 'RESET CHICLE ENGINE') {
      throw new BadRequestException('Invalid confirmation phrase');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.deleteAll(manager, AuditEvent);
      await this.deleteAll(manager, AuthSession);
      await this.deleteAll(manager, RecordEntity);
      await this.deleteAll(manager, DynamicForm);
      await this.deleteAll(manager, UserRole);
      await this.deleteAll(manager, RolePermission);
      await this.deleteAll(manager, Role);
      await this.deleteAll(manager, User);
      await this.deleteAll(manager, Tenant);
    });

    return {
      ok: true,
      state: 'not_created',
      preserved: ['confisys', 'permissions']
    };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private deleteAll(manager: EntityManager, entity: EntityTarget<ObjectLiteral>) {
    return manager.createQueryBuilder().delete().from(entity).execute();
  }

  private assertPasswordPolicy(password: string) {
    const minLength = this.confisys.get<number>('security.password.minLength', 12);
    if (!password || password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters`);
    }
  }
}
