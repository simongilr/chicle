import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiKitId, UiKitPreference } from '../../core/ui/ui-presentation.types';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../segmented-control/segmented-control.component';

@Component({
  selector: 'app-ui-presentation-switcher',
  standalone: true,
  imports: [SegmentedControlComponent],
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px 12px;
      }

      .context {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      strong {
        color: var(--ch-color-text);
        font-size: 0.86rem;
      }

      span {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
      }

      @media (max-width: 720px) {
        :host {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `
  ],
  template: `
    <div class="context">
      <strong>Kit visual</strong>
      <span>
        {{
          value === 'auto' || value === 'inherit'
            ? 'Adaptativo: ahora usa ' + kitLabel(resolvedKit)
            : 'Forzado para esta vista'
        }}
      </span>
    </div>
    <app-segmented-control
      ariaLabel="Kit visual de la vista previa"
      [items]="items"
      [value]="value === 'inherit' ? 'auto' : value"
      (valueChange)="select($event)"
    ></app-segmented-control>
  `
})
export class UiPresentationSwitcherComponent {
  @Input() value: UiKitPreference = 'auto';
  @Input() resolvedKit: UiKitId = 'primeng';
  @Output() readonly valueChange = new EventEmitter<UiKitPreference>();

  readonly items: SegmentedControlItem[] = [
    { key: 'auto', label: 'Adaptativo', icon: 'pi pi-sync' },
    { key: 'primeng', label: 'PrimeNG', icon: 'pi pi-desktop' },
    { key: 'ionic', label: 'Ionic', icon: 'pi pi-mobile' },
    { key: 'native', label: 'Base', icon: 'pi pi-code' }
  ];

  select(value: string) {
    if (value === 'auto' || value === 'primeng' || value === 'ionic' || value === 'native') {
      this.valueChange.emit(value);
    }
  }

  kitLabel(kit: UiKitId) {
    return {
      primeng: 'PrimeNG',
      ionic: 'Ionic',
      native: 'Base'
    }[kit];
  }
}

