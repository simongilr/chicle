import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { ApiClientService } from "../api/api-client.service";
import { UiPresentationService } from "./ui-presentation.service";

describe("UiPresentationService", () => {
  const api = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: api }],
    });
  });

  it("selects PrimeNG for web previews and Ionic for native mobile apps with the default profile", () => {
    const presentation = TestBed.inject(UiPresentationService);

    expect(presentation.resolve({ width: 390, platform: "web" })).toMatchObject(
      {
        kit: "primeng",
        source: "rule",
      },
    );
    expect(
      presentation.resolve({ width: 1280, platform: "web" }),
    ).toMatchObject({
      kit: "primeng",
      source: "rule",
    });
    expect(
      presentation.resolve({ width: 1280, platform: "ios" }),
    ).toMatchObject({
      kit: "ionic",
      source: "rule",
    });
  });

  it("gives explicit local configuration priority over parent and adaptive rules", () => {
    const presentation = TestBed.inject(UiPresentationService);

    const result = presentation.resolve({
      width: 390,
      platform: "android",
      parent: { kit: "ionic", theme: "parent-theme" },
      local: {
        kit: "native",
        theme: "local-theme",
        profileKey: "screen-profile",
      },
    });

    expect(result).toEqual({
      kit: "native",
      theme: "local-theme",
      profileKey: "screen-profile",
      source: "local",
    });
  });

  it("loads and normalizes the persisted presentation profile", () => {
    api.get.mockReturnValue(
      of([
        {
          key: "ui.presentation.defaultProfile",
          value: {
            key: "tenant-profile",
            theme: "material",
            defaultKit: "native",
            rules: [
              { kit: "primeng", minWidth: 900, platforms: ["web", "invalid"] },
            ],
          },
        },
      ]),
    );
    const presentation = TestBed.inject(UiPresentationService);

    presentation.ensureGlobalProfileLoaded();

    expect(api.get).toHaveBeenCalledWith("confisys/public");
    expect(presentation.profile()).toEqual({
      key: "tenant-profile",
      theme: "material",
      defaultKit: "native",
      rules: [
        {
          kit: "primeng",
          minWidth: 900,
          maxWidth: undefined,
          platforms: ["web"],
        },
      ],
    });
    expect(
      presentation.resolve({ width: 1200, platform: "web" }),
    ).toMatchObject({
      kit: "primeng",
      theme: "material",
      source: "rule",
    });
  });
});
