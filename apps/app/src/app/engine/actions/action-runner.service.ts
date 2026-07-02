import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DynamicFlowClientService } from '../../core/services/dynamic-flow-client.service';

export interface ActionContext {
  form?: Record<string, unknown>;
  record?: Record<string, unknown>;
  device?: Record<string, unknown>;
}

export interface RuntimeAction {
  type: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ActionRunnerService {
  private readonly flows = inject(DynamicFlowClientService);

  async execute(action: RuntimeAction, context: ActionContext): Promise<unknown> {
    switch (action.type) {
      case 'execute_flow': {
        const flowKey = typeof action['flowKey'] === 'string' ? action['flowKey'].trim() : '';
        if (!flowKey) {
          return {
            handled: false,
            reason: 'execute_flow requires flowKey',
            action,
            context
          };
        }
        const payloadMap = this.asRecord(action['payloadMap']);
        const input = Object.entries(payloadMap).reduce<Record<string, unknown>>((payload, [key, value]) => {
          payload[key] = this.resolveValue(value, context);
          return payload;
        }, {});
        return firstValueFrom(this.flows.execute(flowKey, input));
      }
      case 'show_modal':
        return { handled: true, action, context };
      case 'navigate':
        return { handled: true, action, context };
      case 'create_record':
        return { handled: false, reason: 'create_record handler pending', action, context };
      default:
        return { handled: false, reason: `Unknown action ${action.type}` };
    }
  }

  private resolveValue(value: unknown, context: ActionContext): unknown {
    if (typeof value !== 'string') {
      return value;
    }
    const match = value.match(/^{{\s*(form|record|device)\.([^}]+)\s*}}$/);
    if (!match) {
      return value;
    }
    const source = context[match[1] as keyof ActionContext];
    return match[2].split('.').reduce<unknown>((current, part) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[part];
    }, source);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }
}
