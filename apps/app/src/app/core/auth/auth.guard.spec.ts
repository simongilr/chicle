import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from "@angular/router";
import { AuthService } from "./auth.service";
import { authGuard, loginGuard, permissionGuard } from "./auth.guard";

interface MockAuthState {
  isAuthenticated: boolean;
  validated: jest.Mock<boolean, []>;
  token: jest.Mock<string | null, []>;
  isOwnerOrAdmin: boolean;
  hasAllPermissions: jest.Mock<boolean, [string[]]>;
}

describe("authentication and permission guards", () => {
  let state: MockAuthState;
  let auth: {
    state: MockAuthState;
    hydrate: jest.Mock<Promise<boolean>, []>;
  };
  let router: Router;

  beforeEach(() => {
    state = {
      isAuthenticated: false,
      validated: jest.fn(() => false),
      token: jest.fn(() => null),
      isOwnerOrAdmin: false,
      hasAllPermissions: jest.fn<boolean, [string[]]>(() => false),
    };
    auth = {
      state,
      hydrate: jest.fn().mockResolvedValue(false),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    router = TestBed.inject(Router);
  });

  it("redirects an unauthenticated protected route and preserves returnUrl", async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/services" } as RouterStateSnapshot,
      ),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      "/login?returnUrl=%2Fservices",
    );
    expect(auth.hydrate).toHaveBeenCalledTimes(1);
  });

  it("allows a validated session without hydrating again", () => {
    state.isAuthenticated = true;
    state.validated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/home" } as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
    expect(auth.hydrate).not.toHaveBeenCalled();
  });

  it("denies a validated user that lacks an administrative permission", () => {
    state.isAuthenticated = true;
    state.validated.mockReturnValue(true);
    const route = {
      data: { permissions: ["database.read"] },
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, { url: "/database" } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe("/home");
    expect(state.hasAllPermissions).toHaveBeenCalledWith(["database.read"]);
  });

  it("allows owners even when a granular permission is absent", () => {
    state.isAuthenticated = true;
    state.validated.mockReturnValue(true);
    state.isOwnerOrAdmin = true;
    const route = {
      data: { permissions: ["database.read"] },
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, { url: "/database" } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it("keeps anonymous users on login and redirects authenticated users home", () => {
    const anonymous = TestBed.runInInjectionContext(() =>
      loginGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/login" } as RouterStateSnapshot,
      ),
    );
    expect(anonymous).toBe(true);

    state.isAuthenticated = true;
    state.validated.mockReturnValue(true);
    const authenticated = TestBed.runInInjectionContext(() =>
      loginGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/login" } as RouterStateSnapshot,
      ),
    );
    expect(router.serializeUrl(authenticated as UrlTree)).toBe("/home");
  });
});
