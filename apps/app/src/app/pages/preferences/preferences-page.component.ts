import { Component, computed, inject } from '@angular/core';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import {
  AdminDensity,
  AdminFontFamily,
  AdminLanguage,
  AdminThemeMode,
  AdminUiPreferences,
  UiPreferencesService
} from '../../core/ui/ui-preferences.service';
import { UiKitId } from '../../core/ui/ui-presentation.types';
import { UiThemeService } from '../../core/ui/ui-theme.service';

@Component({
  selector: 'app-preferences-page',
  standalone: true,
  imports: [DynamicFieldControlComponent, ModuleHeaderComponent, PageShellComponent, UiKitButtonComponent],
  styles: [
    `
      :host {
        display: block;
      }

      .preferences-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
        gap: var(--ch-page-gap);
        align-items: start;
      }

      .panel {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        box-shadow: var(--ch-shadow-card);
        padding: 18px;
        min-width: 0;
      }

      .panel-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }

      .panel-title {
        display: grid;
        gap: 4px;
      }

      h2,
      h3,
      p {
        margin: 0;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.15rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 0.98rem;
      }

      p {
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .field-grid app-dynamic-field-control:nth-child(1),
      .field-grid app-dynamic-field-control:nth-child(2) {
        grid-column: span 1;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .preview-panel {
        display: grid;
        gap: 14px;
      }

      .preview-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 3px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .preview-card {
        display: grid;
        gap: 12px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .swatches {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
      }

      .swatch {
        min-height: 44px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
      }

      .roadmap {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .roadmap-item {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .roadmap-item span {
        display: block;
        margin-bottom: 5px;
        color: var(--ch-color-text);
        font-weight: 850;
      }

      @media (max-width: 980px) {
        .preferences-layout,
        .roadmap {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 680px) {
        .field-grid {
          grid-template-columns: 1fr;
        }

        .actions {
          justify-content: stretch;
        }

        .actions app-ui-kit-button {
          flex: 1 1 auto;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Preferencias">
      <app-module-header
        eyebrow="Administración visual"
        title="Preferencias del admin"
        description="Personaliza cómo se ve y se siente el panel administrativo: paleta, modo, kit visual, tamaño de letra, densidad e idioma base."
        badge="Admin UI"
      ></app-module-header>

      <section class="preferences-layout">
        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">
              <h2>Apariencia y experiencia</h2>
              <p>Los cambios se aplican en vivo y quedan guardados en este navegador.</p>
            </div>
          </div>

          <div class="field-grid">
            <app-dynamic-field-control
              [field]="themeField"
              [value]="preferences().themeKey"
              (valueChange)="setThemeKey($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="modeField"
              [value]="preferences().mode"
              (valueChange)="setMode($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="kitField"
              [value]="preferences().kit"
              (valueChange)="setKit($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="fontField"
              [value]="preferences().fontFamily"
              (valueChange)="setFontFamily($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="fontScaleField"
              [value]="preferences().fontScale"
              (valueChange)="setFontScale($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="densityField"
              [value]="preferences().density"
              (valueChange)="setDensity($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="languageField"
              [value]="preferences().language"
              (valueChange)="setLanguage($event)"
            ></app-dynamic-field-control>
          </div>

          <div class="actions">
            <app-ui-kit-button
              label="Restaurar default"
              icon="pi pi-refresh"
              tone="neutral"
              variant="outline"
              (pressed)="reset()"
            ></app-ui-kit-button>
          </div>
        </section>

        <section class="panel preview-panel">
          <div class="panel-title">
            <h2>Vista rápida</h2>
            <p>Referencia de cómo se comportan controles, botones y colores con la configuración activa.</p>
          </div>

          <div class="preview-toolbar">
            <span class="chip">{{ activeTheme().label }}</span>
            <span class="chip">{{ kitLabel(preferences().kit) }}</span>
            <span class="chip">{{ modeLabel(preferences().mode) }}</span>
            <span class="chip">{{ densityLabel(preferences().density) }}</span>
          </div>

          <div class="preview-card">
            <h3>Formulario de muestra</h3>
            <app-dynamic-field-control
              [field]="previewNameField"
              value="admin@empresa.com"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="previewRoleField"
              value="owner"
            ></app-dynamic-field-control>
            <app-ui-kit-button
              label="Guardar preferencia"
              icon="pi pi-save"
              tone="primary"
              [full]="true"
            ></app-ui-kit-button>
          </div>

          <div class="swatches" aria-label="Paleta activa">
            <span class="swatch" [style.background]="activeTheme().tokens.primary"></span>
            <span class="swatch" [style.background]="activeTheme().tokens.primarySoft"></span>
            <span class="swatch" [style.background]="activeTheme().tokens.success"></span>
            <span class="swatch" [style.background]="activeTheme().tokens.warning"></span>
            <span class="swatch" [style.background]="activeTheme().tokens.danger"></span>
          </div>
        </section>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>Próximas preferencias</h2>
            <p>Este panel queda listo para crecer sin mezclar preferencias visuales con lógica de negocio.</p>
          </div>
        </div>
        <div class="roadmap">
          <div class="roadmap-item">
            <span>Marca</span>
            <p>Logo, favicon, nombre visible del producto y textos del header.</p>
          </div>
          <div class="roadmap-item">
            <span>Navegación</span>
            <p>Menú compacto, grupos favoritos, orden visual y comportamiento responsive.</p>
          </div>
          <div class="roadmap-item">
            <span>Formatos</span>
            <p>Zona horaria, moneda, fechas, números y formatos regionales por tenant.</p>
          </div>
          <div class="roadmap-item">
            <span>Accesibilidad</span>
            <p>Contraste alto, reducción de movimiento, escala extra grande y lectura cómoda.</p>
          </div>
        </div>
      </section>
    </app-page-shell>
  `
})
export class PreferencesPageComponent {
  private readonly preferencesService = inject(UiPreferencesService);
  private readonly themeService = inject(UiThemeService);

  readonly preferences = this.preferencesService.preferences;
  readonly activeTheme = computed(() => this.themeService.find(this.preferences().themeKey));

  readonly themeField: RuntimeField = {
    name: 'themeKey',
    type: 'select',
    label: 'Colores / tema',
    options: this.themeService.themes.map((theme) => ({
      label: theme.label,
      value: theme.key
    }))
  };
  readonly modeField: RuntimeField = {
    name: 'mode',
    type: 'select',
    label: 'Modo',
    options: [
      { label: 'Sistema', value: 'system' },
      { label: 'Claro', value: 'light' },
      { label: 'Oscuro', value: 'dark' }
    ]
  };
  readonly kitField: RuntimeField = {
    name: 'kit',
    type: 'select',
    label: 'Kit visual',
    options: [
      { label: 'PrimeNG', value: 'primeng' },
      { label: 'Ionic', value: 'ionic' },
      { label: 'Material', value: 'material' },
      { label: 'Bootstrap', value: 'bootstrap' },
      { label: 'Base HTML', value: 'native' }
    ]
  };
  readonly fontField: RuntimeField = {
    name: 'fontFamily',
    type: 'select',
    label: 'Letra',
    options: [
      { label: 'Sistema', value: 'system' },
      { label: 'Inter / UI moderna', value: 'inter' },
      { label: 'Serif editorial', value: 'serif' },
      { label: 'Mono técnica', value: 'mono' }
    ]
  };
  readonly fontScaleField: RuntimeField = {
    name: 'fontScale',
    type: 'select',
    label: 'Tamaño de letra',
    options: [
      { label: 'Pequeña', value: 0.94 },
      { label: 'Normal', value: 1 },
      { label: 'Grande', value: 1.08 },
      { label: 'Extra grande', value: 1.16 }
    ]
  };
  readonly densityField: RuntimeField = {
    name: 'density',
    type: 'select',
    label: 'Densidad',
    options: [
      { label: 'Compacta', value: 'compact' },
      { label: 'Cómoda', value: 'comfortable' },
      { label: 'Amplia', value: 'relaxed' }
    ]
  };
  readonly languageField: RuntimeField = {
    name: 'language',
    type: 'select',
    label: 'Idioma',
    options: [
      { label: 'Español', value: 'es' },
      { label: 'English', value: 'en' },
      { label: 'Português', value: 'pt' }
    ]
  };
  readonly previewNameField: RuntimeField = {
    name: 'previewEmail',
    type: 'email',
    label: 'Correo de prueba',
    placeholder: 'admin@empresa.com'
  };
  readonly previewRoleField: RuntimeField = {
    name: 'previewRole',
    type: 'select',
    label: 'Rol',
    options: [
      { label: 'Owner', value: 'owner' },
      { label: 'Admin', value: 'admin' },
      { label: 'Operador', value: 'operator' }
    ]
  };

  setThemeKey(value: unknown) {
    void this.preferencesService.update({ themeKey: String(value) });
  }

  setMode(value: unknown) {
    void this.preferencesService.update({ mode: String(value) as AdminThemeMode });
  }

  setKit(value: unknown) {
    void this.preferencesService.update({ kit: String(value) as UiKitId });
  }

  setFontFamily(value: unknown) {
    void this.preferencesService.update({ fontFamily: String(value) as AdminFontFamily });
  }

  setFontScale(value: unknown) {
    void this.preferencesService.update({ fontScale: Number(value) });
  }

  setDensity(value: unknown) {
    void this.preferencesService.update({ density: String(value) as AdminDensity });
  }

  setLanguage(value: unknown) {
    void this.preferencesService.update({ language: String(value) as AdminLanguage });
  }

  reset() {
    void this.preferencesService.reset();
  }

  kitLabel(value: UiKitId) {
    return {
      primeng: 'PrimeNG',
      ionic: 'Ionic',
      material: 'Material',
      bootstrap: 'Bootstrap',
      native: 'Base HTML'
    }[value];
  }

  modeLabel(value: AdminThemeMode) {
    return {
      system: 'Modo sistema',
      light: 'Modo claro',
      dark: 'Modo oscuro'
    }[value];
  }

  densityLabel(value: AdminDensity) {
    return {
      compact: 'Compacta',
      comfortable: 'Cómoda',
      relaxed: 'Amplia'
    }[value];
  }
}
