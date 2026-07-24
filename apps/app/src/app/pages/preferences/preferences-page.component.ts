import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AdminFormGridComponent } from '../../shared/admin-form-grid/admin-form-grid.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
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
  imports: [
    AdminPanelComponent,
    AdminFormGridComponent,
    DynamicFieldControlComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    TranslatePipe,
    UiKitButtonComponent
  ],
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
    <app-page-shell [contextLabel]="'nav.preferences' | t">
      <app-module-header
        [eyebrow]="'preferences.eyebrow' | t"
        [title]="'preferences.title' | t"
        [description]="'preferences.description' | t"
        [badge]="'preferences.badge' | t"
        [kit]="preferences().kit"
      ></app-module-header>

      <section class="preferences-layout">
        <app-admin-panel
          [title]="'preferences.panel.title' | t"
          [description]="'preferences.panel.description' | t"
          [kit]="preferences().kit"
        >
          <app-admin-form-grid ariaLabel="Preferencias visuales" minColumnWidth="230px">
            <app-dynamic-field-control
              [field]="themeField"
              [value]="preferences().themeKey"
              [presentation]="activePresentation()"
              (valueChange)="setThemeKey($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="modeField"
              [value]="preferences().mode"
              [presentation]="activePresentation()"
              (valueChange)="setMode($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="kitField"
              [value]="preferences().kit"
              [presentation]="activePresentation()"
              (valueChange)="setKit($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="fontField"
              [value]="preferences().fontFamily"
              [presentation]="activePresentation()"
              (valueChange)="setFontFamily($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="fontScaleField"
              [value]="preferences().fontScale"
              [presentation]="activePresentation()"
              (valueChange)="setFontScale($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="densityField"
              [value]="preferences().density"
              [presentation]="activePresentation()"
              (valueChange)="setDensity($event)"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="languageField"
              [value]="preferences().language"
              [presentation]="activePresentation()"
              (valueChange)="setLanguage($event)"
            ></app-dynamic-field-control>
          </app-admin-form-grid>

          <div class="actions">
            <app-ui-kit-button
              [label]="'common.resetDefaults' | t"
              icon="pi pi-refresh"
              [kit]="preferences().kit"
              tone="neutral"
              variant="outline"
              (pressed)="reset()"
            ></app-ui-kit-button>
          </div>
        </app-admin-panel>

        <app-admin-panel
          [title]="'preferences.preview.title' | t"
          [description]="'preferences.preview.description' | t"
          gap="14px"
          [kit]="preferences().kit"
        >
          <div class="preview-toolbar">
            <span class="chip">{{ activeTheme().label }}</span>
            <span class="chip">{{ kitLabel(preferences().kit) }}</span>
            <span class="chip">{{ modeLabel(preferences().mode) }}</span>
            <span class="chip">{{ densityLabel(preferences().density) }}</span>
          </div>

          <div class="preview-card">
            <h3>{{ 'preferences.preview.formTitle' | t }}</h3>
            <app-dynamic-field-control
              [field]="previewNameField"
              value="admin@empresa.com"
              [presentation]="activePresentation()"
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="previewRoleField"
              value="owner"
              [presentation]="activePresentation()"
            ></app-dynamic-field-control>
            <app-ui-kit-button
              [label]="'preferences.preview.savePreference' | t"
              icon="pi pi-save"
              [kit]="preferences().kit"
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
        </app-admin-panel>
      </section>

      <app-admin-panel
        [title]="'preferences.roadmap.title' | t"
        [description]="'preferences.roadmap.description' | t"
        [kit]="preferences().kit"
      >
        <div class="roadmap">
          <div class="roadmap-item">
            <span>{{ 'preferences.roadmap.brand.title' | t }}</span>
            <p>{{ 'preferences.roadmap.brand.description' | t }}</p>
          </div>
          <div class="roadmap-item">
            <span>{{ 'preferences.roadmap.navigation.title' | t }}</span>
            <p>{{ 'preferences.roadmap.navigation.description' | t }}</p>
          </div>
          <div class="roadmap-item">
            <span>{{ 'preferences.roadmap.formats.title' | t }}</span>
            <p>{{ 'preferences.roadmap.formats.description' | t }}</p>
          </div>
          <div class="roadmap-item">
            <span>{{ 'preferences.roadmap.accessibility.title' | t }}</span>
            <p>{{ 'preferences.roadmap.accessibility.description' | t }}</p>
          </div>
        </div>
      </app-admin-panel>
    </app-page-shell>
  `
})
export class PreferencesPageComponent {
  private readonly preferencesService = inject(UiPreferencesService);
  private readonly themeService = inject(UiThemeService);
  private readonly i18n = inject(I18nService);

  readonly preferences = this.preferencesService.preferences;
  readonly activeTheme = computed(() => this.themeService.find(this.preferences().themeKey));
  readonly activePresentation = computed(() => ({ kit: this.preferences().kit }));

  get themeField(): RuntimeField {
    return {
      name: 'themeKey',
      type: 'select',
      label: this.i18n.translate('preferences.fields.theme'),
      options: this.themeService.themes.map((theme) => ({
        label: theme.label,
        value: theme.key
      }))
    };
  }

  get modeField(): RuntimeField {
    return {
      name: 'mode',
      type: 'select',
      label: this.i18n.translate('preferences.fields.mode'),
      options: [
        { label: this.i18n.translate('common.system'), value: 'system' },
        { label: this.i18n.translate('common.light'), value: 'light' },
        { label: this.i18n.translate('common.dark'), value: 'dark' }
      ]
    };
  }

  get kitField(): RuntimeField {
    return {
      name: 'kit',
      type: 'select',
      label: this.i18n.translate('preferences.fields.kit'),
      options: [
        { label: this.i18n.translate('preferences.kit.primeng'), value: 'primeng' },
        { label: this.i18n.translate('preferences.kit.ionic'), value: 'ionic' },
        { label: this.i18n.translate('preferences.kit.material'), value: 'material' },
        { label: this.i18n.translate('preferences.kit.bootstrap'), value: 'bootstrap' },
        { label: this.i18n.translate('preferences.kit.native'), value: 'native' }
      ]
    };
  }

  get fontField(): RuntimeField {
    return {
      name: 'fontFamily',
      type: 'select',
      label: this.i18n.translate('preferences.fields.font'),
      options: [
        { label: this.i18n.translate('preferences.font.system'), value: 'system' },
        { label: this.i18n.translate('preferences.font.inter'), value: 'inter' },
        { label: this.i18n.translate('preferences.font.serif'), value: 'serif' },
        { label: this.i18n.translate('preferences.font.mono'), value: 'mono' }
      ]
    };
  }

  get fontScaleField(): RuntimeField {
    return {
      name: 'fontScale',
      type: 'select',
      label: this.i18n.translate('preferences.fields.fontScale'),
      options: [
        { label: this.i18n.translate('preferences.fontScale.small'), value: 0.94 },
        { label: this.i18n.translate('preferences.fontScale.normal'), value: 1 },
        { label: this.i18n.translate('preferences.fontScale.large'), value: 1.08 },
        { label: this.i18n.translate('preferences.fontScale.xlarge'), value: 1.16 }
      ]
    };
  }

  get densityField(): RuntimeField {
    return {
      name: 'density',
      type: 'select',
      label: this.i18n.translate('preferences.fields.density'),
      options: [
        { label: this.i18n.translate('common.compact'), value: 'compact' },
        { label: this.i18n.translate('common.comfortable'), value: 'comfortable' },
        { label: this.i18n.translate('common.relaxed'), value: 'relaxed' }
      ]
    };
  }

  get languageField(): RuntimeField {
    return {
      name: 'language',
      type: 'select',
      label: this.i18n.translate('preferences.fields.language'),
      options: [
        { label: this.i18n.translate('common.spanish'), value: 'es' },
        { label: this.i18n.translate('common.english'), value: 'en' }
      ]
    };
  }

  get previewNameField(): RuntimeField {
    return {
      name: 'previewEmail',
      type: 'email',
      label: this.i18n.translate('preferences.preview.emailLabel'),
      placeholder: this.i18n.translate('preferences.preview.emailPlaceholder')
    };
  }

  get previewRoleField(): RuntimeField {
    return {
      name: 'previewRole',
      type: 'select',
      label: this.i18n.translate('common.role'),
      options: [
        { label: this.i18n.translate('common.owner'), value: 'owner' },
        { label: this.i18n.translate('common.admin'), value: 'admin' },
        { label: this.i18n.translate('common.operator'), value: 'operator' }
      ]
    };
  }

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
      primeng: this.i18n.translate('preferences.kit.primeng'),
      ionic: this.i18n.translate('preferences.kit.ionic'),
      material: this.i18n.translate('preferences.kit.material'),
      bootstrap: this.i18n.translate('preferences.kit.bootstrap'),
      native: this.i18n.translate('preferences.kit.native')
    }[value];
  }

  modeLabel(value: AdminThemeMode) {
    return {
      system: this.i18n.translate('preferences.mode.system'),
      light: this.i18n.translate('preferences.mode.light'),
      dark: this.i18n.translate('preferences.mode.dark')
    }[value];
  }

  densityLabel(value: AdminDensity) {
    return {
      compact: this.i18n.translate('common.compact'),
      comfortable: this.i18n.translate('common.comfortable'),
      relaxed: this.i18n.translate('common.relaxed')
    }[value];
  }
}
