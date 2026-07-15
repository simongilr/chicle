import { Component, Input } from '@angular/core';
import {
  UiKitId,
  UiKitPreference,
  UiPresentationConfig
} from '../../core/ui/ui-presentation.types';
import { FORMLY_FIELD_LIBRARY_EXAMPLE } from '../../engine/forms/formly/formly-runtime.examples';
import { FormlyRuntimeComponent } from '../formly-runtime/formly-runtime.component';
import { UiPresentationSwitcherComponent } from '../ui-presentation-switcher/ui-presentation-switcher.component';

@Component({
  selector: 'app-dynamic-field-library',
  standalone: true,
  imports: [FormlyRuntimeComponent, UiPresentationSwitcherComponent],
  styles: [
    `
      :host {
        display: grid;
        gap: 14px;
        min-width: 0;
      }

      .library-heading {
        display: grid;
        gap: 4px;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.05rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }
    `
  ],
  template: `
    <div class="library-heading">
      <h2>Campos dinámicos disponibles</h2>
      <p>
        Cambia la presentación para comprobar el mismo esquema en PrimeNG, Ionic, Material, Bootstrap o controles base.
      </p>
    </div>

    @if (showPresentationSwitcher) {
      <app-ui-presentation-switcher
        [value]="kit"
        [resolvedKit]="resolvedKit"
        (valueChange)="selectKit($event)"
      ></app-ui-presentation-switcher>
    }

    <app-formly-runtime
      [definition]="definition"
      [model]="model"
      [presentation]="presentation"
      [viewportWidth]="viewportWidth"
      [showActions]="false"
      (modelChange)="model = $event"
    ></app-formly-runtime>
  `
})
export class DynamicFieldLibraryComponent {
  @Input() showPresentationSwitcher = true;
  @Input() viewportWidth?: number;

  readonly definition = FORMLY_FIELD_LIBRARY_EXAMPLE;
  model: Record<string, unknown> = {
    currency: 125000,
    select: 'first',
    radio: 'a',
    checkbox: true,
    toggle: true,
    file: { name: 'documento.pdf', size: 128000, type: 'application/pdf' },
    image: { name: 'evidencia.jpg', size: 256000, type: 'image/jpeg' },
    gps: { lat: 4.711, lng: -74.0721, accuracy: 25 }
  };
  kit: UiKitPreference = 'auto';
  presentation: UiPresentationConfig = { kit: 'auto' };

  get resolvedKit(): UiKitId {
    return this.kit === 'auto' || this.kit === 'inherit' ? 'primeng' : this.kit;
  }

  selectKit(kit: UiKitPreference) {
    this.kit = kit;
    this.presentation = { kit };
  }
}
