import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { ConfisysService } from '../confisys/confisys.service';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';

interface SetupRequest {
  organization: string;
  email: string;
  password: string;
  template?: string;
}

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly confisys: ConfisysService
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
      await manager.save(
        User,
        this.users.create({
          tenantId: createdTenant.id,
          email: request.email.toLowerCase().trim(),
          passwordHash,
          systemRole: 'owner'
        })
      );

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

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
