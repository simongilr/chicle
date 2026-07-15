import { Component, Input, inject } from '@angular/core';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { UiThemeService } from '../../core/ui/ui-theme.service';
import { DynamicFieldControlComponent } from '../dynamic-field-control/dynamic-field-control.component';
import { UiKitAwareComponent } from '../ui-kit/ui-kit-aware.component';

@Component({
  selector: 'app-ui-theme-selector',
  standalone: true,
  imports: [DynamicFieldControlComponent],
  host: {
    '[attr.data-ui-kit]': 'resolvedKit'
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
    `
  ],
  template: `
    <app-dynamic-field-control
      [field]="themeField"
      [value]="themes.activeThemeKey()"
      [help]="activeTheme.description"
      [presentation]="{ kit: resolvedKit }"
      (valueChange)="applyTheme($event)"
    ></app-dynamic-field-control>
  `
})
export class UiThemeSelectorComponent extends UiKitAwareComponent {
  readonly themes = inject(UiThemeService);

  @Input() label = 'Tema instalado';
  @Input() controlId = 'ui-theme';

  get themeField(): RuntimeField {
    return {
      name: this.controlId,
      type: 'select',
      label: this.label,
      placeholder: 'Selecciona una paleta',
      options: this.themes.themes.map((theme) => ({
        label: theme.label,
        value: theme.key
      }))
    };
  }

  get activeTheme() {
    return this.themes.find(this.themes.activeThemeKey());
  }

  applyTheme(value: unknown) {
    if (typeof value === 'string') {
      this.themes.apply(value);
    }
  }
}
