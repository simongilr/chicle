import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogHeaderComponent } from '../catalog-header/catalog-header.component';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-designer-catalog-panel',
  standalone: true,
  imports: [CatalogHeaderComponent, LoadingSkeletonComponent, StatusNoticeComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: grid;
        gap: 12px;
        align-content: start;
        min-width: 0;
      }

      .items {
        display: grid;
        gap: 8px;
      }

      :host([data-ui-kit='material']) {
        gap: 10px;
      }

      :host([data-ui-kit='material']) .items {
        gap: 6px;
      }

      :host([data-ui-kit='bootstrap']) .items {
        border: 1px solid var(--ch-color-border);
        border-radius: 6px;
        overflow: hidden;
        background: var(--ch-color-surface);
      }

      :host([data-ui-kit='bootstrap']) ::ng-deep app-catalog-item button {
        border-radius: 0;
        border-width: 0 0 1px;
      }

      :host([data-ui-kit='ionic']) {
        gap: 10px;
      }

      :host([data-ui-kit='ionic']) .items {
        gap: 10px;
      }

      .empty-state {
        display: grid;
        gap: 6px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 12px;
      }

      .empty-state strong {
        color: var(--ch-color-text);
        font-size: 0.9rem;
        font-weight: 850;
      }

      .empty-state span {
        color: var(--ch-color-muted);
        font-size: 0.84rem;
        line-height: 1.38;
      }

      .error-action {
        width: auto;
      }
    `
  ],
  template: `
    <app-catalog-header [title]="title" [summary]="summary" [kit]="kit">
      <ng-content select="[catalog-actions]"></ng-content>
    </app-catalog-header>

    @if (loading) {
      <app-loading-skeleton variant="list" [label]="loadingLabel || 'Cargando catálogo'" [rows]="loadingRows"></app-loading-skeleton>
    } @else if (error) {
      <app-status-notice [title]="errorTitle || 'No se pudo cargar'" tone="error" [kit]="kit">
        <span>{{ error }}</span>
        @if (showRetry) {
          <button class="error-action" notice-action type="button" (click)="retry.emit()">Reintentar</button>
        }
      </app-status-notice>
    } @else if (empty) {
      <div class="empty-state">
        <strong>{{ emptyTitle }}</strong>
        <span>{{ emptyMessage }}</span>
      </div>
    } @else {
      <div class="items">
        <ng-content></ng-content>
      </div>
    }
  `
})
export class DesignerCatalogPanelComponent extends UiKitAwareComponent {
  @Input({ required: true }) title = '';
  @Input() summary = '';
  @Input() loading = false;
  @Input() loadingLabel = '';
  @Input() loadingRows = 4;
  @Input() error = '';
  @Input() errorTitle = '';
  @Input() showRetry = true;
  @Input() empty = false;
  @Input() emptyTitle = 'Sin elementos todavía';
  @Input() emptyMessage = 'Crea el primer elemento para comenzar.';
  @Input() emptyTone: 'neutral' | 'info' | 'success' | 'warning' | 'error' = 'neutral';

  @Output() retry = new EventEmitter<void>();
}
