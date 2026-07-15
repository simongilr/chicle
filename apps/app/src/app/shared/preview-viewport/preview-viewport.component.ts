import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../segmented-control/segmented-control.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

export type PreviewViewportMode = 'desktop' | 'tablet' | 'mobile';

@Component({
  selector: 'app-preview-viewport',
  standalone: true,
  imports: [SegmentedControlComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .viewport-copy {
        display: grid;
        gap: 3px;
      }

      .viewport-copy strong {
        color: var(--ch-color-text);
        font-size: 0.95rem;
      }

      .viewport-copy small {
        color: var(--ch-color-muted);
        line-height: 1.35;
      }

      .stage {
        display: grid;
        justify-items: center;
        min-height: 420px;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          linear-gradient(90deg, color-mix(in srgb, var(--ch-color-surface) 70%, transparent) 1px, transparent 1px),
          linear-gradient(color-mix(in srgb, var(--ch-color-surface) 70%, transparent) 1px, transparent 1px),
          color-mix(in srgb, var(--ch-color-background) 82%, var(--ch-color-border));
        background-size: 24px 24px;
        padding: clamp(12px, 2vw, 22px);
      }

      .device {
        width: 100%;
        max-width: 1180px;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: 12px;
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        transition:
          width 160ms ease,
          border-radius 160ms ease;
      }

      :host([data-ui-kit='material']) .device {
        border-radius: 4px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ch-color-text) 16%, transparent);
      }

      :host([data-ui-kit='bootstrap']) .device {
        border-radius: 6px;
        box-shadow: none;
      }

      :host([data-ui-kit='ionic']) .device {
        border-radius: 20px;
        box-shadow: 0 16px 36px color-mix(in srgb, var(--ch-color-primary) 12%, transparent);
      }

      :host([data-ui-kit='native']) .device {
        border-radius: 2px;
        box-shadow: none;
      }

      .device.tablet {
        width: min(100%, 760px);
      }

      .device.mobile {
        width: min(100%, 390px);
        border-radius: 24px;
      }

      .device-chrome {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 38px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface-alt);
        padding: 8px 12px;
      }

      .device-dots {
        display: inline-flex;
        gap: 5px;
      }

      .device-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ch-color-primary-border);
      }

      .device-title {
        overflow: hidden;
        color: var(--ch-color-text);
        font-size: 0.8rem;
        font-weight: 850;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-size {
        color: var(--ch-color-muted);
        font-size: 0.75rem;
        font-weight: 750;
      }

      .viewport {
        width: 100%;
        min-height: 340px;
        background: var(--ch-color-surface);
        transition: min-height 160ms ease;
      }

      .device.tablet .viewport {
        min-height: 420px;
      }

      .device.mobile .viewport {
        min-height: 520px;
      }

      @media (max-width: 520px) {
        .toolbar {
          align-items: stretch;
        }

        .stage {
          min-height: 360px;
          padding: 10px;
        }

        .device-chrome {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .device-dots {
          display: none;
        }
      }
    `
  ],
  template: `
    <div class="toolbar">
      <div class="viewport-copy">
        <strong>{{ viewportTitle }}</strong>
        <small>{{ viewportDescription }}</small>
      </div>
      <app-segmented-control
        ariaLabel="Tamaño de vista previa"
        [items]="viewportItems"
        [value]="mode"
        [kit]="kit"
        (valueChange)="selectMode($event)"
      ></app-segmented-control>
    </div>
    <div class="stage">
      <div class="device" [class.tablet]="mode === 'tablet'" [class.mobile]="mode === 'mobile'">
        <div class="device-chrome" aria-hidden="true">
          <span class="device-dots">
            <span class="device-dot"></span>
            <span class="device-dot"></span>
            <span class="device-dot"></span>
          </span>
          <span class="device-title">{{ chromeTitle }}</span>
          <span class="device-size">{{ viewportSize }}</span>
        </div>
        <div class="viewport">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class PreviewViewportComponent extends UiKitAwareComponent {
  @Input() mode: PreviewViewportMode = 'desktop';
  @Output() readonly modeChange = new EventEmitter<PreviewViewportMode>();

  readonly viewportItems: SegmentedControlItem[] = [
    { key: 'desktop', label: 'Escritorio', icon: 'pi pi-desktop' },
    { key: 'tablet', label: 'Tablet', icon: 'pi pi-tablet' },
    { key: 'mobile', label: 'Móvil', icon: 'pi pi-mobile' }
  ];

  get viewportTitle() {
    return {
      desktop: 'Vista web',
      tablet: 'Vista tablet',
      mobile: 'Vista móvil'
    }[this.mode];
  }

  get viewportDescription() {
    return {
      desktop: 'Simula una pantalla amplia integrada a un módulo web.',
      tablet: 'Revisa cortes intermedios sin forzar layout móvil.',
      mobile: 'Valida pasos cortos, lectura vertical y acciones táctiles.'
    }[this.mode];
  }

  get chromeTitle() {
    return {
      desktop: 'Web app',
      tablet: 'Tablet app',
      mobile: 'Mobile app'
    }[this.mode];
  }

  get viewportSize() {
    return {
      desktop: '1280+ px',
      tablet: '760 px',
      mobile: '390 px'
    }[this.mode];
  }

  selectMode(mode: string) {
    if (mode === 'desktop' || mode === 'tablet' || mode === 'mobile') {
      this.mode = mode;
      this.modeChange.emit(mode);
    }
  }
}
