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

@Injectable({ providedIn: "root" })
export class DeclarativeActionRuntimeService {
  readonly history = signal<DeclarativeActionLog[]>(
    this.readArray<DeclarativeActionLog>(HISTORY_KEY),
  );
  readonly offlineQueue = signal<DeclarativeOfflineQueueItem[]>(
    this.readArray<DeclarativeOfflineQueueItem>(OFFLINE_QUEUE_KEY),
  );

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
      action,
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
      action,
      payload,
      context: {
        state: context.state ?? {},
        data: context.data ?? {},
        route: context.route ?? {},
        user: context.user ?? {},
        tenant: context.tenant ?? {},
        value: context.value ?? null,
        permissions: context.permissions ?? [],
      },
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

  private safeSnapshot(value: unknown) {
    if (value == null || typeof value !== "object") {
      return value;
    }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
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

  private id() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
