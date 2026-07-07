import { SimpleChange } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DynamicFlowClientService } from "../../core/services/dynamic-flow-client.service";
import { DynamicServiceClientService } from "../../core/services/dynamic-service-client.service";
import { RuntimeForm } from "../../engine/forms/form-runtime.service";
import { FormlyRuntimeComponent } from "./formly-runtime.component";

describe("FormlyRuntimeComponent", () => {
  const services = {
    execute: jest.fn(),
  };
  const flows = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    services.execute.mockReturnValue(of({ ok: true, result: [] }));
    flows.execute.mockReturnValue(of({ ok: true, result: {} }));
    TestBed.configureTestingModule({
      providers: [
        { provide: DynamicServiceClientService, useValue: services },
        { provide: DynamicFlowClientService, useValue: flows },
      ],
    });
  });

  it("renders desktop step cards as a continuous multi-section form", () => {
    const component = createComponent();
    component.definition = formDefinition({
      layout: {
        desktop: { mode: "step_cards" },
        mobile: { mode: "step_screens" },
      },
    });
    component.viewportWidth = 1280;

    component.ngOnChanges({
      definition: new SimpleChange(undefined, component.definition, true),
    });

    expect(component.isContinuousLayout).toBe(true);
    expect(component.isCardLayout).toBe(true);
    expect(component.showStepper).toBe(false);
    expect(component.renderedSteps).toHaveLength(2);
    expect(component.fields).toHaveLength(2);
  });

  it("renders mobile step screens as paged navigation", () => {
    const component = createComponent();
    component.definition = formDefinition({
      layout: {
        desktop: { mode: "step_cards" },
        mobile: { mode: "step_screens" },
      },
    });
    component.viewportWidth = 390;

    component.ngOnChanges({
      definition: new SimpleChange(undefined, component.definition, true),
    });

    expect(component.isContinuousLayout).toBe(false);
    expect(component.showStepper).toBe(true);
    expect(component.fields).toHaveLength(1);
  });

  it("loads dynamic select options from a published service", () => {
    services.execute.mockReturnValue(
      of({
        ok: true,
        result: [
          { id: "co", name: "Colombia" },
          { id: "mx", name: "Mexico" },
        ],
      }),
    );
    const component = createComponent();
    component.definition = formDefinition({
      steps: [
        {
          key: "lookup",
          title: "Lookup",
          fields: [
            {
              key: "country",
              name: "country",
              label: "Country",
              type: "select",
              dataSource: {
                type: "dynamic_service",
                serviceKey: "catalog_countries",
              },
            },
          ],
        },
      ],
    });

    component.ngOnChanges({
      definition: new SimpleChange(undefined, component.definition, true),
    });

    expect(services.execute).toHaveBeenCalledWith("catalog_countries", {
      input: {},
    });
    expect(component.definition.steps?.[0].fields[0].options).toEqual([
      { label: "Colombia", value: "co" },
      { label: "Mexico", value: "mx" },
    ]);
  });

  it("executes configured service commands with the current model", () => {
    const component = createComponent();
    component.definition = formDefinition({
      commands: [
        {
          key: "validate",
          label: "Validate",
          event: "onClick",
          type: "execute_service",
          serviceKey: "validate_client",
        },
      ],
    });
    component.model = { email: "person@example.com" };

    component.ngOnChanges({
      definition: new SimpleChange(undefined, component.definition, true),
      model: new SimpleChange(undefined, component.model, true),
    });

    component.runCommand(component.runtimeCommands[0]);

    expect(services.execute).toHaveBeenCalledWith("validate_client", {
      input: { email: "person@example.com" },
    });
  });

  function createComponent() {
    return TestBed.runInInjectionContext(() => new FormlyRuntimeComponent());
  }

  function formDefinition(overrides: Partial<RuntimeForm> = {}): RuntimeForm {
    return {
      key: "test_form",
      title: "Test form",
      version: 1,
      fields: [],
      layout: {
        desktop: { mode: "step_cards" },
        mobile: { mode: "step_screens" },
      },
      steps: [
        {
          key: "identity",
          title: "Identity",
          fields: [
            {
              key: "name",
              name: "name",
              label: "Name",
              type: "text",
            },
          ],
        },
        {
          key: "contact",
          title: "Contact",
          fields: [
            {
              key: "email",
              name: "email",
              label: "Email",
              type: "email",
            },
          ],
        },
      ],
      ...overrides,
    };
  }
});
