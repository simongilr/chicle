import { Tenant } from '../tenants/tenant.entity';
import { TenantMembership } from '../tenants/tenant-membership.entity';
import { User } from '../users/user.entity';

export interface AuthTokenPayload {
  sub: string;
  tenantId: string;
  sid: string;
  jti: string;
}

export interface AuthContext {
  user: User;
  tenant: Tenant;
  membership: TenantMembership;
  sessionId: string;
  tokenId: string;
  roles: Array<{ key: string; name: string }>;
  permissions: string[];
}
