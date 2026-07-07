import { authGuard, permissionGuard } from "./core/auth/auth.guard";
import { routes } from "./app.routes";

describe("application route security contract", () => {
  it.each([
    ["confisys", "confisys.read"],
    ["database", "database.read"],
    ["services", "services.read"],
    ["forms", "forms.read"],
  ])("protects /%s with authentication and %s", (path, permission) => {
    const route = routes.find((candidate) => candidate.path === path);

    expect(route?.canActivate).toEqual([authGuard, permissionGuard]);
    expect(route?.data?.["permissions"]).toContain(permission);
  });

  it("protects security administration with all required read permissions", () => {
    const route = routes.find((candidate) => candidate.path === "security");

    expect(route?.canActivate).toEqual([authGuard, permissionGuard]);
    expect(route?.data?.["permissions"]).toEqual([
      "users.read",
      "roles.read",
      "permissions.read",
    ]);
  });

  it.each(["flows", "home", "forms/:formKey"])(
    "requires authentication for /%s",
    (path) => {
      const route = routes.find((candidate) => candidate.path === path);

      expect(route?.canActivate).toContain(authGuard);
    },
  );
});
