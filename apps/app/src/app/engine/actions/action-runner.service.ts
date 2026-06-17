import { Injectable } from '@angular/core';

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
  async execute(action: RuntimeAction, context: ActionContext): Promise<unknown> {
    switch (action.type) {
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
}
