import { Injectable, signal } from "@angular/core";
import {
  DeclarativeComponentAction,
  DeclarativeComponentContext,
} from "./declarative-component.types";

export type DeclarativeActionStatus = "running" | "success" | "failed";
export type DeclarativeOfflineStatus = "pending" | "failed";

export interface DeclarativeActionLog {
  id: string;
  type: string;
  componentKey?: string;
  status: DeclarativeActionStatus;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  action: DeclarativeComponentAction | Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface DeclarativeOfflineQueueItem {
  id: string;
  queueKey: string;
  status: DeclarativeOfflineStatus;
  action: DeclarativeComponentAction | Record<string, unknown>;
  payload: Record<string, unknown>;
  context: Pick<
    DeclarativeComponentContext,
    "state" | "data" | "route" | "user" | "tenant" | "value" | "permissions"
  >;
  createdAt: string;
  lastError?: string;
}

const HISTORY_KEY = "chicle.declarative.action.history";
const OFFLINE_QUEUE_KEY = "chicle.declarative.offline.queue";
const MAX_HISTORY_ITEMS = 30;
const SENSITIVE_KEY_PATTERN =
  /(password|passwd|pwd|secret|token|authorization|bearer|apikey|api_key|credential|private|hash|salt|confisys|vault|dsn|databaseurl|database_url|dburl|db_url|connectionstring|connection_string)/i;

@Injectable({ providedIn: "root" })
export class DeclarativeActionRuntimeService {
  readonly history = signal<DeclarativeActionLog[]>(
    this.readArray<DeclarativeActionLog>(HISTORY_KEY),
  );
  readonly offlineQueue = signal<DeclarativeOfflineQueueItem[]>(
    this.readArray<DeclarativeOfflineQueueItem>(OFFLINE_QUEUE_KEY),
  );

  constructor() {
    this.sanitizeStoredRuntimeState();
  }

  begin(
    action: DeclarativeComponentAction | Record<string, unknown>,
    context: DeclarativeComponentContext = {},
  ) {
    const component = this.asRecord(context.data?.["component"]);
    const log: DeclarativeActionLog = {
      id: this.id(),
      type: this.stringValue(action["type"]) || "unknown",
      componentKey:
        this.stringValue(context.data?.["componentKey"]) ||
        this.stringValue(component?.["componentKey"]),
      status: "running",
      startedAt: new Date().toISOString(),
      action: this.safeSnapshot(action) as DeclarativeComponentAction | Record<string, unknown>,
    };
    this.setHistory([log, ...this.history()].slice(0, MAX_HISTORY_ITEMS));
    return log.id;
  }

  complete(id: string, result: unknown) {
    this.updateHistory(id, (item) => ({
      ...item,
      status: "success",
      endedAt: new Date().toISOString(),
      durationMs: this.duration(item.startedAt),
      result: this.safeSnapshot(result),
    }));
  }

  fail(id: string, error: unknown) {
    this.updateHistory(id, (item) => ({
      ...item,
      status: "failed",
      endedAt: new Date().toISOString(),
      durationMs: this.duration(item.startedAt),
      error: this.errorMessage(error),
    }));
  }

  enqueue(
    queueKey: string,
    action: DeclarativeComponentAction | Record<string, unknown>,
    context: DeclarativeComponentContext,
    payload: Record<string, unknown>,
  ) {
    const item: DeclarativeOfflineQueueItem = {
      id: this.id(),
      queueKey: queueKey || "default",
      status: "pending",
      action: this.safeSnapshot(action) as DeclarativeComponentAction | Record<string, unknown>,
      payload: this.safeSnapshot(payload) as Record<string, unknown>,
      context: this.safeContextSnapshot(context),
      createdAt: new Date().toISOString(),
    };
    this.setOfflineQueue([...this.offlineQueue(), item]);
    return item;
  }

  removeOfflineItem(id: string) {
    this.setOfflineQueue(this.offlineQueue().filter((item) => item.id !== id));
  }

