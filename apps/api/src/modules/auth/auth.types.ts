import { Tenant } from '../tenants/tenant.entity';
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
  sessionId: string;
  tokenId: string;
  roles: Array<{ key: string; name: string }>;
  permissions: string[];
}
