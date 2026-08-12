import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { UiKitPreference } from "../../core/ui/ui-presentation.types";
import { ActionRunnerService } from "../actions/action-runner.service";
import { DynamicFieldControlComponent } from "../../shared/dynamic-field-control/dynamic-field-control.component";
import { StatusNoticeComponent } from "../../shared/status-notice/status-notice.component";
import {
  UiKitButtonComponent,
  UiKitButtonSize,
  UiKitButtonTone,
  UiKitButtonVariant,
} from "../../shared/ui-kit-button/ui-kit-button.component";
import {
  UiKitCardComponent,
  UiKitCardTone,
  UiKitCardVariant,
} from "../../shared/ui-kit-card/ui-kit-card.component";
import { RuntimeField } from "../forms/form-runtime.service";
import { DeclarativeBindingResolverService } from "./declarative-binding-resolver.service";
import { DeclarativeComponentRegistryService } from "./declarative-component-registry.service";
import { DeclarativePermissionService } from "./declarative-permission.service";
import {
  DeclarativeComponentAction,
  DeclarativeComponentActionEvent,
  DeclarativeComponentContext,
  DeclarativeComponentContract,
  DeclarativeFieldProps,
} from "./declarative-component.types";

@Component({
  selector: "app-declarative-component-renderer",
  standalone: true,
  imports: [
    CommonModule,
    DynamicFieldControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
    UiKitCardComponent,
  ],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .stack,
      .grid {
        min-width: 0;
      }

      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--dc-gap, 12px);
        align-items: var(--dc-align, stretch);
      }

      .stack.horizontal {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
      }

      .stack.horizontal > * {
        flex: 0 0 auto;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(var(--dc-min-col, 220px), 1fr)
        );
        gap: var(--dc-gap, 12px);
      }

      .card-heading {
        display: grid;
        gap: 3px;
        margin-bottom: 12px;
      }

      .card-heading h3 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .card-heading p {
        margin: 0;
        color: var(--ch-color-muted);
      }

      .fallback {
        color: var(--ch-color-muted);
        font-size: 0.9rem;
      }

      .loading,
      .toolbar,
      .nav-menu,
      .nav-tabs,
      .data-list,
      .skeleton {
        min-width: 0;
      }

      .loading,
      .toolbar,
      .nav-tabs,
      .list-item,
      .menu-item {
        display: flex;
        align-items: center;
      }

      .loading {
        gap: 10px;
        color: var(--ch-color-muted);
      }

      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid var(--ch-color-primary-soft);
        border-top-color: var(--ch-color-primary);
        border-radius: 999px;
        animation: dc-spin 0.85s linear infinite;
      }

      @keyframes dc-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .skeleton {
        display: grid;
        gap: 10px;
      }

      .skeleton.card {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .skeleton-line {
        display: block;
        height: 12px;
        max-width: 100%;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          var(--ch-color-surface-alt),
          var(--ch-color-primary-soft),
          var(--ch-color-surface-alt)
        );
        background-size: 220% 100%;
        animation: dc-pulse 1.4s ease-in-out infinite;
      }

      .skeleton-line:nth-child(2n) {
        width: 78%;
      }

      .skeleton-line:nth-child(3n) {
        width: 56%;
      }

      @keyframes dc-pulse {
        0% {
          background-position: 120% 0;
        }
        100% {
          background-position: -120% 0;
        }
      }

      .toolbar {
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px 12px;
      }

      .toolbar-title {
        display: grid;
        gap: 2px;
      }

      .toolbar-title strong,
      .list-item strong,
      .menu-item strong {
        color: var(--ch-color-text);
      }

      .toolbar-title span,
      .list-item span,
      .menu-item span,
      .empty {
        color: var(--ch-color-muted);
      }

      .toolbar-actions,
      .nav-tabs,
      .nav-menu {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .nav-menu.vertical {
        display: grid;
      }

      .menu-item,
      .tab-item {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        cursor: pointer;
        font: inherit;
      }

      .menu-item {
        justify-content: space-between;
        gap: 12px;
        min-height: 42px;
        padding: 9px 11px;
        text-align: left;
      }

      .menu-item.active,
      .tab-item.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .tab-item {
        min-height: 34px;
        padding: 6px 10px;
        font-weight: 850;
      }

      .table-wrap {
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
      }

      .data-table {
        width: 100%;
        min-width: 420px;
        border-collapse: collapse;
      }

      .data-table th,
      .data-table td {
        border-bottom: 1px solid var(--ch-color-border);
        padding: 9px 10px;
        text-align: left;
        vertical-align: top;
      }

      .data-table th {
        color: var(--ch-color-text);
        font-size: 0.78rem;
      }

      .data-table td {
        color: var(--ch-color-muted);
      }

      .data-table tr:last-child td {
        border-bottom: 0;
      }

      .data-list {
        display: grid;
        gap: 8px;
      }

      .list-item {
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px 11px;
      }
    `,
  ],
  template: `
    @if (contract && canRenderContract) {
      @switch (contract.componentKey) {
        @case ("ui.button") {
          <app-ui-kit-button
            [kit]="kitForRender"
            [label]="stringProp('label', 'Action')"
            [icon]="stringProp('icon', '')"
            [tone]="buttonTone"
            [variant]="buttonVariant"
            [size]="buttonSize"
            [full]="booleanProp('full', false)"
            [disabled]="booleanProp('disabled', false)"
            (pressed)="runConfiguredAction('onClick')"
          ></app-ui-kit-button>
        }

        @case ("form.field") {
          <app-dynamic-field-control
            [field]="fieldProp"
            [value]="fieldValue"
            [help]="fieldTextProp('help')"
            [error]="fieldTextProp('error')"
            [disabled]="fieldBooleanProp('disabled')"
            [readonly]="fieldBooleanProp('readonly')"
            [presentation]="fieldPresentation"
            [viewportWidth]="context?.viewportWidth"
            [platform]="context?.platform"
            (valueChange)="emitValueChange($event)"
          ></app-dynamic-field-control>
        }

        @case ("ui.card") {
          <app-ui-kit-card
            [kit]="kitForRender"
            [tone]="cardTone"
            [variant]="cardVariant"
            [padding]="stringProp('padding', '16px')"
          >
            @if (stringProp("title", "") || stringProp("subtitle", "")) {
              <div class="card-heading">
                @if (stringProp("title", "")) {
                  <h3>{{ stringProp("title", "") }}</h3>
                }
                @if (stringProp("subtitle", "")) {
                  <p>{{ stringProp("subtitle", "") }}</p>
                }
              </div>
            }
            @for (
              child of contract.children ?? [];
              track trackChild($index, child)
            ) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </app-ui-kit-card>
        }

        @case ("layout.stack") {
          <div
            class="stack"
            [class.horizontal]="
              stringProp('direction', 'vertical') === 'horizontal'
            "
            [style.--dc-gap]="stringProp('gap', '12px')"
            [style.--dc-align]="alignProp"
          >
            @for (
              child of contract.children ?? [];
              track trackChild($index, child)
            ) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </div>
        }

        @case ("layout.grid") {
          <div
            class="grid"
            [style.--dc-gap]="stringProp('gap', '12px')"
            [style.--dc-min-col]="stringProp('minColumnWidth', '220px')"
          >
            @for (
              child of contract.children ?? [];
              track trackChild($index, child)
            ) {
              <app-declarative-component-renderer
                [contract]="child"
                [context]="context"
                [kit]="kit"
                (action)="action.emit($event)"
              ></app-declarative-component-renderer>
            }
          </div>
        }

        @case ("feedback.alert") {
          <app-status-notice
            [kit]="kitForRender"
            [title]="stringProp('title', 'Notice')"
            [tone]="noticeTone"
          >
            {{ stringProp("message", "Review this information.") }}
          </app-status-notice>
        }

        @case ("feedback.toast") {
          <app-status-notice
            [kit]="kitForRender"
            [title]="stringProp('title', 'Toast')"
            [tone]="noticeTone"
          >
            {{ stringProp("message", "Toast message.") }}
          </app-status-notice>
        }

        @case ("feedback.loading") {
          @if (booleanProp("active", true)) {
            <div class="loading" role="status" aria-live="polite">
              <span class="spinner" aria-hidden="true"></span>
              <span>{{ stringProp("message", "Loading...") }}</span>
            </div>
          }
        }

        @case ("feedback.skeleton") {
          <div
            class="skeleton"
            [class.card]="booleanProp('surface', true)"
            aria-label="Loading placeholder"
          >
            @for (row of skeletonRows; track row) {
              <span class="skeleton-line"></span>
            }
          </div>
        }

        @case ("nav.toolbar") {
          <header class="toolbar">
            <div class="toolbar-title">
              <strong>{{ stringProp("title", "Toolbar") }}</strong>
              @if (stringProp("subtitle", "")) {
                <span>{{ stringProp("subtitle", "") }}</span>
              }
            </div>
            <div class="toolbar-actions">
              @for (item of objectArrayProp("actions"); track itemKey(item, $index)) {
                <app-ui-kit-button
                  [kit]="kitForRender"
                  [label]="itemText(item, 'label', 'Action')"
                  [icon]="itemText(item, 'icon', '')"
                  [tone]="itemTone(item)"
                  [variant]="itemVariant(item)"
                  size="small"
                  (pressed)="runToolbarAction(item)"
                ></app-ui-kit-button>
              }
            </div>
          </header>
        }

        @case ("nav.menu") {
          <nav
            class="nav-menu"
            [class.vertical]="stringProp('orientation', 'vertical') !== 'horizontal'"
            [attr.aria-label]="stringProp('label', 'Navigation menu')"
          >
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <button
                type="button"
                class="menu-item"
                [class.active]="itemActive(item)"
                (click)="runNavigationItem(item)"
              >
                <span>
                  <strong>{{ itemText(item, "label", "Item") }}</strong>
                  @if (itemText(item, "description", "")) {
                    <span>{{ itemText(item, "description", "") }}</span>
                  }
                </span>
                @if (itemText(item, "badge", "")) {
                  <small>{{ itemText(item, "badge", "") }}</small>
                }
              </button>
            }
          </nav>
        }

        @case ("nav.tabs") {
          <div class="nav-tabs" role="tablist">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <button
                type="button"
                class="tab-item"
                role="tab"
                [class.active]="itemActive(item)"
                (click)="runNavigationItem(item)"
              >
                {{ itemText(item, "label", "Tab") }}
              </button>
            }
          </div>
        }

        @case ("data.table") {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  @for (column of tableColumns; track column.key) {
                    <th>{{ column.label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of tableRows; track itemKey(row, $index)) {
                  <tr>
                    @for (column of tableColumns; track column.key) {
                      <td>{{ tableCell(row, column.key) }}</td>
                    }
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="tableColumns.length || 1">
                      <span class="empty">{{ stringProp("emptyText", "No rows to show.") }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @case ("data.list") {
          <div class="data-list">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <article class="list-item">
                <span>
                  <strong>{{ itemText(item, titleKey, "Item") }}</strong>
                  @if (itemText(item, subtitleKey, "")) {
                    <span>{{ itemText(item, subtitleKey, "") }}</span>
                  }
                </span>
                @if (itemText(item, "status", "")) {
                  <small>{{ itemText(item, "status", "") }}</small>
                }
              </article>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No items to show.") }}</span>
            }
          </div>
        }

        @default {
          <app-status-notice
            [kit]="kitForRender"
            title="Component pending"
            tone="info"
          >
            <span class="fallback">
              {{ contract.componentKey }} is valid in the declarative catalog,
              but its renderer adapter is pending.
            </span>
          </app-status-notice>
        }
      }
      @if (localNotice) {
        <app-status-notice
          [kit]="kitForRender"
          [title]="localNotice.title"
          [tone]="localNotice.tone"
        >
          {{ localNotice.message }}
        </app-status-notice>
      }
    }
  `,
})
export class DeclarativeComponentRendererComponent {
  private readonly registry = inject(DeclarativeComponentRegistryService);
  private readonly bindings = inject(DeclarativeBindingResolverService);
  private readonly permissions = inject(DeclarativePermissionService);
  private readonly actionRunner = inject(ActionRunnerService);

  @Input() contract: DeclarativeComponentContract | null = null;
  @Input() context?: DeclarativeComponentContext;
  @Input() kit: UiKitPreference = "auto";
  @Input() runActions = true;
  @Output() readonly action =
    new EventEmitter<DeclarativeComponentActionEvent>();

  localNotice: {
    tone: "neutral" | "info" | "success" | "warning" | "error";
    title: string;
    message: string;
  } | null = null;

  get kitForRender(): UiKitPreference {
    return this.kit === "inherit" || this.kit === "auto"
      ? (this.context?.kit ?? this.kit)
      : this.kit;
  }

  get canRenderContract() {
    return this.contract
      ? this.permissions.canRender(this.contract, this.context)
      : false;
  }

  get resolvedProps() {
    return this.contract
      ? this.bindings.resolveProps(this.contract, this.context)
      : {};
  }

  get buttonTone(): UiKitButtonTone {
    return this.oneOf(
      this.stringProp("tone", "primary"),
      ["primary", "secondary", "success", "danger", "neutral"],
      "primary",
    );
  }

  get buttonVariant(): UiKitButtonVariant {
    return this.oneOf(
      this.stringProp("variant", "solid"),
      ["solid", "outline", "ghost"],
      "solid",
    );
  }

  get buttonSize(): UiKitButtonSize {
    return this.oneOf(
      this.stringProp("size", "medium"),
      ["small", "medium"],
      "medium",
    );
  }

  get cardTone(): UiKitCardTone {
    return this.oneOf(
      this.stringProp("tone", "neutral"),
      ["neutral", "primary", "success", "warning", "danger"],
      "neutral",
    );
  }

  get cardVariant(): UiKitCardVariant {
    return this.oneOf(
      this.stringProp("variant", "surface"),
      ["surface", "subtle", "outline"],
      "surface",
    );
  }

  get noticeTone(): "neutral" | "info" | "success" | "warning" | "error" {
    const tone = this.stringProp("tone", "info");
    return tone === "danger"
      ? "error"
      : this.oneOf(
          tone,
          ["neutral", "info", "success", "warning", "error"],
          "info",
        );
  }

  get alignProp() {
    return (
      {
        start: "flex-start",
        center: "center",
        end: "flex-end",
        stretch: "stretch",
      }[this.stringProp("align", "stretch")] ?? "stretch"
    );
  }

  get skeletonRows() {
    const raw = this.resolvedProps["rows"];
    const count = typeof raw === "number" ? raw : Number(raw);
    const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(8, count)) : 3;
    return Array.from({ length: safeCount }, (_, index) => index);
  }

  get tableRows() {
    return this.objectArrayProp("rows");
  }

  get tableColumns(): Array<{ key: string; label: string }> {
    const configured = this.resolvedProps["columns"];
    if (Array.isArray(configured)) {
      return configured
        .map((column) => {
          if (typeof column === "string") {
            return { key: column, label: this.humanize(column) };
          }
          if (this.isRecord(column)) {
            const key = this.itemText(column, "key", "");
            if (!key) {
              return null;
            }
            return {
              key,
              label: this.itemText(column, "label", this.humanize(key)),
            };
          }
          return null;
        })
        .filter((column): column is { key: string; label: string } => Boolean(column));
    }
    const firstRow = this.tableRows[0];
    return firstRow
      ? Object.keys(firstRow)
          .slice(0, 6)
          .map((key) => ({ key, label: this.humanize(key) }))
      : [];
  }

  get titleKey() {
    return this.stringProp("titleKey", "title");
  }

  get subtitleKey() {
    return this.stringProp("subtitleKey", "subtitle");
  }

  get fieldProp(): RuntimeField {
    const props = this.resolvedProps as DeclarativeFieldProps | undefined;
    const field = props?.field;
    if (field && typeof field === "object") {
      return {
        ...field,
        name: field.name || field.key || "value",
        label: field.label || field.name || field.key || "Value",
        type: field.type || "text",
      };
    }
    return {
      name: "value",
      label: "Value",
      type: "text",
      placeholder: "Write a value",
    };
  }

  get fieldValue() {
    const props = this.resolvedProps as DeclarativeFieldProps | undefined;
    return props?.value ?? this.context?.state?.[this.fieldProp.name] ?? "";
  }

  get fieldPresentation() {
    return {
      ...(this.context?.presentation ?? {}),
      kit: this.kitForRender,
    };
  }

  stringProp(key: string, fallback: string) {
    const value = this.resolvedProps[key];
    return typeof value === "string" ? value : fallback;
  }

  booleanProp(key: string, fallback: boolean) {
    const value = this.resolvedProps[key];
    return typeof value === "boolean" ? value : fallback;
  }

  objectArrayProp(key: string): Array<Record<string, unknown>> {
    const value = this.resolvedProps[key];
    return Array.isArray(value) ? value.filter((item) => this.isRecord(item)) : [];
  }

  itemText(item: Record<string, unknown>, key: string, fallback: string) {
    const value = item[key];
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : fallback;
  }

  itemKey(item: Record<string, unknown>, index: number) {
    return this.itemText(item, "key", this.itemText(item, "id", `${index}`));
  }

  itemActive(item: Record<string, unknown>) {
    const activeKey = this.stringProp("activeKey", "");
    return Boolean(activeKey && this.itemKey(item, -1) === activeKey);
  }

  itemTone(item: Record<string, unknown>): UiKitButtonTone {
    return this.oneOf(
      this.itemText(item, "tone", "secondary"),
      ["primary", "secondary", "success", "danger", "neutral"],
      "secondary",
    );
  }

  itemVariant(item: Record<string, unknown>): UiKitButtonVariant {
    return this.oneOf(
      this.itemText(item, "variant", "outline"),
      ["solid", "outline", "ghost"],
      "outline",
    );
  }

  tableCell(row: Record<string, unknown>, key: string) {
    const value = row[key];
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  fieldTextProp(key: keyof DeclarativeFieldProps) {
    const value = (this.resolvedProps as DeclarativeFieldProps | undefined)?.[
      key
    ];
    return typeof value === "string" ? value : "";
  }

  fieldBooleanProp(key: keyof DeclarativeFieldProps) {
    const value = (this.resolvedProps as DeclarativeFieldProps | undefined)?.[
      key
    ];
    return typeof value === "boolean" ? value : false;
  }

  async runConfiguredAction(eventName: string, value?: unknown) {
    const action = this.resolveAction(eventName);
    if (!action || !this.contract) {
      return;
    }
    await this.runActionObject(eventName, action, value);
  }

  async runNavigationItem(item: Record<string, unknown>) {
    const fallbackRoute = this.itemText(item, "route", "");
    const action =
      this.resolveAction("onNavigate") ??
      (fallbackRoute
        ? ({
            type: "navigate",
            route: fallbackRoute,
          } as DeclarativeComponentAction)
        : ({
            type: "show_message",
            tone: "info",
            message: `Seleccionaste ${this.itemText(item, "label", "un item")}.`,
          } as DeclarativeComponentAction));
    await this.runActionObject("onNavigate", action, item);
  }

  async runToolbarAction(item: Record<string, unknown>) {
    const nested = item["action"];
    const fallbackRoute = this.itemText(item, "route", "");
    const action = this.isRecord(nested)
      ? (nested as DeclarativeComponentAction)
      : fallbackRoute
        ? ({
            type: "navigate",
            route: fallbackRoute,
          } as DeclarativeComponentAction)
        : ({
            type: "show_message",
            tone: this.itemText(item, "tone", "info"),
            message: `${this.itemText(item, "label", "Acción")} ejecutada.`,
          } as DeclarativeComponentAction);
    await this.runActionObject("onClick", action, item);
  }

  private async runActionObject(
    eventName: string,
    action: DeclarativeComponentAction,
    value?: unknown,
  ) {
    if (!this.contract) {
      return;
    }
    const actionContext = this.actionContext(value);
    const resolvedAction = this.bindings.resolveDeep(
      action,
      actionContext,
    ) as DeclarativeComponentAction;
    if (!this.permissions.canExecute(resolvedAction, actionContext)) {
      this.localNotice = {
        title: "Permission required",
        tone: "warning",
        message:
          "This action requires a permission that is not available in the current context.",
      };
      this.action.emit({
        source: this.contract,
        eventName,
        action: resolvedAction,
        value,
      });
      return;
    }

    let result: unknown = null;
    if (this.runActions) {
      try {
        result = await this.actionRunner.execute(resolvedAction, actionContext);
        this.handleActionResult(result);
      } catch (error) {
        this.localNotice = {
          title: "Action failed",
          tone: "error",
          message: this.errorMessage(error),
        };
        result = error;
      }
    }
    this.action.emit({
      source: this.contract,
      eventName,
      action: resolvedAction,
      value,
      result,
    });
  }

  emitValueChange(value: unknown) {
    const configured = this.resolveAction("valueChange");
    if (configured && this.contract) {
      void this.runConfiguredAction("valueChange", value);
      return;
    }
    if (this.contract) {
      const defaultAction: DeclarativeComponentAction = {
        type: "set_state",
        key: this.fieldProp.name,
      };
      void this.actionRunner.execute(defaultAction, this.actionContext(value));
      this.action.emit({
        source: this.contract,
        eventName: "valueChange",
        action: defaultAction,
        value,
      });
    }
  }

  trackChild(index: number, child: DeclarativeComponentContract) {
    return child.id || `${child.componentKey}-${index}`;
  }

  private resolveAction(eventName: string): DeclarativeComponentAction | null {
    const actions = this.contract?.actions;
    if (Array.isArray(actions)) {
      return (actions[0] as DeclarativeComponentAction | undefined) ?? null;
    }
    const action = actions?.[eventName];
    if (Array.isArray(action)) {
      return (action[0] as DeclarativeComponentAction | undefined) ?? null;
    }
    return (action as DeclarativeComponentAction | undefined) ?? null;
  }

  private actionContext(value?: unknown): DeclarativeComponentContext {
    return {
      ...(this.context ?? {}),
      value,
      data: {
        ...(this.context?.data ?? {}),
        componentKey: this.contract?.componentKey,
        props: this.resolvedProps,
        component: this.contract ?? {},
      },
    };
  }

  private handleActionResult(result: unknown) {
    const value =
      result && typeof result === "object"
        ? (result as Record<string, unknown>)
        : null;
    if (!value || value["handled"] === false) {
      if (value?.["reason"]) {
        this.localNotice = {
          title: "Action pending",
          tone: "warning",
          message: String(value["reason"]),
        };
      }
      return;
    }
    if (value["type"] === "show_message") {
      this.localNotice = {
        title: "",
        tone: this.noticeToneFrom(value["tone"]),
        message:
          typeof value["message"] === "string"
            ? value["message"]
            : "Action completed.",
      };
    }
  }

  private noticeToneFrom(
    value: unknown,
  ): "neutral" | "info" | "success" | "warning" | "error" {
    if (value === "danger") {
      return "error";
    }
    return this.oneOf(
      typeof value === "string" ? value : "info",
      ["neutral", "info", "success", "warning", "error"],
      "info",
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
        "The declarative action could not be executed."
      );
    }
    return "The declarative action could not be executed.";
  }

  private oneOf<T extends string>(
    value: string,
    allowed: readonly T[],
    fallback: T,
  ): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  private humanize(value: string) {
    return value
      .replace(/[_-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Injected for early validation side effects and future catalog-backed rendering decisions.
  protected componentExists(componentKey: string) {
    return this.registry.has(componentKey);
  }
}
