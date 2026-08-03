import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface ScreenCanvasComponent {
  id: string;
  componentKey: string;
  title: string;
  region: string;
  bindingType: string;
  bindingKey: string;
  width: string;
  align: string;
  chrome: string;
  actionType: string;
  actionTarget: string;
  permission: string;
}

@Component({
  selector: 'app-screen-visual-canvas',
  standalone: true,
  imports: [NgTemplateOutlet, UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .screen-canvas {
        display: grid;
        gap: 12px;
        width: 100%;
        min-width: 0;
        min-height: 620px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          linear-gradient(var(--ch-color-surface), var(--ch-color-surface)) padding-box,
          linear-gradient(135deg, var(--ch-color-primary-soft), transparent 46%, var(--ch-color-surface-alt)) border-box;
        box-shadow: var(--ch-shadow-card);
        padding: clamp(12px, 1.6vw, 18px);
        transition:
          width 160ms ease,
          min-height 160ms ease,
          border-radius 160ms ease,
          padding 160ms ease;
      }

      .screen-canvas.viewport-tablet {
        width: min(760px, 100%);
        min-height: 720px;
        margin-inline: auto;
        border-radius: 24px;
      }

      .screen-canvas.viewport-mobile {
        width: min(390px, 100%);
        min-height: 780px;
        margin-inline: auto;
        border-radius: 28px;
        padding: 12px;
      }

      .device-frame-bar {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 30px;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 6px 9px;
        font-size: 0.72rem;
        font-weight: 850;
      }

      .device-dots {
        display: inline-flex;
        gap: 5px;
      }

      .device-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--ch-color-primary-border);
      }

      .device-title,
      .device-size {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-size {
        justify-self: end;
      }

      :host([data-ui-kit='material']) .screen-canvas,
      :host([data-ui-kit='material']) .screen-block,
      :host([data-ui-kit='material']) .screen-topbar,
      :host([data-ui-kit='material']) .canvas-guide,
      :host([data-ui-kit='material']) .screen-aside,
      :host([data-ui-kit='material']) .device-frame-bar,
      :host([data-ui-kit='material']) .empty-zone {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .screen-canvas,
      :host([data-ui-kit='bootstrap']) .screen-block,
      :host([data-ui-kit='bootstrap']) .screen-topbar,
      :host([data-ui-kit='bootstrap']) .canvas-guide,
      :host([data-ui-kit='bootstrap']) .screen-aside,
      :host([data-ui-kit='bootstrap']) .device-frame-bar,
      :host([data-ui-kit='bootstrap']) .empty-zone {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .screen-canvas,
      :host([data-ui-kit='ionic']) .screen-block,
      :host([data-ui-kit='ionic']) .screen-topbar,
      :host([data-ui-kit='ionic']) .canvas-guide,
      :host([data-ui-kit='ionic']) .screen-aside,
      :host([data-ui-kit='ionic']) .device-frame-bar,
      :host([data-ui-kit='ionic']) .empty-zone {
        border-radius: 16px;
      }

      .screen-topbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        box-shadow: 0 10px 24px color-mix(in srgb, var(--ch-color-text) 7%, transparent);
        padding: 8px 10px;
      }

      .canvas-guide {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 9px 10px;
      }

      .guide-copy {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .guide-copy strong,
      .guide-copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .guide-copy strong {
        color: var(--ch-color-text);
        font-size: 0.84rem;
      }

      .guide-copy span {
        color: var(--ch-color-muted);
        font-size: 0.73rem;
        line-height: 1.3;
      }

      .region-map {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }

      .region-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 3px 7px;
        font-size: 0.68rem;
        font-weight: 850;
      }

      .region-pill b {
        color: var(--ch-color-text);
      }

      .brand {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .brand strong,
      .brand span,
      .screen-heading h2,
      .screen-heading p {
        display: block;
        min-width: 0;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .brand strong {
        color: var(--ch-color-text);
        font-size: 0.9rem;
      }

      .brand span {
        color: var(--ch-color-muted);
        font-size: 0.7rem;
        font-weight: 750;
      }

      .menu {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }

      .menu-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 3px 9px;
        font-size: 0.72rem;
        font-weight: 850;
      }

      .menu-item.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .screen-heading {
        display: grid;
        gap: 4px;
        border-bottom: 1px solid var(--ch-color-border);
        padding: 2px 2px 10px;
      }

      .screen-heading h2 {
        color: var(--ch-color-text);
        font-size: clamp(1.08rem, 1.6vw, 1.38rem);
        line-height: 1.15;
      }

      .screen-heading p {
        max-width: 760px;
        color: var(--ch-color-muted);
        font-size: 0.88rem;
        line-height: 1.35;
      }

      .screen-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 0.28fr);
        gap: 14px;
        align-items: start;
        min-width: 0;
      }

      .screen-body.mobile,
      .screen-body.tablet {
        grid-template-columns: 1fr;
      }

      .screen-canvas.viewport-mobile .screen-topbar {
        align-items: stretch;
        flex-direction: column;
      }

      .screen-canvas.viewport-mobile .menu {
        justify-content: flex-start;
      }

      .screen-canvas.viewport-mobile .canvas-guide {
        grid-template-columns: 1fr;
      }

      .screen-canvas.viewport-mobile .region-map {
        justify-content: flex-start;
      }

      .screen-canvas.viewport-mobile .screen-heading h2 {
        font-size: 1.22rem;
      }

      .content-flow,
      .aside-flow,
      .action-flow,
      .header-flow {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .header-flow {
        margin-top: -2px;
      }

      .canvas-region {
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: color-mix(in srgb, var(--ch-color-surface-alt) 55%, transparent);
        padding: 10px;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          box-shadow 140ms ease;
      }

      .canvas-region.drop-active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        box-shadow: 0 0 0 2px var(--ch-color-primary-soft);
      }

      .screen-aside {
        display: grid;
        gap: 10px;
        min-width: 0;
        padding: 10px;
      }

      .zone-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .zone-label small {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 750;
        letter-spacing: 0;
        text-transform: none;
      }

      .zone-label::after {
        content: '';
        flex: 1 1 auto;
        height: 1px;
        background: var(--ch-color-border);
      }

      .block-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 9px;
      }

      .screen-body.tablet .block-grid,
      .screen-body.mobile .block-grid {
        grid-template-columns: 1fr;
      }

      .screen-body.tablet .screen-block,
      .screen-body.mobile .screen-block {
        grid-column: 1 / -1 !important;
      }

      .screen-block {
        display: grid;
        gap: 8px;
        min-width: 0;
        min-height: 82px;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition:
          border-color 140ms ease,
          box-shadow 140ms ease,
          transform 140ms ease;
      }

      .screen-block:hover,
      .screen-block:focus-visible {
        border-color: var(--ch-color-primary-border);
        outline: none;
        transform: translateY(-1px);
      }

      .screen-block.card {
        box-shadow: var(--ch-shadow-card);
      }

      .screen-block.plain {
        border-style: dashed;
        background: transparent;
      }

      .screen-block.toolbar {
        min-height: 62px;
        align-content: center;
      }

      .screen-block.modal,
      .screen-block.drawer {
        border-style: dashed;
      }

      .screen-block.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
        box-shadow: 0 0 0 2px var(--ch-color-primary-soft);
      }

      .block-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
        min-width: 0;
      }

      .block-copy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .block-copy strong,
      .block-copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .block-copy strong {
        font-size: 0.86rem;
        line-height: 1.2;
      }

      .block-copy span {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        line-height: 1.3;
      }

      .block-preview {
        display: grid;
        gap: 8px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: calc(var(--ch-radius) - 2px);
        background: var(--ch-color-surface-alt);
        padding: 8px;
      }

      .runtime-preview {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .runtime-nav,
      .runtime-tabs,
      .runtime-actions,
      .runtime-metrics,
      .runtime-table-row,
      .runtime-gallery,
      .runtime-timeline-row,
      .runtime-card-row {
        display: flex;
        gap: 6px;
        min-width: 0;
      }

      .runtime-nav,
      .runtime-tabs {
        flex-wrap: wrap;
      }

      .runtime-tab,
      .runtime-nav-button,
      .runtime-action-button,
      .runtime-form button,
      .runtime-modal button {
        min-height: 28px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 5px 9px;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 850;
        cursor: pointer;
      }

      .runtime-tab.active,
      .runtime-nav-button.active,
      .runtime-action-button.primary,
      .runtime-form button,
      .runtime-modal button {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary);
        color: var(--ch-color-on-primary);
      }

      .runtime-form,
      .runtime-table,
      .runtime-card,
      .runtime-timeline,
      .runtime-modal {
        display: grid;
        gap: 8px;
        min-width: 0;
      }

      .runtime-field {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .runtime-field label {
        color: var(--ch-color-text);
        font-size: 0.68rem;
        font-weight: 850;
      }

      .runtime-field > span {
        color: var(--ch-color-text);
        font-size: 0.68rem;
        font-weight: 850;
      }

      .runtime-field input,
      .runtime-field select,
      .runtime-field textarea {
        width: 100%;
        min-width: 0;
        min-height: 32px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 6px 8px;
        font: inherit;
        font-size: 0.78rem;
      }

      .runtime-field textarea {
        min-height: 58px;
        resize: vertical;
      }

      .runtime-table {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        overflow: hidden;
      }

      .runtime-table-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) auto;
        gap: 8px;
        align-items: center;
        min-height: 30px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 6px 8px;
        font-size: 0.72rem;
      }

      .runtime-table-row:last-child {
        border-bottom: 0;
      }

      .runtime-table-row.header {
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        font-weight: 900;
      }

      .runtime-table-row button {
        min-height: 24px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface);
        color: var(--ch-color-primary);
        padding: 3px 7px;
        font: inherit;
        font-size: 0.68rem;
        font-weight: 850;
        cursor: pointer;
      }

      .runtime-metric {
        flex: 1 1 0;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: 10px;
        background: var(--ch-color-surface);
        padding: 8px;
      }

      .runtime-metric strong,
      .runtime-metric span {
        display: block;
      }

      .runtime-metric strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .runtime-metric span {
        color: var(--ch-color-muted);
        font-size: 0.68rem;
        font-weight: 750;
      }

      .runtime-gallery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .runtime-image {
        aspect-ratio: 1.2;
        border-radius: 10px;
        border: 1px solid var(--ch-color-border);
        background:
          radial-gradient(circle at 70% 30%, var(--ch-color-primary-soft), transparent 24%),
          linear-gradient(135deg, var(--ch-color-surface), var(--ch-color-surface-alt));
      }

      .runtime-map {
        position: relative;
        width: 100%;
        height: 72px;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: 12px;
        background:
          linear-gradient(135deg, transparent 48%, var(--ch-color-primary-soft) 49% 52%, transparent 53%),
          var(--ch-color-surface);
      }

      .runtime-map::after {
        content: '';
        position: absolute;
        top: 34%;
        left: 50%;
        width: 14px;
        height: 14px;
        border: 3px solid var(--ch-color-on-primary);
        border-radius: 999px 999px 999px 0;
        background: var(--ch-color-primary);
        transform: translate(-50%, -50%) rotate(-45deg);
        box-shadow: 0 6px 14px color-mix(in srgb, var(--ch-color-primary) 42%, transparent);
      }

      .runtime-dot {
        flex: 0 0 auto;
        width: 12px;
        height: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        margin-top: 1px;
      }

      .runtime-dot.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary);
      }

      .runtime-line {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 12px;
        border-radius: 6px;
        background: var(--ch-color-surface);
        border: 1px solid var(--ch-color-border);
      }

      .runtime-avatar {
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
      }

      .runtime-modal {
        margin-inline: auto;
        width: min(100%, 220px);
        border: 1px solid var(--ch-color-border);
        border-radius: 12px;
        background: var(--ch-color-surface);
        padding: 10px;
        box-shadow: var(--ch-shadow-card);
      }

      .runtime-card strong,
      .runtime-modal strong {
        color: var(--ch-color-text);
        font-size: 0.82rem;
      }

      .runtime-card span,
      .runtime-modal span {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        line-height: 1.35;
      }

      .block-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 2px 7px;
        font-size: 0.68rem;
        font-weight: 850;
        white-space: nowrap;
      }

      .block-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
        border-top: 1px solid var(--ch-color-border);
        padding-top: 7px;
        opacity: 0.76;
      }

      .screen-block:hover .block-actions,
      .screen-block:focus-visible .block-actions,
      .screen-block.active .block-actions {
        opacity: 1;
      }

      .empty-zone {
        display: grid;
        gap: 7px;
        place-items: center;
        min-height: 74px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius-sm);
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 9px;
        text-align: center;
        font-size: 0.74rem;
        line-height: 1.35;
      }

      .empty-zone i {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      @media (max-width: 920px) {
        .screen-body {
          grid-template-columns: 1fr;
        }

        .screen-topbar {
          align-items: stretch;
        }

        .canvas-guide {
          grid-template-columns: 1fr;
        }

        .region-map {
          justify-content: flex-start;
        }

        .menu {
          justify-content: flex-start;
        }
      }
    `
  ],
  template: `
    <section
      class="screen-canvas"
      [class.viewport-desktop]="viewport === 'desktop'"
      [class.viewport-tablet]="viewport === 'tablet'"
      [class.viewport-mobile]="viewport === 'mobile'"
      aria-label="Diseñador visual de pantalla"
    >
      <div class="device-frame-bar" aria-hidden="true">
        <span class="device-dots">
          <span class="device-dot"></span>
          <span class="device-dot"></span>
          <span class="device-dot"></span>
        </span>
        <span class="device-title">{{ viewportLabel }}</span>
        <span class="device-size">{{ viewportSize }}</span>
      </div>

      <nav class="screen-topbar" aria-label="Navegación de preview">
        <div class="brand">
          <strong>{{ appName || 'Mi app' }}</strong>
          <span>{{ targetLabel }} · {{ route || '/inicio' }}</span>
        </div>
        <div class="menu">
          @for (item of navigationItems; track item.route) {
            <span class="menu-item" [class.active]="item.active">{{ item.label }}</span>
          }
          @if (!navigationItems.length) {
            <span class="menu-item active">Inicio</span>
          }
        </div>
      </nav>

      <section class="canvas-guide" aria-label="Guía del canvas">
        <div class="guide-copy">
          <strong>Canvas editable</strong>
          <span>Drop en una región. Clic en un bloque para editar datos, acción y permisos.</span>
        </div>
        <div class="region-map" aria-label="Resumen de regiones">
          <span class="region-pill"><b>{{ componentsFor('header').length }}</b> Header</span>
          <span class="region-pill"><b>{{ componentsFor('content').length }}</b> Contenido</span>
          <span class="region-pill"><b>{{ componentsFor('aside').length }}</b> Lateral</span>
          <span class="region-pill"><b>{{ componentsFor('actions').length }}</b> Acciones</span>
        </div>
      </section>

      <div
        class="header-flow canvas-region"
        [class.drop-active]="dragRegion === 'header'"
        (dragenter)="setDragRegion('header')"
        (dragleave)="clearDragRegion()"
        (dragover)="allowDrop($event)"
        (drop)="dropOnRegion($event, 'header')"
      >
        <span class="zone-label">Header <small>navegación, hero o tabs</small></span>
        <div class="block-grid">
          @for (component of componentsFor('header'); track component.id) {
            <ng-container
              [ngTemplateOutlet]="blockTemplate"
              [ngTemplateOutletContext]="{ component: component }"
            ></ng-container>
          }
          @if (!componentsFor('header').length) {
            <div class="empty-zone" style="grid-column: 1 / -1;">
              <i class="pi pi-arrow-down" aria-hidden="true"></i>
              <span>Arrastra aquí navegación, tabs o encabezados.</span>
            </div>
          }
        </div>
      </div>

      <header class="screen-heading">
        <h2>{{ screenTitle || 'Pantalla sin título' }}</h2>
        <p>{{ screenDescription || 'Describe qué verá el usuario en esta pantalla.' }}</p>
      </header>

      <div class="screen-body" [class.tablet]="viewport === 'tablet'" [class.mobile]="viewport === 'mobile'">
        <main
          class="content-flow canvas-region"
          [class.drop-active]="dragRegion === 'content'"
          (dragenter)="setDragRegion('content')"
          (dragleave)="clearDragRegion()"
          (dragover)="allowDrop($event)"
          (drop)="dropOnRegion($event, 'content')"
        >
          <span class="zone-label">Contenido <small>formularios, tablas, cards y galerías</small></span>
          <div class="block-grid">
            @for (component of componentsFor('content'); track component.id) {
              <ng-container
                [ngTemplateOutlet]="blockTemplate"
                [ngTemplateOutletContext]="{ component: component }"
              ></ng-container>
            }
            @if (!componentsFor('content').length) {
              <div class="empty-zone" style="grid-column: 1 / -1;">
                <i class="pi pi-plus" aria-hidden="true"></i>
                <span>Arrastra aquí formularios, tablas, cards o galerías.</span>
              </div>
            }
          </div>

          <section
            class="action-flow canvas-region"
            [class.drop-active]="dragRegion === 'actions'"
            (dragenter)="setDragRegion('actions')"
            (dragleave)="clearDragRegion()"
            (dragover)="allowDrop($event)"
            (drop)="dropOnRegion($event, 'actions')"
          >
            <span class="zone-label">Acciones <small>servicios, flows y navegación</small></span>
            <div class="block-grid">
              @for (component of componentsFor('actions'); track component.id) {
                <ng-container
                  [ngTemplateOutlet]="blockTemplate"
                  [ngTemplateOutletContext]="{ component: component }"
                ></ng-container>
              }
              @if (!componentsFor('actions').length) {
                <div class="empty-zone" style="grid-column: 1 / -1;">
                  <i class="pi pi-bolt" aria-hidden="true"></i>
                  <span>Arrastra aquí botones de servicio, flows o acciones.</span>
                </div>
              }
            </div>
          </section>
        </main>

        <aside
          class="screen-aside canvas-region"
          [class.drop-active]="dragRegion === 'aside'"
          (dragenter)="setDragRegion('aside')"
          (dragleave)="clearDragRegion()"
          (dragover)="allowDrop($event)"
          (drop)="dropOnRegion($event, 'aside')"
        >
          <span class="zone-label">Lateral <small>filtros, contexto o menú</small></span>
          <div class="block-grid">
            @for (component of componentsFor('aside'); track component.id) {
              <ng-container
                [ngTemplateOutlet]="blockTemplate"
                [ngTemplateOutletContext]="{ component: component }"
              ></ng-container>
            }
            @if (!componentsFor('aside').length) {
              <div class="empty-zone" style="grid-column: 1 / -1;">
                <i class="pi pi-filter" aria-hidden="true"></i>
                <span>Arrastra aquí filtros, menú lateral o contexto.</span>
              </div>
            }
          </div>
        </aside>
      </div>
    </section>

    <ng-template #blockTemplate let-component="component">
      <article
        class="screen-block"
        [class.active]="component.id === selectedId"
        [class.card]="component.chrome === 'card'"
        [class.plain]="component.chrome === 'plain'"
        [class.toolbar]="component.chrome === 'toolbar'"
        [class.modal]="component.chrome === 'modal'"
        [class.drawer]="component.chrome === 'drawer'"
        [style.grid-column]="componentColumn(component)"
        [style.justify-self]="component.align === 'stretch' ? 'stretch' : component.align"
        role="button"
        tabindex="0"
        (click)="selected.emit(component.id)"
        (keydown.enter)="selected.emit(component.id)"
      >
        <div class="block-head">
          <div class="block-copy">
            <strong>{{ component.title }}</strong>
            <span>{{ componentDescription(component) }}</span>
          </div>
          <span class="block-chip">{{ component.width }}</span>
        </div>

        <div class="block-copy">
          <span>{{ bindingSummary(component) }}</span>
          <span>{{ actionSummary(component) }}</span>
        </div>

        <div
          class="block-preview runtime-preview"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          @switch (previewKind(component)) {
            @case ('nav') {
              <nav class="runtime-nav" aria-label="Preview navegación">
                <button type="button" class="runtime-nav-button active">Inicio</button>
                <button type="button" class="runtime-nav-button">Menú</button>
                <button type="button" class="runtime-nav-button">Perfil</button>
              </nav>
            }
            @case ('login') {
              <form class="runtime-form" (submit)="$event.preventDefault(); $event.stopPropagation()">
                <label class="runtime-field">
                  <span>Usuario</span>
                  <input type="email" value="admin@empresa.com" />
                </label>
                <label class="runtime-field">
                  <span>Contraseña</span>
                  <input type="password" value="123456" />
                </label>
                <button type="submit">Ingresar</button>
              </form>
            }
            @case ('form') {
              <form class="runtime-form" (submit)="$event.preventDefault(); $event.stopPropagation()">
                <label class="runtime-field">
                  <span>Nombre</span>
                  <input type="text" value="Cliente demo" />
                </label>
                <label class="runtime-field">
                  <span>Estado</span>
                  <select>
                    <option>Activo</option>
                    <option>Pendiente</option>
                  </select>
                </label>
                <label class="runtime-field">
                  <span>Notas</span>
                  <textarea>Observación de ejemplo</textarea>
                </label>
                <button type="submit">Guardar</button>
              </form>
            }
            @case ('table') {
              <div class="runtime-table" role="table" aria-label="Preview tabla">
                <div class="runtime-table-row header" role="row">
                  <span>Nombre</span>
                  <span>Estado</span>
                  <span>Acción</span>
                </div>
                <div class="runtime-table-row" role="row">
                  <span>Cliente A</span>
                  <span>Activo</span>
                  <button type="button">Ver</button>
                </div>
                <div class="runtime-table-row" role="row">
                  <span>Cliente B</span>
                  <span>Pendiente</span>
                  <button type="button">Ver</button>
                </div>
              </div>
            }
            @case ('action') {
              <div class="runtime-actions">
                <button type="button" class="runtime-action-button primary">Ejecutar</button>
                <button type="button" class="runtime-action-button">Probar</button>
              </div>
            }
            @case ('metrics') {
              <div class="runtime-metrics">
                <div class="runtime-metric">
                  <strong>24</strong>
                  <span>Activos</span>
                </div>
                <div class="runtime-metric">
                  <strong>8</strong>
                  <span>Pendientes</span>
                </div>
                <div class="runtime-metric">
                  <strong>92%</strong>
                  <span>OK</span>
                </div>
              </div>
            }
            @case ('gallery') {
              <div class="runtime-gallery" aria-label="Preview galería">
                <span class="runtime-image"></span>
                <span class="runtime-image"></span>
                <span class="runtime-image"></span>
              </div>
            }
            @case ('map') {
              <span class="runtime-map" aria-label="Preview mapa"></span>
            }
            @case ('timeline') {
              <div class="runtime-timeline">
                <div class="runtime-timeline-row"><span class="runtime-dot active"></span><span class="runtime-line"></span></div>
                <div class="runtime-timeline-row"><span class="runtime-dot"></span><span class="runtime-line"></span></div>
              </div>
            }
            @case ('modal') {
              <div class="runtime-modal">
                <strong>Modal</strong>
                <span>Contenido editable.</span>
                <button type="button">Abrir</button>
              </div>
            }
            @default {
              <div class="runtime-card">
                <div class="runtime-card-row"><span class="runtime-avatar"></span><span class="runtime-line"></span></div>
                <strong>Registro</strong>
                <span>Vista compacta de datos.</span>
              </div>
            }
          }
        </div>

        <div class="block-actions" (click)="$event.stopPropagation()">
          <app-ui-kit-button
            label="Editar"
            icon="pi pi-pencil"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="selected.emit(component.id)"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Subir"
            icon="pi pi-arrow-up"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="moved.emit({ id: component.id, direction: -1 })"
          ></app-ui-kit-button>
          <app-ui-kit-button
            label="Bajar"
            icon="pi pi-arrow-down"
            tone="secondary"
            variant="ghost"
            size="small"
            (pressed)="moved.emit({ id: component.id, direction: 1 })"
          ></app-ui-kit-button>
        </div>
      </article>
    </ng-template>
  `
})
export class ScreenVisualCanvasComponent extends UiKitAwareComponent {
  @Input() appName = '';
  @Input() targetLabel = 'multi';
  @Input() route = '/inicio';
  @Input() screenTitle = '';
  @Input() screenDescription = '';
  @Input() viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  @Input() components: ScreenCanvasComponent[] = [];
  @Input() selectedId: string | null = null;
  @Input() navigationItems: Array<{ label: string; route: string; active: boolean }> = [];

  @Output() readonly selected = new EventEmitter<string>();
  @Output() readonly moved = new EventEmitter<{ id: string; direction: -1 | 1 }>();
  @Output() readonly regionDropped = new EventEmitter<{ key: string; region: string }>();

  dragRegion = '';

  get viewportLabel() {
    const labels: Record<'desktop' | 'tablet' | 'mobile', string> = {
      desktop: 'Web app',
      tablet: 'Tablet app',
      mobile: 'Mobile app'
    };
    return labels[this.viewport];
  }

  get viewportSize() {
    const labels: Record<'desktop' | 'tablet' | 'mobile', string> = {
      desktop: '1280+ px',
      tablet: '760 px',
      mobile: '390 px'
    };
    return labels[this.viewport];
  }

  componentsFor(region: string) {
    return this.components.filter((component) => component.region === region);
  }

  setDragRegion(region: string) {
    this.dragRegion = region;
  }

  clearDragRegion() {
    this.dragRegion = '';
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  dropOnRegion(event: DragEvent, region: string) {
    event.preventDefault();
    event.stopPropagation();
    const key =
      event.dataTransfer?.getData('application/x-chicle-component') || event.dataTransfer?.getData('text/plain');
    this.dragRegion = '';
    if (key) {
      this.regionDropped.emit({ key, region });
    }
  }

  componentColumn(component: ScreenCanvasComponent) {
    if (this.viewport !== 'desktop') {
      return '1 / -1';
    }
    const columns: Record<string, string> = {
      full: 'span 12',
      two_thirds: 'span 8',
      half: 'span 6',
      third: 'span 4',
      quarter: 'span 3',
      auto: component.region === 'header' ? 'span 12' : 'span 6'
    };
    return columns[component.width] ?? 'span 6';
  }

  componentDescription(component: ScreenCanvasComponent) {
    const descriptions: Record<string, string> = {
      nav_menu: 'Menú superior conectado a las rutas publicadas.',
      side_nav: 'Navegación lateral para secciones amplias.',
      bottom_nav: 'Navegación inferior para móvil.',
      tabs: 'Tabs para agrupar vistas relacionadas.',
      auth_login: 'Login estándar conectado a Auth.',
      form_runtime: 'Formulario dinámico publicado.',
      data_table: 'Listado conectado a servicio o tabla.',
      service_button: 'Botón que ejecuta un servicio dinámico.',
      flow_button: 'Botón que dispara un flow publicado.',
      metric_strip: 'Indicadores de negocio.',
      chart_panel: 'Gráfico o resumen visual.',
      entity_card: 'Card de entidad o registro.',
      detail_panel: 'Detalle de registro.',
      timeline: 'Historial de eventos.',
      media_gallery: 'Galería de imágenes o evidencias.',
      map_view: 'Mapa o ubicación GPS.',
      modal_shell: 'Modal configurable.'
    };
    return descriptions[component.componentKey] ?? 'Bloque reutilizable de pantalla.';
  }

  bindingSummary(component: ScreenCanvasComponent) {
    if (component.bindingType === 'none' || !component.bindingKey) {
      return 'Sin datos conectados';
    }
    return `${component.bindingType}: ${component.bindingKey}`;
  }

  actionSummary(component: ScreenCanvasComponent) {
    if (component.actionType === 'none') {
      return 'Sin acción primaria';
    }
    return `${component.actionType}${component.actionTarget ? ': ' + component.actionTarget : ''}`;
  }

  previewKind(component: ScreenCanvasComponent) {
    if (['nav_menu', 'side_nav', 'bottom_nav', 'tabs'].includes(component.componentKey)) {
      return 'nav';
    }
    if (component.componentKey === 'auth_login') {
      return 'login';
    }
    if (component.componentKey === 'form_runtime') {
      return 'form';
    }
    if (['data_table', 'search_panel', 'detail_panel'].includes(component.componentKey)) {
      return 'table';
    }
    if (['service_button', 'flow_button'].includes(component.componentKey)) {
      return 'action';
    }
    if (['metric_strip', 'chart_panel'].includes(component.componentKey)) {
      return 'metrics';
    }
    if (component.componentKey === 'media_gallery') {
      return 'gallery';
    }
    if (component.componentKey === 'map_view') {
      return 'map';
    }
    if (component.componentKey === 'timeline') {
      return 'timeline';
    }
    if (component.componentKey === 'modal_shell') {
      return 'modal';
    }
    return 'card';
  }
}
