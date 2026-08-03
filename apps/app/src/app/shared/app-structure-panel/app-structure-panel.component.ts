import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitButtonComponent } from '../ui-kit-button/ui-kit-button.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export interface AppStructureScreen {
  id: string;
  key: string;
  title: string;
  route?: string | null;
  target: string;
  published: boolean;
  version: number;
}

@Component({
  selector: 'app-app-structure-panel',
  standalone: true,
  imports: [UiKitButtonComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: grid;
        min-width: 0;
      }

      .structure {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .structure-top {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        justify-content: space-between;
        min-width: 0;
      }

      .structure-head {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .structure-head strong,
      .structure-head span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .structure-head strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .structure-head span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.38;
      }

      .structure-list {
        display: flex;
        gap: 8px;
        min-width: 0;
        overflow-x: auto;
        padding: 1px 1px 8px;
        scroll-snap-type: x proximity;
      }

      .screen-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        flex: 0 0 min(190px, 72vw);
        width: auto;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 10px;
        text-align: left;
        font: inherit;
        cursor: pointer;
        scroll-snap-align: start;
        transition:
          background 140ms ease,
          border-color 140ms ease,
          transform 140ms ease;
      }

      .screen-item:hover,
      .screen-item:focus-visible {
        border-color: var(--ch-color-primary-border);
        outline: none;
        transform: translateY(-1px);
      }

      .screen-item.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      :host([data-ui-kit='material']) .screen-item {
        border-radius: 4px;
      }

      :host([data-ui-kit='bootstrap']) .screen-item {
        border-radius: 6px;
      }

      :host([data-ui-kit='ionic']) .screen-item {
        border-radius: 14px;
      }

      .screen-title,
      .screen-meta {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .screen-title {
        font-size: 0.86rem;
        font-weight: 850;
      }

      .screen-meta {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        line-height: 1.3;
      }

      .screen-state {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: flex-start;
      }

      .chip {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 2px 7px;
        font-size: 0.68rem;
        font-weight: 850;
      }

      .empty {
        flex: 1 1 auto;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 11px;
        font-size: 0.8rem;
        line-height: 1.35;
      }

      @media (max-width: 760px) {
        .structure-top,
        .screen-item {
          flex-direction: column;
        }
      }
    `
  ],
  template: `
    <section class="structure" aria-label="Estructura de la app">
      <div class="structure-top">
        <div class="structure-head">
          <strong>{{ appName || 'App sin nombre' }}</strong>
          <span>{{ summary }}</span>
        </div>

        <app-ui-kit-button
          label="Página"
          icon="pi pi-plus"
          tone="secondary"
          variant="outline"
          size="small"
          (pressed)="newScreen.emit()"
        ></app-ui-kit-button>
      </div>

      <div class="structure-list">
        @if (!screens.length) {
          <div class="empty">Crea la primera página para comenzar a componer la app.</div>
        }

        @for (screen of screens; track screen.id) {
          <button type="button" class="screen-item" [class.active]="screen.id === selectedScreenId" (click)="screenSelected.emit(screen.id)">
            <span>
              <span class="screen-title">{{ screen.title }}</span>
              <span class="screen-meta">{{ screen.route || '/' }} · {{ screen.target }}</span>
            </span>
            <span class="screen-state">
              <span class="chip">v{{ screen.version }}</span>
              <span class="chip">{{ screen.published ? 'publicada' : 'draft' }}</span>
            </span>
          </button>
        }
      </div>
    </section>
  `
})
export class AppStructurePanelComponent extends UiKitAwareComponent {
  @Input() appName = '';
  @Input() summary = '';
  @Input() screens: AppStructureScreen[] = [];
  @Input() selectedScreenId: string | null = null;

  @Output() readonly screenSelected = new EventEmitter<string>();
  @Output() readonly newScreen = new EventEmitter<void>();
}
