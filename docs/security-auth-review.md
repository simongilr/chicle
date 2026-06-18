# Security And Auth Review

## Purpose

Before implementing Chicle Engine authentication, authorization and tenant scope, we will compare the old SmartSeal admin approach against current security guidance and decide what to reuse, adapt or reject.

This document is intentionally generic. SmartSeal remains a reference, not core product architecture.

## References

- OWASP ASVS 5.0.0: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP JWT Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- OWASP TLS Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
- NIST SP 800-63B: https://pages.nist.gov/800-63-4/sp800-63b.html

## Old SmartSeal Admin Findings

Reviewed local references:

- `/Users/user/.codex/worktrees/ba38/Smart-Seal-Api-Admin/src/modules/auth`
- `/Users/user/.codex/worktrees/ba38/Smart-Seal-Api-Admin/src/modules/usuarios`
- `/Users/user/.codex/worktrees/ba38/Smart-Seal-Api-Admin/src/modules/roles`
- `/Users/user/.codex/worktrees/ba38/Smart-Seal-Front-End/src/app/core/interceptors`
- `/Users/user/.codex/worktrees/ba38/Smart-Seal-Front-End/src/app/features/auth`

### Useful Ideas To Reuse

- Roles and permissions as first-class concepts.
- Permission names as stable strings such as `usuarios.listar` and `roles.editar`.
- Many-to-many role-permission and user-role relationships.
- Server returns user permissions after login for UI filtering.
- Frontend permission guard for hiding or blocking screens.
- Transactional role and user assignment.
- Password hashing before persistence.
- Generic `me` endpoint to hydrate the session.

### Patterns To Avoid Or Replace

- Do not hand-roll JWT signing and verification. Use maintained JWT libraries and constant-time verification.
- Do not use a fallback JWT secret in code. Missing secrets should fail startup outside local development.
- Do not rely on frontend permissions for enforcement. UI guards are only convenience; backend guards decide.
- Do not store long-lived access tokens in `localStorage` for the web app.
- Do not put an HMAC secret in frontend code. A browser secret is visible to the user and cannot prove trust.
- Do not treat username `superadmin` as a bypass. Privilege must come from server-side role/permission state.
- Do not return temporary passwords as a normal operational pattern except controlled bootstrap or reset flows.
- Do not mix domain-specific roles into core. Core roles must stay generic.

## Chicle Engine Target Design

### Modular Security Policy

Authentication is configured per tenant through a security policy stored in tenant settings.

The policy controls:

- Security level: `basic`, `standard`, `high`.
- MFA requirement.
- Password login availability and password hash strategy.
- Web session strategy.
- Enabled auth methods by channel:
  - `web`
  - `mobile`
  - `device`
- Optional provider keys for external providers.

Supported method types are planned as:

- `password`
- `oauth2`
- `oidc`
- `saml`
- `magic_link`
- `device_code`
- `passkey`

Visual components must read the public auth config before rendering login actions. If a method is disabled for the current channel, the UI must not present it as an available action. Backend guards still remain authoritative.

### Authentication

- First admin is created only through first-run setup.
- Passwords are never stored or logged in plain text.
- Prefer Argon2id for new password hashes. Bcrypt with a strong cost is acceptable as a compatibility fallback.
- Password policy:
  - Minimum length should be configurable.
  - Allow long passphrases.
  - Avoid arbitrary composition rules as the main security control.
  - Add breached/weak password screening later.
- Login response must not leak whether email or password failed.
- Add rate limiting and account lock/risk delay before production.

### Sessions And Tokens

For web:

- Prefer short-lived access token plus refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie.
- Keep access tokens short-lived.
- Store only non-sensitive display/session state in browser storage.
- Logout should invalidate the refresh/session record server-side.

For mobile or field devices:

- Use bearer access tokens plus refresh tokens stored in platform secure storage.
- Device login should have a separate credential model and revocation path.

For all clients:

- Include `sub`, `tenantId`, `sid` or `jti`, `iat`, `exp`, and token version where needed.
- Validate that the user, tenant and session are still active on protected requests.
- Keep refresh token rotation and reuse detection on the roadmap.

