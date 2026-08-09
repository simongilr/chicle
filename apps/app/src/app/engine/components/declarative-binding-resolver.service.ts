import { Injectable } from '@angular/core';
import { DeclarativeComponentContext, DeclarativeComponentContract } from './declarative-component.types';

@Injectable({ providedIn: 'root' })
export class DeclarativeBindingResolverService {
  resolveProps(contract: DeclarativeComponentContract, context?: DeclarativeComponentContext): Record<string, unknown> {
    const props = { ...(contract.props ?? {}) };
    const bindings = this.asObject(contract.bindings);
    if (!bindings) {
      return this.resolveDeep(props, context) as Record<string, unknown>;
    }

    const propsBindings = this.asObject(bindings['props']);
    if (propsBindings) {
      for (const [key, value] of Object.entries(propsBindings)) {
        this.setByPath(props, key, this.resolveDeep(value, context));
      }
    }

    for (const [key, value] of Object.entries(bindings)) {
      if (key === 'props' || key === 'data' || key === 'state') {
        continue;
      }
      if (key.startsWith('props.')) {
        this.setByPath(props, key.slice('props.'.length), this.resolveDeep(value, context));
        continue;
      }
      if (!key.includes('.')) {
        props[key] = this.resolveDeep(value, context);
      }
    }

    return this.resolveDeep(props, context) as Record<string, unknown>;
  }

  resolveDeep(value: unknown, context?: DeclarativeComponentContext): unknown {
    if (typeof value === 'string') {
      return this.resolveString(value, context);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveDeep(item, context));
    }
    const object = this.asObject(value);
    if (!object) {
      return value;
    }
    return Object.entries(object).reduce<Record<string, unknown>>((resolved, [key, entry]) => {
      resolved[key] = this.resolveDeep(entry, context);
      return resolved;
    }, {});
  }

  private resolveString(value: string, context?: DeclarativeComponentContext): unknown {
    const exact = value.match(/^{{\s*([^}]+)\s*}}$/);
    if (exact) {
      return this.resolvePath(exact[1], context);
    }
    return value.replace(/{{\s*([^}]+)\s*}}/g, (_match, path: string) => {
      const resolved = this.resolvePath(path, context);
      return resolved == null ? '' : String(resolved);
    });
  }

  private resolvePath(path: string, context?: DeclarativeComponentContext): unknown {
    const [sourceKey, ...parts] = path.trim().split('.');
    const source = this.sourceFor(sourceKey, context);
    if (!parts.length) {
      return source;
    }
    return parts.reduce<unknown>((current, part) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[part];
    }, source);
  }

  private sourceFor(source: string, context?: DeclarativeComponentContext): unknown {
    switch (source) {
      case 'state':
      case 'appState':
        return context?.state ?? {};
      case 'data':
        return context?.data ?? {};
      case 'route':
      case 'params':
        return context?.route ?? {};
      case 'user':
        return context?.user ?? {};
      case 'tenant':
        return context?.tenant ?? {};
      case 'value':
        return context?.value;
      case 'bindings':
        return context?.data?.['bindings'] ?? {};
      default:
        return undefined;
    }
  }

  private setByPath(target: Record<string, unknown>, path: string, value: unknown) {
    const parts = path.split('.').filter(Boolean);
    if (!parts.length) {
      return;
    }
    const last = parts.pop() as string;
    let current = target;
    for (const part of parts) {
      const next = current[part];
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[last] = value;
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }
}