  markOfflineFailed(id: string, error: unknown) {
    this.setOfflineQueue(
      this.offlineQueue().map((item) =>
        item.id === id
          ? {
              ...item,
              status: "failed",
              lastError: this.errorMessage(error),
            }
          : item,
      ),
    );
  }

  clearHistory() {
    this.setHistory([]);
  }

  clearOfflineQueue() {
    this.setOfflineQueue([]);
  }

  private sanitizeStoredRuntimeState() {
    this.setHistory(
      this.history().map((item) => ({
        ...item,
        action: this.safeSnapshot(item.action) as
          | DeclarativeComponentAction
          | Record<string, unknown>,
        result:
          item.result === undefined ? undefined : this.safeSnapshot(item.result),
      })),
    );
    this.setOfflineQueue(
      this.offlineQueue().map((item) => ({
        ...item,
        action: this.safeSnapshot(item.action) as
          | DeclarativeComponentAction
          | Record<string, unknown>,
        payload: this.safeSnapshot(item.payload) as Record<string, unknown>,
        context: this.safeContextSnapshot(item.context as DeclarativeComponentContext),
      })),
    );
  }

  private updateHistory(
    id: string,
    update: (item: DeclarativeActionLog) => DeclarativeActionLog,
  ) {
    this.setHistory(
      this.history().map((item) => (item.id === id ? update(item) : item)),
    );
  }

  private setHistory(items: DeclarativeActionLog[]) {
    this.history.set(items);
    this.writeArray(HISTORY_KEY, items);
  }

  private setOfflineQueue(items: DeclarativeOfflineQueueItem[]) {
    this.offlineQueue.set(items);
    this.writeArray(OFFLINE_QUEUE_KEY, items);
  }

  private readArray<T>(key: string): T[] {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private writeArray(key: string, value: unknown[]) {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }

  private duration(startedAt: string) {
    return Math.max(0, Date.now() - new Date(startedAt).getTime());
  }

  private safeSnapshot(value: unknown): unknown {
    if (value == null) {
      return value;
    }
    if (typeof value !== "object") {
      return typeof value === "string" && value.length > 160 ? `${value.slice(0, 160)}...` : value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.safeSnapshot(item));
    }
    try {
      return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
        (result, [key, entry]) => {
          result[key] = this.isSensitiveKey(key) ? "[redacted]" : this.safeSnapshot(entry);
          return result;
        },
        {},
      );
    } catch {
      return String(value);
    }
  }

  private safeContextSnapshot(context: DeclarativeComponentContext) {
    return {
      state: this.safeContextRecordSnapshot(context.state ?? {}),
      data: this.safeContextRecordSnapshot(context.data ?? {}),
      route: this.safeContextRecordSnapshot(context.route ?? {}),
      user: this.safePrincipalSnapshot(context.user),
      tenant: this.safePrincipalSnapshot(context.tenant),
      value: context.value == null ? null : "[context-value]",
      permissions: Array.isArray(context.permissions) ? [...context.permissions] : [],
    };
  }

  private safeContextRecordSnapshot(value: unknown) {
    const record = this.asRecord(value);
    if (!record) {
      return {};
    }
    return Object.keys(record)
      .slice(0, 30)
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = this.isSensitiveKey(key) ? "[redacted]" : "[context-value]";
        return result;
      }, {});
  }

  private safePrincipalSnapshot(value: unknown) {
    const record = this.asRecord(value);
    if (!record) {
      return {};
    }
    return ["id", "key", "slug", "role", "systemRole"].reduce<Record<string, unknown>>(
      (result, key) => {
        if (key in record && !this.isSensitiveKey(key)) {
          result[key] = this.safeSnapshot(record[key]);
        }
        return result;
      },
      {},
    );
  }

  private errorMessage(error: unknown) {
    if (error && typeof error === "object") {
      const candidate = error as {
        error?: { message?: string };
        message?: string;
      };
      return (
        candidate.error?.message ??
        candidate.message ??
        "Declarative action failed."
      );
    }
    return typeof error === "string" ? error : "Declarative action failed.";
  }

  private stringValue(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private isSensitiveKey(key: string) {
    return SENSITIVE_KEY_PATTERN.test(key);
  }

  private id() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
