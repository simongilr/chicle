import { TestBed } from "@angular/core/testing";
import { Router, UrlTree, provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiClientService } from "../api/api-client.service";
import { setupRedirectGuard } from "./setup-redirect.guard";

describe("setupRedirectGuard", () => {
  const api = {
    get: jest.fn(),
  };
  let router: Router;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiClientService, useValue: api },
      ],
    });
    router = TestBed.inject(Router);
  });

  it.each([
    ["ready", "/login"],
    ["not_created", "/setup"],
  ] as const)("redirects setup state %s to %s", async (state, expectedUrl) => {
    api.get.mockReturnValue(of({ state }));

    const result = await TestBed.runInInjectionContext(() =>
      setupRedirectGuard({} as never, {} as never),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe(expectedUrl);
  });

  it("treats an unavailable API as setup recovery instead of a ready system", async () => {
    api.get.mockReturnValue(throwError(() => new Error("API unavailable")));

    const result = await TestBed.runInInjectionContext(() =>
      setupRedirectGuard({} as never, {} as never),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe("/setup");
  });
});
