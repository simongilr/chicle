import { Component, Input } from '@angular/core';
import {
  UiKitId,
  UiKitPreference,
  UiPresentationConfig
} from '../../core/ui/ui-presentation.types';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { FORMLY_FIELD_LIBRARY_EXAMPLE } from '../../engine/forms/formly/formly-runtime.examples';
import { DynamicFieldControlComponent } from '../dynamic-field-control/dynamic-field-control.component';
import { UiPresentationSwitcherComponent } from '../ui-presentation-switcher/ui-presentation-switcher.component';

@Component({
  selector: 'app-dynamic-field-library',
  standalone: true,
  imports: [DynamicFieldControlComponent, UiPresentationSwitcherComponent],
  styles: [
    `
      :host {
        display: grid;
        gap: 16px;
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

      .library-example {
        display: grid;
        gap: 18px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 16px;
        min-width: 0;
      }

      .library-copy {
        display: grid;
        gap: 8px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 14px;
      }

      .library-copy h3 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .library-divider {
        height: 1px;
        background: var(--ch-color-border);
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        align-items: start;
        min-width: 0;
      }

      .field-cell {
        min-width: 0;
      }

      .field-cell--full {
        grid-column: 1 / -1;
      }

      @media (max-width: 720px) {
        .library-example {
          padding: 12px;
        }

        .field-grid {
          grid-template-columns: 1fr;
        }
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
        [value]="selectedKit"
        [resolvedKit]="resolvedKit"
        (valueChange)="selectKit($event)"
      ></app-ui-presentation-switcher>
    }

    <section class="library-example" aria-label="Controles dinámicos renderizados">
      @if (displayFields.length) {
        <div class="library-copy">
          @for (field of displayFields; track field.name) {
            @switch (field.type) {
              @case ('title') {
                <h3>{{ field.label }}</h3>
              }
              @case ('paragraph') {
                <p>{{ field.text || field.label }}</p>
              }
              @case ('divider') {
                <div class="library-divider" role="separator"></div>
              }
            }
          }
        </div>
      }

      <div class="field-grid">
        @for (field of controlFields; track field.name) {
          <div class="field-cell" [class.field-cell--full]="isFull(field)">
            <app-dynamic-field-control
              [field]="field"
              [value]="model[field.name]"
              [presentation]="presentation"
              [viewportWidth]="viewportWidth"
              (valueChange)="setValue(field.name, $event)"
            ></app-dynamic-field-control>
          </div>
        }
      </div>
    </section>
  `
})
export class DynamicFieldLibraryComponent {
  @Input() showPresentationSwitcher = true;
  @Input() viewportWidth?: number;
  @Input()
  set kit(value: UiKitPreference) {
    this.selectKit(value || 'auto');
  }

  readonly definition = FORMLY_FIELD_LIBRARY_EXAMPLE;
  model: Record<string, unknown> = {
    text: 'Referencia A-001',
    email: 'sain_7@hotmail.com',
    password: 'solo-para-preview',
    number: 0,
    currency: 125000,
    telephone: '+57 300 000 0000',
    url: 'https://example.com',
    date: '2026-07-24',
    time: '08:30',
    datetime: '2026-07-24T08:30',
    select: 'first',
    radio: 'a',
    checkbox: true,
    toggle: true,
    file: { name: 'documento.pdf', size: 128000, type: 'application/pdf' },
    image: { name: 'evidencia.jpg', size: 256000, type: 'image/jpeg' },
    gps: { lat: 4.711, lng: -74.0721, accuracy: 25 }
  };
  selectedKit: UiKitPreference = 'auto';
  presentation: UiPresentationConfig = { kit: 'auto' };

  get resolvedKit(): UiKitId {
    return this.selectedKit === 'auto' || this.selectedKit === 'inherit' ? 'primeng' : this.selectedKit;
  }

  get displayFields() {
    return this.definition.fields.filter((field) => this.isDisplayField(field));
  }

  get controlFields() {
    return this.definition.fields.filter((field) => !this.isDisplayField(field));
  }

  selectKit(kit: UiKitPreference) {
    this.selectedKit = kit;
    this.presentation = { kit };
  }

  setValue(name: string, value: unknown) {
    this.model = {
      ...this.model,
      [name]: value
    };
  }

  isFull(field: RuntimeField) {
    if (typeof field.layout === 'string') {
      return field.layout === 'full';
    }
    return field.layout?.desktop === 'full' || field.layout?.tablet === 'full' || field.layout?.mobile === 'full';
  }

  private isDisplayField(field: RuntimeField) {
    return ['title', 'paragraph', 'divider'].includes(field.type.toLowerCase());
  }
}
