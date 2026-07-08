import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogHeaderComponent } from '../catalog-header/catalog-header.component';
import { LoadingSkeletonComponent } from '../loading-skeleton/loading-skeleton.component';
import { StatusNoticeComponent } from '../status-notice/status-notice.component';

@Component({
  selector: 'app-designer-catalog-panel',
  standalone: true,
  imports: [CatalogHeaderComponent, LoadingSkeletonComponent, StatusNoticeComponent],
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

      .empty-state {
        display: grid;
        gap: 6px;
        border: 1px dashed #c8d8e7;
        border-radius: 8px;
        background: #fbfdff;
        color: #24435f;
        padding: 12px;
      }

      .empty-state strong {
        color: #173b5f;
        font-size: 0.9rem;
        font-weight: 850;
      }

      .empty-state span {
        color: #52677a;
        font-size: 0.84rem;
        line-height: 1.38;
      }

      .error-action {
        width: auto;
      }
    `
  ],
  template: `
    <app-catalog-header [title]="title" [summary]="summary">
      <ng-content select="[catalog-actions]"></ng-content>
    </app-catalog-header>

    @if (loading) {
      <app-loading-skeleton variant="list" [label]="loadingLabel || 'Cargando catálogo'" [rows]="loadingRows"></app-loading-skeleton>
    } @else if (error) {
      <app-status-notice [title]="errorTitle || 'No se pudo cargar'" tone="error">
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
export class DesignerCatalogPanelComponent {
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
