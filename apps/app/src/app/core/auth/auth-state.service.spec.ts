import { TestBed } from "@angular/core/testing";
import { AuthStateService } from "./auth-state.service";
import { LoginResponse } from "./auth.types";

describe("AuthStateService", () => {
  const login: LoginResponse = {
    accessToken: "access-token",
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id: "user-1",
      tenantId: "tenant-1",
      email: "owner@example.com",
      name: "Owner",
      systemRole: "owner",
    },
    tenant: {
      id: "tenant-1",
      slug: "acme",
      name: "Acme",
    },
    roles: [{ key: "operator", name: "Operator" }],
    permissions: ["services.read", "services.execute"],
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("persists a validated tenant session and resolves roles and permissions", () => {
    const state = TestBed.inject(AuthStateService);

    state.setLogin(login);

    expect(state.isAuthenticated).toBe(true);
    expect(state.validated()).toBe(true);
    expect(state.hasPermission("services.execute")).toBe(true);
    expect(state.hasAllPermissions(["services.read", "services.execute"])).toBe(
      true,
    );
    expect(state.hasRole("owner")).toBe(true);
    expect(state.hasRole("operator")).toBe(true);
    expect(state.isOwnerOrAdmin).toBe(true);
    expect(sessionStorage.getItem("chicle.accessToken")).toBe("access-token");
  });

  it("clears both memory and browser session state on logout", () => {
    const state = TestBed.inject(AuthStateService);
    state.setLogin(login);

    state.clear();

    expect(state.isAuthenticated).toBe(false);
    expect(state.validated()).toBe(false);
    expect(state.session()).toBeNull();
    expect(state.token()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("discards a corrupted stored session instead of authenticating it", () => {
    sessionStorage.setItem("chicle.accessToken", "stale-token");
    sessionStorage.setItem("chicle.session", "{broken");
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const state = TestBed.inject(AuthStateService);

    expect(state.session()).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem("chicle.session")).toBeNull();
  });
});
