import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiThemeService } from '../../core/ui/ui-theme.service';
import { FieldShellComponent } from '../field-shell/field-shell.component';

@Component({
  selector: 'app-ui-theme-selector',
  standalone: true,
  imports: [FieldShellComponent, FormsModule],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .control {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
      }

      .swatch {
        width: 18px;
        height: 18px;
        border: 1px solid var(--ch-color-border);
        border-radius: 50%;
        background: var(--ch-color-primary);
      }

      select {
        width: 100%;
        min-height: 42px;
        border: 1px solid #b9c9d8;
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px 11px;
        font: inherit;
      }

      select:focus {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 16%, transparent);
        border-color: var(--ch-color-primary);
      }
    `
  ],
  template: `
    <app-field-shell [label]="label" [forId]="controlId" [help]="activeTheme.description">
      <div class="control">
        <span class="swatch" aria-hidden="true"></span>
        <select
          [id]="controlId"
          [ngModel]="themes.activeThemeKey()"
          (ngModelChange)="themes.apply($event)"
        >
          @for (theme of themes.themes; track theme.key) {
            <option [value]="theme.key">{{ theme.label }}</option>
          }
        </select>
      </div>
    </app-field-shell>
  `
})
export class UiThemeSelectorComponent {
  readonly themes = inject(UiThemeService);

  @Input() label = 'Tema instalado';
  @Input() controlId = 'ui-theme';

  get activeTheme() {
    return this.themes.find(this.themes.activeThemeKey());
  }
}

