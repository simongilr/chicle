import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';

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
    private readonly tenants: Repository<Tenant>
  ) {}

  async status() {
    const count = await this.tenants.count();
    return {
      initialized: count > 0
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
        template: request.template ?? 'blank'
      }
    });

    await this.tenants.save(tenant);

    return {
      tenant,
      admin: {
        email: request.email
      },
      next: 'auth implementation'
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
