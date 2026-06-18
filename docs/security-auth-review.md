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

1. Create roles and permissions entities.
2. Add blank setup seed for base roles and permissions.
3. Complete setup transaction:
   - tenant
   - owner user
   - settings
   - roles
   - permissions
   - owner role assignment
4. Implement login with password verification.
5. Implement JWT/session service using maintained libraries.
6. Add guards:
   - auth guard
   - tenant guard/context
   - permission guard
7. Implement `/auth/me`.
8. Add frontend auth service and route guards.
9. Decide final web token storage strategy before production.
10. Add HTTPS/reverse-proxy deployment path.

## Open Decisions

- Use Argon2id immediately or keep bcrypt for MVP and migrate later.
- Use access-token-in-memory plus refresh cookie, or cookie-only session for web.
- Whether V1 needs MFA or only prepares the schema for MFA.
- Whether mobile/device auth shares user credentials or uses device credentials.
- Production TLS termination component for Docker deploy.
