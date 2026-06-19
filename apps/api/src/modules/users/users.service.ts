import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthContext } from '../auth/auth.types';
import { ConfisysService } from '../confisys/confisys.service';
import { RbacService } from '../rbac/rbac.service';
import { User, UserSystemRole } from './user.entity';

export interface CreateUserRequest {
  email: string;
  name?: string | null;
  password: string;
  roles?: string[];
}

export interface UpdateUserRequest {
  name?: string | null;
  systemRole?: UserSystemRole;
  active?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly rbac: RbacService,
    private readonly confisys: ConfisysService,
    private readonly audit: AuditService
  ) {}

  async list(auth: AuthContext) {
    const users = await this.users.find({
      where: { tenantId: auth.tenant.id },
      order: { email: 'ASC' }
    });

    return Promise.all(users.map((user) => this.toResponse(auth.tenant.id, user)));
  }

  async create(auth: AuthContext, request: CreateUserRequest) {
    this.assertPasswordPolicy(request.password);
    const email = request.email.toLowerCase().trim();
    const exists = await this.users.exist({ where: { tenantId: auth.tenant.id, email } });
    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.users.manager.transaction(async (manager) => {
      const created = await manager.save(
        User,
        this.users.create({
          tenantId: auth.tenant.id,
          email,
          name: request.name?.trim() || null,
          passwordHash: await hash(request.password, 12),
          systemRole: this.primarySystemRole(request.roles)
        })
      );
      await this.rbac.setUserRoles(auth.tenant.id, created.id, request.roles?.length ? request.roles : ['viewer']);
      return created;
    });

    await this.audit.record({
      auth,
      action: 'user.created',
      resourceType: 'user',
      resourceId: user.id,
      metadata: { email: user.email, roles: request.roles?.length ? request.roles : ['viewer'] }
    });

    return this.toResponse(auth.tenant.id, user);
  }

  async update(auth: AuthContext, userId: string, request: UpdateUserRequest) {
    const user = await this.findTenantUser(auth.tenant.id, userId);
    if (request.name !== undefined) {
      user.name = request.name?.trim() || null;
    }
    if (request.systemRole) {
      user.systemRole = request.systemRole;
    }
    if (request.active !== undefined) {
      if (user.id === auth.user.id && request.active === false) {
        throw new BadRequestException('You cannot disable your own user');
      }
      user.active = request.active;
    }

    const saved = await this.users.save(user);
    await this.audit.record({
      auth,
      action: 'user.updated',
      resourceType: 'user',
      resourceId: saved.id,
      metadata: { active: saved.active, systemRole: saved.systemRole }
    });
    return this.toResponse(auth.tenant.id, saved);
  }

  async setRoles(auth: AuthContext, userId: string, roles: string[]) {
    await this.findTenantUser(auth.tenant.id, userId);
    if (userId === auth.user.id && !roles.includes('owner')) {
      throw new BadRequestException('You cannot remove your own owner role');
    }

    const roleKeys = await this.rbac.setUserRoles(auth.tenant.id, userId, roles);
    await this.audit.record({
      auth,
      action: 'user.roles.updated',
      resourceType: 'user',
      resourceId: userId,
      metadata: { roles: roleKeys }
    });

    const user = await this.findTenantUser(auth.tenant.id, userId);
    user.systemRole = this.primarySystemRole(roleKeys);
    await this.users.save(user);
    return this.toResponse(auth.tenant.id, user);
  }

  private async findTenantUser(tenantId: string, userId: string) {
    const user = await this.users.findOne({ where: { id: userId, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async toResponse(tenantId: string, user: User) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole,
      active: user.active,
      roles: await this.rbac.getUserRoleKeys(tenantId, user.id),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private assertPasswordPolicy(password: string) {
    const minLength = this.confisys.get<number>('security.password.minLength', 12);
    if (!password || password.length < minLength) {
      throw new BadRequestException(`Password must be at least ${minLength} characters`);
    }
  }

  private primarySystemRole(roles?: string[]): UserSystemRole {
    if (roles?.includes('owner')) {
      return 'owner';
    }
    if (roles?.includes('admin')) {
      return 'admin';
    }
    if (roles?.includes('operator')) {
      return 'operator';
    }
    if (roles?.includes('viewer')) {
      return 'viewer';
    }

    return 'member';
  }
}