### Authorization

- Use RBAC first: users, roles, permissions.
- Every permission is a stable string.
- Backend guards enforce permissions.
- Frontend guards only improve navigation and UX.
- Tenant scoping is mandatory on every operational entity.
- Every protected request resolves:
  - current user
  - current tenant
  - current session
  - effective permissions
- Setup endpoint is only available while `setup/status.state === "not_created"`.

### Default Seeds

Core blank seed should create:

- Tenant.
- First owner/admin user.
- Base settings.
- Base roles:
  - `owner`
  - `admin`
  - `operator`
  - `viewer`
- Base permissions grouped by capability:
  - `settings.read`
  - `settings.update`
  - `users.read`
  - `users.create`
  - `users.update`
  - `users.disable`
  - `roles.read`
  - `roles.manage`
  - `permissions.read`
  - `menus.read`
  - `forms.read`
  - `forms.manage`
  - `records.read`
  - `records.create`
  - `records.update`
  - `files.upload`
  - `files.read`
  - `audit.read`

Business templates may add domain permissions, but core must not know SmartSeal concepts.

## Transport Security

Frontend-to-backend communication must be protected by TLS in deployed environments.

Decision:

- Use HTTPS/TLS as the encryption layer.
- Do not invent custom payload encryption between browser and API.
- Do not use a frontend HMAC secret as an authentication control.
- Use HSTS in production.
- Use secure cookies only over HTTPS.
- Local development may use HTTP on localhost.
- Docker V1 may terminate TLS at a reverse proxy later.
- Internal service-to-service TLS can be added when API, app and database cross trust boundaries.

## Initial Implementation Sequence

1. Create roles and permissions entities. Done.
2. Add blank setup seed for base roles and permissions. Done.
3. Complete setup transaction. Done:
   - tenant
   - owner user
   - settings
   - roles
   - permissions
   - owner role assignment
4. Implement login with password verification. Done.
5. Implement JWT/session service using maintained libraries. Done for access tokens and server-side sessions.
6. Add guards. Partially done:
   - auth guard
   - tenant/user/session context
   - permission guard
7. Implement `/auth/me`. Done.
8. Protect sensitive endpoints. Started with `confisys.read` and `confisys.update`.
9. Add frontend auth service and route guards. Done for MVP bearer session.
10. Decide final web token storage strategy before production.
11. Add HTTPS/reverse-proxy deployment path.

## Current Backend Security State

Implemented:

- `permissions`, `roles`, `role_permissions`, `user_roles`.
- `auth_sessions` with server-side active session validation.
- Base permissions and roles for blank setup.
- First setup creates owner role assignment in the same transaction.
- Password login validates bcrypt hashes and returns generic 401 failures.
- JWT access tokens include `sub`, `tenantId`, `sid`, `jti`, `iat`, `exp`.
- `/auth/me` returns current user, tenant, roles and effective permissions.
- `JwtAuthGuard`, `PermissionsGuard` and `@RequirePermissions(...)`.
- Private `confisys` endpoints require authentication and permissions.
- Frontend login submits to `/auth/login`, stores the short-lived bearer token in `sessionStorage`, hydrates with `/auth/me`, and guards protected routes.
- Frontend sends `Authorization: Bearer` automatically for API calls.
- Frontend hides `confisys` navigation without `confisys.read` and disables saves without `confisys.update`.
- Logout calls `/auth/logout`, clears session state and invalidates the server-side session.

Still pending:

- Refresh token or cookie session strategy for production web.
- Rate limiting and risk controls for login.
- User and role administration screens/endpoints.
- Broader endpoint protection as each module becomes real.

## Open Decisions

- Use Argon2id immediately or keep bcrypt for MVP and migrate later.
- Use access-token-in-memory plus refresh cookie, or cookie-only session for web.
- Whether V1 needs MFA or only prepares the schema for MFA.
- Whether mobile/device auth shares user credentials or uses device credentials.
- Production TLS termination component for Docker deploy.
