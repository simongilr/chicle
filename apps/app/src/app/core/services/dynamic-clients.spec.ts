import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import { ApiClientService } from "../api/api-client.service";
import {
  DynamicFlowClientService,
  DynamicFlowRun,
} from "./dynamic-flow-client.service";
import {
  DynamicServiceClientService,
  DynamicServiceRunResponse,
} from "./dynamic-service-client.service";

describe("dynamic frontend clients", () => {
  const api = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: api }],
    });
  });

  it("discovers and executes a published dynamic service by encoded key", async () => {
    const run: DynamicServiceRunResponse = {
      id: "service-run-1",
      status: "success",
      triggerType: "frontend",
      responseSnapshot: { result: { id: "user-1", name: "Simon" } },
      durationMs: 12,
      createdAt: "2026-07-04T00:00:00.000Z",
    };
    api.get.mockReturnValue(
      of([{ id: "service-1", key: "buscar usuario", name: "Buscar usuario" }]),
    );
    api.post.mockReturnValue(of(run));
    const client = TestBed.inject(DynamicServiceClientService);

    await firstValueFrom(client.available());
    const execution = await firstValueFrom(
      client.execute<{ id: string }>("buscar usuario", { name: "Simon" }),
    );

    expect(api.get).toHaveBeenCalledWith("dynamic-services/available");
    expect(api.post).toHaveBeenCalledWith(
      "dynamic-services/by-key/buscar%20usuario/execute",
      {
        context: { name: "Simon" },
      },
    );
    expect(execution.ok).toBe(true);
    expect(execution.result).toEqual({ id: "user-1", name: "Simon" });
    expect(execution.error).toBeNull();
  });

  it("preserves a failed service run for the UI", async () => {
    const run: DynamicServiceRunResponse = {
      id: "service-run-2",
      status: "failed",
      triggerType: "frontend",
      responseSnapshot: null,
      error: "Validation failed",
      durationMs: 4,
      createdAt: "2026-07-04T00:00:00.000Z",
    };
    api.post.mockReturnValue(of(run));
    const client = TestBed.inject(DynamicServiceClientService);

    const execution = await firstValueFrom(client.execute("validar"));

    expect(execution.ok).toBe(false);
    expect(execution.result).toBeNull();
    expect(execution.error).toBe("Validation failed");
    expect(execution.run).toBe(run);
  });

  it("discovers and executes a published flow without generated frontend code", async () => {
    const run: DynamicFlowRun = {
      id: "flow-run-1",
      status: "success",
      output: { approved: true },
      error: null,
    };
    api.get.mockReturnValue(
      of([{ id: "flow-1", key: "validar usuario", name: "Validar usuario" }]),
    );
    api.post.mockReturnValue(of(run));
    const client = TestBed.inject(DynamicFlowClientService);

    await firstValueFrom(client.available());
    const execution = await firstValueFrom(
      client.execute<{ approved: boolean }>("validar usuario", { userId: "1" }),
    );

    expect(api.get).toHaveBeenCalledWith("flows/available");
    expect(api.post).toHaveBeenCalledWith(
      "flows/by-key/validar%20usuario/execute",
      {
        input: { userId: "1" },
      },
    );
    expect(execution).toEqual({
      ok: true,
      run,
      result: { approved: true },
      error: null,
    });
  });
});
