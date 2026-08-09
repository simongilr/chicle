import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DynamicServiceClientService } from '../../core/services/dynamic-service-client.service';
import { DynamicFlowClientService } from '../../core/services/dynamic-flow-client.service';
import { DeclarativeBindingResolverService } from '../components/declarative-binding-resolver.service';
import { DeclarativeComponentAction, DeclarativeComponentContext } from '../components/declarative-component.types';

export interface ActionContext extends DeclarativeComponentContext {
  form?: Record<string, unknown>;
  record?: Record<string, unknown>;
  device?: Record<string, unknown>;
}

export type RuntimeAction = DeclarativeComponentAction | { type: string; [key: string]: unknown };

const OFFLINE_QUEUE_KEY = 'chicle.declarative.offline.queue';

@Injectable({ providedIn: 'root' })
export class ActionRunnerService {
  private readonly router = inject(Router);
  private readonly services = inject(DynamicServiceClientService);
  private readonly flows = inject(DynamicFlowClientService);
  private readonly bindings = inject(DeclarativeBindingResolverService);

  async execute(action: RuntimeAction, context: ActionContext = {}): Promise<unknown> {
    const resolvedAction = this.bindings.resolveDeep(action, context) as RuntimeAction;

    if (!resolvedAction?.type) {
      return { handled: false, reason: 'action.type is required', action: resolvedAction };
    }

    switch (resolvedAction.type) {
      case 'navigate': {
        const target = this.stringValue(resolvedAction['to']) || this.stringValue(resolvedAction['route']);
        if (!target) {
          return { handled: false, reason: 'navigate requires to or route', action: resolvedAction };
        }
        await this.router.navigateByUrl(target);
        return { handled: true, type: 'navigate', target };
      }
      case 'execute_service': {
        const serviceKey = this.stringValue(resolvedAction['serviceKey']);
        if (!serviceKey) {
          return { handled: false, reason: 'execute_service requires serviceKey', action: resolvedAction };
        }
        const payload = this.payloadFor(resolvedAction, context);
        return firstValueFrom(this.services.execute(serviceKey, payload));
      }
      case 'execute_flow': {
        const flowKey = this.stringValue(resolvedAction['flowKey']);
        if (!flowKey) {
          return { handled: false, reason: 'execute_flow requires flowKey', action: resolvedAction };
        }
        const input = this.payloadFor(resolvedAction, context);
        return firstValueFrom(this.flows.execute(flowKey, input));
      }
      case 'submit_form':
        return { handled: true, type: 'submit_form', formKey: this.stringValue(resolvedAction['formKey']) || null };
      case 'open_modal':
      case 'show_modal':
        return {
          handled: true,
          type: 'open_modal',
          modalKey: this.stringValue(resolvedAction['modalKey']) || this.stringValue(resolvedAction['templateKey']) || null,
          action: resolvedAction
        };
      case 'show_message':
        return {
          handled: true,
          type: 'show_message',
          tone: this.stringValue(resolvedAction['tone']) || 'info',
          message: this.stringValue(resolvedAction['message']) || this.stringValue(resolvedAction['text']) || 'Action completed.'
        };
      case 'set_state': {
        const key = this.stringValue(resolvedAction['key']) || this.stringValue(resolvedAction['path']);
        if (!key) {
          return { handled: false, reason: 'set_state requires key or path', action: resolvedAction };
        }
        const value = Object.prototype.hasOwnProperty.call(resolvedAction, 'value') ? resolvedAction['value'] : context.value;
        context.state ??= {};
        this.setByPath(context.state, key, value);
        return { handled: true, type: 'set_state', key, value };
      }
      case 'refresh_data':
        return {
          handled: true,
          type: 'refresh_data',
          target: this.stringValue(resolvedAction['target']) || this.stringValue(resolvedAction['sourceKey']) || 'default'
        };
      case 'queue_offline': {
        const queued = this.queueOffline(resolvedAction, context);
        return { handled: true, type: 'queue_offline', queued };
      }
      case 'emit_event':
        return {
          handled: true,
          type: 'emit_event',
          eventKey: this.stringValue(resolvedAction['eventKey']) || this.stringValue(resolvedAction['name']) || 'event',
          payload: this.payloadFor(resolvedAction, context)
        };
      case 'create_record':
        return { handled: false, reason: 'create_record handler pending', action: resolvedAction, context };
      default:
        return { handled: false, reason: `Unknown action ${resolvedAction.type}` };
    }
  }

  private payloadFor(action: RuntimeAction, context: ActionContext): Record<string, unknown> {
    const payloadMap = this.asRecord(action['payloadMap']) ?? {};
    if (Object.keys(payloadMap).length) {
      return this.bindings.resolveDeep(payloadMap, context) as Record<string, unknown>;
    }
    const input = this.asRecord(action['input']) ?? this.asRecord(action['context']) ?? {};
    if (Object.keys(input).length) {
      return this.bindings.resolveDeep(input, context) as Record<string, unknown>;
    }
    if (context.value && typeof context.value === 'object' && !Array.isArray(context.value)) {
      return context.value as Record<string, unknown>;
    }
    return context.state ?? {};
  }

  private queueOffline(action: RuntimeAction, context: ActionContext) {
    const current = this.readOfflineQueue();
    const item = {
      id: crypto.randomUUID(),
      type: action.type,
      queueKey: this.stringValue(action['queueKey']) || 'default',
      action,
      context: {
        state: context.state ?? {},
        data: context.data ?? {},
        value: context.value ?? null
      },
      createdAt: new Date().toISOString()
    };
    current.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    return item;
  }

  private readOfflineQueue(): Array<Record<string, unknown>> {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private setByPath(target: Record<string, unknown>, path: string, value: unknown) {
    const parts = path.split('.').filter(Boolean);
    const last = parts.pop();
    if (!last) {
      return;
    }
    let current = target;
    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[last] = value;
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }
}
