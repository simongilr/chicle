import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../segmented-control/segmented-control.component';

export type PreviewViewportMode = 'desktop' | 'tablet' | 'mobile';

@Component({
  selector: 'app-preview-viewport',
  standalone: true,
  imports: [SegmentedControlComponent],
  styles: [
    `
      :host {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .toolbar {
        display: flex;
        justify-content: flex-end;
      }

      .stage {
        display: grid;
        justify-items: center;
        min-height: 320px;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: #e8eef5;
        padding: 18px;
      }

      .viewport {
        width: 100%;
        min-height: 284px;
        border: 1px solid #c8d6e4;
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: 0 8px 24px rgba(20, 50, 80, 0.08);
        transition: width 160ms ease;
      }

      .viewport.tablet {
        width: min(100%, 760px);
      }

      .viewport.mobile {
        width: min(100%, 390px);
      }

      @media (max-width: 520px) {
        .stage {
          padding: 8px;
        }
      }
    `
  ],
  template: `
    <div class="toolbar">
      <app-segmented-control
        ariaLabel="Tamaño de vista previa"
        [items]="viewportItems"
        [value]="mode"
        (valueChange)="selectMode($event)"
      ></app-segmented-control>
    </div>
    <div class="stage">
      <div class="viewport" [class.tablet]="mode === 'tablet'" [class.mobile]="mode === 'mobile'">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class PreviewViewportComponent {
  @Input() mode: PreviewViewportMode = 'desktop';
  @Output() readonly modeChange = new EventEmitter<PreviewViewportMode>();

  readonly viewportItems: SegmentedControlItem[] = [
    { key: 'desktop', label: 'Escritorio', icon: 'pi pi-desktop' },
    { key: 'tablet', label: 'Tablet', icon: 'pi pi-tablet' },
    { key: 'mobile', label: 'Móvil', icon: 'pi pi-mobile' }
  ];

  selectMode(mode: string) {
    if (mode === 'desktop' || mode === 'tablet' || mode === 'mobile') {
      this.mode = mode;
      this.modeChange.emit(mode);
    }
  }
}
