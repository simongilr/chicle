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
  host: {
    "[attr.data-ui-kit]": "kitForRender",
  },
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
      .grid,
      .app-shell,
      .auth-login,
      .home-menu,
      .gallery,
      .detail-grid {
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
        column-gap: var(--dc-gap, 12px);
        row-gap: calc(var(--dc-gap, 12px) * 0.75);
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

      .badge-pill,
      .status-pill {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 26px;
        border: 1px solid var(--tone-border, var(--ch-color-primary-border));
        border-radius: 999px;
        background: var(--tone-bg, var(--ch-color-primary-soft));
        color: var(--tone-fg, var(--ch-color-text));
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
        line-height: 1;
        white-space: nowrap;
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
        flex-wrap: wrap;
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
        gap: 10px;
      }

      .toolbar-actions {
        justify-content: flex-end;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        column-gap: 12px;
        row-gap: 12px;
        margin-top: 2px;
      }

      .button-row app-ui-kit-button,
      .toolbar-actions app-ui-kit-button,
      .modal-footer app-ui-kit-button {
        flex: 0 0 auto;
      }

      .button-row app-ui-kit-button + app-ui-kit-button {
        margin-inline-start: 0;
      }

      .button-row.stretch app-ui-kit-button {
        flex: 1 1 170px;
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

      .runtime-form,
      .result-panel,
      .chart-panel,
      .map-panel {
        display: grid;
        min-width: 0;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 14px;
      }

      .runtime-form-fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .list-item {
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px 11px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .detail-item,
      .metric-card,
      .home-menu-item,
      .gallery-item,
      .status-panel {
        border: 1px solid var(--tone-border, var(--ch-color-border));
        border-radius: var(--ch-radius);
        background: var(--tone-bg, var(--ch-color-surface));
        color: var(--ch-color-text);
      }

      .detail-item {
        display: grid;
        gap: 4px;
        padding: 10px;
      }

      .detail-item span,
      .metric-label,
      .metric-help,
      .gallery-caption span,
      .status-panel p {
        color: var(--ch-color-muted);
      }

      .metric-card {
        display: grid;
        gap: 6px;
        min-height: 104px;
        padding: 14px;
      }

      .metric-value {
        color: var(--tone-fg, var(--ch-color-text));
        font-size: 1.75rem;
        font-weight: 900;
        line-height: 1;
      }

      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
        gap: 10px;
      }

      .gallery-item {
        display: grid;
        gap: 8px;
        overflow: hidden;
        padding: 8px;
      }

      .gallery-thumb,
      .gallery-placeholder {
        display: grid;
        place-items: center;
        aspect-ratio: 4 / 3;
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        overflow: hidden;
      }

      .gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .gallery-caption {
        display: grid;
        gap: 2px;
      }

      .modal-preview {
        display: grid;
        gap: 12px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: calc(var(--ch-radius) + 2px);
        background: color-mix(in srgb, var(--ch-color-surface) 92%, var(--ch-color-primary-soft));
        box-shadow: var(--ch-shadow-card);
        padding: 14px;
      }

      .modal-header,
      .modal-footer,
      .app-shell-header,
      .app-shell-nav,
      .home-menu-item {
        display: flex;
        align-items: center;
      }

      .modal-header,
      .modal-footer,
      .app-shell-header {
        justify-content: space-between;
        gap: 12px;
      }

      .modal-header h3,
      .app-shell-header h3,
      .auth-login h3,
      .home-menu-item strong,
      .status-panel strong {
        margin: 0;
        color: var(--ch-color-text);
      }

      .modal-body,
      .auth-login p,
      .app-shell-header p,
      .home-menu-item span {
        color: var(--ch-color-muted);
      }

      .app-shell {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) + 4px);
        background: var(--ch-color-surface);
        padding: 16px;
      }

      .app-shell-header {
        align-items: flex-start;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 12px;
      }

      .app-shell-title {
        display: grid;
        gap: 3px;
      }

      .app-shell-body,
      .auth-login {
        display: grid;
        gap: 14px;
      }

      .app-shell-nav {
        flex-wrap: wrap;
        gap: 8px;
      }

      .auth-login {
        max-width: var(--auth-width, 420px);
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 16px;
      }

      .auth-login-header {
        display: grid;
        gap: 4px;
      }

      .home-menu {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 10px;
      }

      .bottom-tabs {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
        gap: 8px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 8px;
      }

      .home-menu-item {
        justify-content: space-between;
        gap: 12px;
        min-height: 72px;
        cursor: pointer;
        padding: 12px;
        text-align: left;
      }

      .home-menu-copy {
        display: grid;
        gap: 4px;
      }

      .status-panel {
        display: grid;
        gap: 5px;
        padding: 12px;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }

      .chart-bars {
        display: grid;
        gap: 10px;
      }

      .chart-row {
        display: grid;
        grid-template-columns: minmax(90px, 0.45fr) minmax(120px, 1fr) auto;
        gap: 10px;
        align-items: center;
      }

      .chart-track {
        height: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
      }

      .chart-fill {
        display: block;
        width: var(--bar-width, 0%);
        height: 100%;
        border-radius: inherit;
        background: var(--ch-color-primary);
      }

      .map-canvas {
        position: relative;
        min-height: 190px;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          linear-gradient(var(--ch-color-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--ch-color-border) 1px, transparent 1px),
          color-mix(in srgb, var(--ch-color-primary-soft) 38%, var(--ch-color-surface));
        background-size: 24px 24px;
      }

      .map-pin {
        position: absolute;
        left: var(--pin-x, 50%);
        top: var(--pin-y, 50%);
        transform: translate(-50%, -50%);
        display: inline-grid;
        place-items: center;
        min-width: 28px;
        height: 28px;
        border: 2px solid var(--ch-color-surface);
        border-radius: 999px;
        background: var(--ch-color-danger);
        color: var(--ch-color-primary-contrast);
        box-shadow: var(--ch-shadow-card);
        font-size: 0.72rem;
        font-weight: 900;
      }

      .tone-success {
        --tone-bg: var(--ch-color-success-soft);
        --tone-border: var(--ch-color-success-border);
        --tone-fg: var(--ch-color-success);
      }

      .tone-warning {
        --tone-bg: var(--ch-color-warning-soft);
        --tone-border: var(--ch-color-warning-border);
        --tone-fg: var(--ch-color-warning);
      }

      .tone-danger,
      .tone-error {
        --tone-bg: var(--ch-color-danger-soft);
        --tone-border: var(--ch-color-danger-border);
        --tone-fg: var(--ch-color-danger);
      }

      .tone-info,
      .tone-primary {
        --tone-bg: var(--ch-color-primary-soft);
        --tone-border: var(--ch-color-primary-border);
        --tone-fg: var(--ch-color-primary);
      }

      :host([data-ui-kit="material"]) .badge-pill,
      :host([data-ui-kit="material"]) .status-pill,
      :host([data-ui-kit="material"]) .detail-item,
      :host([data-ui-kit="material"]) .metric-card,
      :host([data-ui-kit="material"]) .home-menu-item,
      :host([data-ui-kit="material"]) .gallery-item,
      :host([data-ui-kit="material"]) .status-panel,
      :host([data-ui-kit="material"]) .app-shell,
      :host([data-ui-kit="material"]) .auth-login,
      :host([data-ui-kit="material"]) .modal-preview {
        border-radius: 4px;
      }

      :host([data-ui-kit="ionic"]) .app-shell,
      :host([data-ui-kit="ionic"]) .auth-login,
      :host([data-ui-kit="ionic"]) .modal-preview,
      :host([data-ui-kit="ionic"]) .metric-card,
      :host([data-ui-kit="ionic"]) .home-menu-item,
      :host([data-ui-kit="ionic"]) .gallery-item {
        border-radius: 16px;
      }

      :host([data-ui-kit="bootstrap"]) .badge-pill,
      :host([data-ui-kit="bootstrap"]) .status-pill,
      :host([data-ui-kit="bootstrap"]) .detail-item,
      :host([data-ui-kit="bootstrap"]) .metric-card,
      :host([data-ui-kit="bootstrap"]) .home-menu-item,
      :host([data-ui-kit="bootstrap"]) .gallery-item,
      :host([data-ui-kit="bootstrap"]) .status-panel,
      :host([data-ui-kit="bootstrap"]) .app-shell,
      :host([data-ui-kit="bootstrap"]) .auth-login,
      :host([data-ui-kit="bootstrap"]) .modal-preview {
        border-radius: 0.375rem;
      }

      @media (max-width: 720px) {
        .toolbar,
        .modal-header,
        .modal-footer,
        .app-shell-header {
          align-items: stretch;
          flex-direction: column;
        }

        .toolbar-actions {
          justify-content: flex-start;
        }
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

        @case ("ui.badge") {
          <span class="badge-pill" [ngClass]="toneClass">
            {{ stringProp("label", "Badge") }}
          </span>
        }

        @case ("ui.metric_card") {
          <article class="metric-card" [ngClass]="toneClass">
            <span class="metric-label">{{ stringProp("label", "Metric") }}</span>
            <strong class="metric-value">{{ stringProp("value", "0") }}</strong>
            @if (stringProp("help", "")) {
              <span class="metric-help">{{ stringProp("help", "") }}</span>
            }
          </article>
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

        @case ("record.list") {
          <div class="data-list">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <article class="list-item">
                <span>
                  <strong>{{ itemText(item, titleKey, "Record") }}</strong>
                  @if (itemText(item, subtitleKey, "")) {
                    <span>{{ itemText(item, subtitleKey, "") }}</span>
                  }
                </span>
                @if (itemText(item, "status", "")) {
                  <span class="status-pill">{{ itemText(item, "status", "") }}</span>
                }
              </article>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No records to show.") }}</span>
            }
          </div>
        }

        @case ("data.detail") {
          <div class="detail-grid">
            @for (item of detailItems; track itemKey(item, $index)) {
              <article class="detail-item">
                <span>{{ itemText(item, "label", "Field") }}</span>
                <strong>{{ itemText(item, "value", "-") }}</strong>
              </article>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No details to show.") }}</span>
            }
          </div>
        }

        @case ("record.detail") {
          <div class="detail-grid">
            @for (item of detailItems; track itemKey(item, $index)) {
              <article class="detail-item">
                <span>{{ itemText(item, "label", "Field") }}</span>
                <strong>{{ itemText(item, "value", "-") }}</strong>
              </article>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No record selected.") }}</span>
            }
          </div>
        }

        @case ("media.gallery") {
          <div class="gallery">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <figure class="gallery-item">
                @if (itemText(item, "src", "")) {
                  <span class="gallery-thumb">
                    <img
                      [src]="itemText(item, 'src', '')"
                      [alt]="itemText(item, 'title', 'Gallery item')"
                      loading="lazy"
                    />
                  </span>
                } @else {
                  <span class="gallery-placeholder">
                    {{ itemText(item, "placeholder", "Imagen") }}
                  </span>
                }
                <figcaption class="gallery-caption">
                  <strong>{{ itemText(item, "title", "Elemento") }}</strong>
                  @if (itemText(item, "subtitle", "")) {
                    <span>{{ itemText(item, "subtitle", "") }}</span>
                  }
                </figcaption>
              </figure>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No media to show.") }}</span>
            }
          </div>
        }

        @case ("overlay.modal") {
          <section class="modal-preview" role="dialog" aria-modal="false">
            <header class="modal-header">
              <h3>{{ stringProp("title", "Modal") }}</h3>
              <app-ui-kit-button
                [kit]="kitForRender"
                label="Cerrar"
                icon="pi pi-times"
                tone="secondary"
                variant="ghost"
                size="small"
                (pressed)="runConfiguredAction('onClose')"
              ></app-ui-kit-button>
            </header>
            <div class="modal-body">
              @if ((contract.children?.length ?? 0) > 0) {
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
              } @else {
                {{ stringProp("message", "Contenido del modal.") }}
              }
            </div>
            @if (objectArrayProp("actions").length) {
              <footer class="modal-footer">
                @for (item of objectArrayProp("actions"); track itemKey(item, $index)) {
                  <app-ui-kit-button
                    [kit]="kitForRender"
                    [label]="itemText(item, 'label', 'Action')"
                    [tone]="itemTone(item)"
                    [variant]="itemVariant(item)"
                    size="small"
                    (pressed)="runToolbarAction(item)"
                  ></app-ui-kit-button>
                }
              </footer>
            }
          </section>
        }

        @case ("auth.login") {
          <section class="auth-login" [style.--auth-width]="stringProp('width', '420px')">
            <header class="auth-login-header">
              <h3>{{ stringProp("title", "Iniciar sesión") }}</h3>
              @if (stringProp("subtitle", "")) {
                <p>{{ stringProp("subtitle", "") }}</p>
              }
            </header>
            <app-dynamic-field-control
              [field]="authIdentityField"
              [value]="authFieldValue(identityFieldName)"
              [presentation]="fieldPresentation"
              [viewportWidth]="context?.viewportWidth"
              [platform]="context?.platform"
              (valueChange)="emitNamedValue(identityFieldName, $event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="authPasswordField"
              [value]="authFieldValue(passwordFieldName)"
              [presentation]="fieldPresentation"
              [viewportWidth]="context?.viewportWidth"
              [platform]="context?.platform"
              (valueChange)="emitNamedValue(passwordFieldName, $event)"
            ></app-dynamic-field-control>
            <app-ui-kit-button
              [kit]="kitForRender"
              [label]="stringProp('submitLabel', 'Entrar')"
              tone="primary"
              variant="solid"
              [full]="true"
              (pressed)="runConfiguredAction('onSubmit')"
            ></app-ui-kit-button>
          </section>
        }

        @case ("app.shell") {
          <section class="app-shell">
            <header class="app-shell-header">
              <div class="app-shell-title">
                <h3>{{ stringProp("title", "App") }}</h3>
                @if (stringProp("subtitle", "")) {
                  <p>{{ stringProp("subtitle", "") }}</p>
                }
              </div>
              @if (objectArrayProp("menuItems").length) {
                <nav class="app-shell-nav" aria-label="App navigation">
                  @for (item of objectArrayProp("menuItems"); track itemKey(item, $index)) {
                    <button
                      type="button"
                      class="tab-item"
                      [class.active]="itemActive(item)"
                      (click)="runNavigationItem(item)"
                    >
                      {{ itemText(item, "label", "Item") }}
                    </button>
                  }
                </nav>
              }
            </header>
            <main class="app-shell-body">
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
            </main>
          </section>
        }

        @case ("app.home_menu") {
          <div class="home-menu">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <button
                type="button"
                class="home-menu-item"
                (click)="runNavigationItem(item)"
              >
                <span class="home-menu-copy">
                  <strong>{{ itemText(item, "label", "Opción") }}</strong>
                  @if (itemText(item, "description", "")) {
                    <span>{{ itemText(item, "description", "") }}</span>
                  }
                </span>
                @if (itemText(item, "badge", "")) {
                  <span class="status-pill">{{ itemText(item, "badge", "") }}</span>
                }
              </button>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No navigation options.") }}</span>
            }
          </div>
        }

        @case ("nav.side_menu") {
          <nav
            class="nav-menu vertical"
            [attr.aria-label]="stringProp('label', 'Side navigation')"
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
                  <span class="status-pill">{{ itemText(item, "badge", "") }}</span>
                }
              </button>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No navigation options.") }}</span>
            }
          </nav>
        }

        @case ("nav.bottom_tabs") {
          <nav class="bottom-tabs" [attr.aria-label]="stringProp('label', 'Bottom tabs')">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <button
                type="button"
                class="tab-item"
                [class.active]="itemActive(item)"
                (click)="runNavigationItem(item)"
              >
                {{ itemText(item, "label", "Tab") }}
              </button>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No tabs.") }}</span>
            }
          </nav>
        }

        @case ("layout.region") {
          <section
            class="stack"
            [style.--dc-gap]="stringProp('gap', '12px')"
            [style.--dc-align]="alignProp"
            [attr.aria-label]="stringProp('label', 'Region')"
          >
            @if (stringProp("title", "")) {
              <div class="card-heading">
                <h3>{{ stringProp("title", "") }}</h3>
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
          </section>
        }

        @case ("ui.action_group") {
          <div
            class="button-row"
            [class.stretch]="stringProp('align', 'start') === 'stretch'"
          >
            @for (item of objectArrayProp("actions"); track itemKey(item, $index)) {
              <app-ui-kit-button
                [kit]="kitForRender"
                [label]="itemText(item, 'label', 'Action')"
                [icon]="itemText(item, 'icon', '')"
                [tone]="itemTone(item)"
                [variant]="itemVariant(item)"
                [full]="booleanItem(item, 'full', false)"
                size="small"
                (pressed)="runToolbarAction(item)"
              ></app-ui-kit-button>
            }
          </div>
        }

        @case ("flow.trigger_button") {
          <app-ui-kit-button
            [kit]="kitForRender"
            [label]="stringProp('label', 'Ejecutar flow')"
            [icon]="stringProp('icon', 'pi pi-bolt')"
            [tone]="buttonTone"
            [variant]="buttonVariant"
            [full]="booleanProp('full', false)"
            (pressed)="runConfiguredAction('onClick')"
          ></app-ui-kit-button>
        }

        @case ("form.runtime") {
          <section class="runtime-form">
            <header class="card-heading">
              <h3>{{ stringProp("title", "Formulario") }}</h3>
              @if (stringProp("subtitle", "")) {
                <p>{{ stringProp("subtitle", "") }}</p>
              }
            </header>
            <div class="runtime-form-fields">
              @for (field of runtimeFields; track field.name) {
                <app-dynamic-field-control
                  [field]="field"
                  [value]="context?.state?.[field.name] ?? ''"
                  [presentation]="fieldPresentation"
                  [viewportWidth]="context?.viewportWidth"
                  [platform]="context?.platform"
                  (valueChange)="emitNamedValue(field.name, $event)"
                ></app-dynamic-field-control>
              }
            </div>
            <app-ui-kit-button
              [kit]="kitForRender"
              [label]="stringProp('submitLabel', 'Guardar')"
              tone="primary"
              variant="solid"
              [full]="true"
              (pressed)="runConfiguredAction('onSubmit')"
            ></app-ui-kit-button>
          </section>
        }

        @case ("service.result") {
          <section class="result-panel">
            <header class="card-heading">
              <h3>{{ stringProp("title", "Resultado del servicio") }}</h3>
              @if (stringProp("subtitle", "")) {
                <p>{{ stringProp("subtitle", "") }}</p>
              }
            </header>
            <app-status-notice [kit]="kitForRender" [tone]="noticeTone">
              {{ stringProp("message", "Sin respuesta todavía.") }}
            </app-status-notice>
            <pre class="fallback">{{ serviceResultText }}</pre>
          </section>
        }

        @case ("data.metric_strip") {
          <div class="stat-grid">
            @for (item of objectArrayProp("items"); track itemKey(item, $index)) {
              <article class="metric-card" [ngClass]="itemToneClass(item)">
                <span class="metric-label">{{ itemText(item, "label", "Metric") }}</span>
                <strong class="metric-value">{{ itemText(item, "value", "0") }}</strong>
                @if (itemText(item, "help", "")) {
                  <span class="metric-help">{{ itemText(item, "help", "") }}</span>
                }
              </article>
            } @empty {
              <span class="empty">{{ stringProp("emptyText", "No metrics to show.") }}</span>
            }
          </div>
        }

        @case ("chart.panel") {
          <section class="chart-panel">
            <header class="card-heading">
              <h3>{{ stringProp("title", "Indicadores") }}</h3>
              @if (stringProp("subtitle", "")) {
                <p>{{ stringProp("subtitle", "") }}</p>
              }
            </header>
            <div class="chart-bars">
              @for (item of chartItems; track itemKey(item, $index)) {
                <div class="chart-row">
                  <strong>{{ itemText(item, "label", "Dato") }}</strong>
                  <span class="chart-track">
                    <span
                      class="chart-fill"
                      [style.--bar-width]="itemPercent(item)"
                    ></span>
                  </span>
                  <span>{{ itemText(item, "value", "0") }}</span>
                </div>
              } @empty {
                <span class="empty">{{ stringProp("emptyText", "No chart data.") }}</span>
              }
            </div>
          </section>
        }

        @case ("map.view") {
          <section class="map-panel">
            <header class="card-heading">
              <h3>{{ stringProp("title", "Mapa") }}</h3>
              @if (stringProp("subtitle", "")) {
                <p>{{ stringProp("subtitle", "") }}</p>
              }
            </header>
            <div class="map-canvas" role="img" [attr.aria-label]="stringProp('title', 'Mapa')">
              @for (item of mapPins; track itemKey(item, $index)) {
                <span
                  class="map-pin"
                  [style.--pin-x]="itemText(item, 'x', '50%')"
                  [style.--pin-y]="itemText(item, 'y', '50%')"
                >
                  {{ itemText(item, "label", "•") }}
                </span>
              }
            </div>
          </section>
        }

        @case ("status.offline") {
          <article class="status-panel" [ngClass]="toneClass">
            <strong>{{ stringProp("title", "Offline") }}</strong>
            <p>{{ stringProp("message", "Última versión disponible en caché.") }}</p>
          </article>
        }

        @case ("status.sync_queue") {
          <article class="status-panel" [ngClass]="toneClass">
            <strong>{{ stringProp("title", "Cola de sincronización") }}</strong>
            <p>{{ stringProp("message", "0 acciones pendientes.") }}</p>
          </article>
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

  get toneClass() {
    return this.classForTone(this.stringProp("tone", "info"));
  }

  get detailItems(): Array<Record<string, unknown>> {
    const configured = this.objectArrayProp("items");
    if (configured.length) {
      return configured;
    }
    const record = this.asRecord(this.resolvedProps["record"]) ?? this.asRecord(this.context?.data?.["record"]);
    if (!record) {
      return [];
    }
    return Object.entries(record).map(([key, value]) => ({
      key,
      label: this.humanize(key),
      value: value === null || value === undefined ? "" : String(value),
    }));
  }

  get runtimeFields(): RuntimeField[] {
    const fields = this.resolvedProps["fields"];
    if (!Array.isArray(fields)) {
      return [];
    }
    return fields
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item) => ({
        name: this.itemText(item, "name", this.itemText(item, "key", "value")),
        key: this.itemText(item, "key", this.itemText(item, "name", "value")),
        label: this.itemText(item, "label", this.humanize(this.itemText(item, "name", "value"))),
        type: this.itemText(item, "type", "text") as RuntimeField["type"],
        placeholder: this.itemText(item, "placeholder", ""),
        required: this.booleanItem(item, "required", false),
        options: Array.isArray(item["options"]) ? (item["options"] as RuntimeField["options"]) : undefined,
      }));
  }

  get serviceResultText() {
    const value =
      this.resolvedProps["result"] ??
      this.context?.data?.["serviceResult"] ??
      this.context?.data?.["result"] ??
      null;
    if (value == null || value === "") {
      return "null";
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  get chartItems(): Array<Record<string, unknown>> {
    const configured = this.objectArrayProp("items");
    if (configured.length) {
      return configured;
    }
    const metrics = this.context?.data?.["metrics"];
    return Array.isArray(metrics) ? metrics.filter((item) => this.isRecord(item)) : [];
  }

  get mapPins(): Array<Record<string, unknown>> {
    const configured = this.objectArrayProp("pins");
    if (configured.length) {
      return configured;
    }
    return [{ key: "main", label: "1", x: "52%", y: "48%" }];
  }

  get identityFieldName() {
    return this.stringProp("identityName", "identity");
  }

  get passwordFieldName() {
    return this.stringProp("passwordName", "password");
  }

  get authIdentityField(): RuntimeField {
    return {
      name: this.identityFieldName,
      label: this.stringProp("identityLabel", "Usuario"),
      type: this.stringProp("identityType", "text") as RuntimeField["type"],
      placeholder: this.stringProp("identityPlaceholder", "Usuario o correo"),
      required: true,
    };
  }

  get authPasswordField(): RuntimeField {
    return {
      name: this.passwordFieldName,
      label: this.stringProp("passwordLabel", "Contraseña"),
      type: "password",
      placeholder: this.stringProp("passwordPlaceholder", "Contraseña"),
      required: true,
    };
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

  booleanItem(item: Record<string, unknown>, key: string, fallback: boolean) {
    const value = item[key];
    return typeof value === "boolean" ? value : fallback;
  }

  itemToneClass(item: Record<string, unknown>) {
    return this.classForTone(this.itemText(item, "tone", "info"));
  }

  itemPercent(item: Record<string, unknown>) {
    const raw = item["percent"] ?? item["value"] ?? 0;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    const safe = Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
    return `${safe}%`;
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

  authFieldValue(fieldName: string) {
    const values = this.asRecord(this.resolvedProps["values"]) ?? this.context?.state ?? {};
    return values[fieldName] ?? "";
  }

  emitNamedValue(fieldName: string, value: unknown) {
    const defaultAction: DeclarativeComponentAction = {
      type: "set_state",
      key: fieldName,
      value,
    };
    if (this.contract) {
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

  private classForTone(tone: string) {
    return `tone-${this.oneOf(
      tone,
      ["success", "warning", "danger", "error", "info", "primary"],
      "info",
    )}`;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return this.isRecord(value) ? value : null;
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
