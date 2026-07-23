import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { SupportedLanguage } from '../i18n/i18n.translations';
import { UiPresentationService } from './ui-presentation.service';
import { UiKitId, UiPresentationProfile } from './ui-presentation.types';
import { UiThemeService } from './ui-theme.service';

const PREFERENCES_STORAGE_KEY = 'chicle.admin.preferences';

export type AdminThemeMode = 'system' | 'light' | 'dark';
export type AdminDensity = 'compact' | 'comfortable' | 'relaxed';
export type AdminFontFamily = 'system' | 'inter' | 'serif' | 'mono';
export type AdminLanguage = SupportedLanguage;

export interface AdminUiPreferences {
  themeKey: string;
  mode: AdminThemeMode;
  kit: UiKitId;
  fontFamily: AdminFontFamily;
  fontScale: number;
  density: AdminDensity;
  language: AdminLanguage;
}

export const DEFAULT_ADMIN_UI_PREFERENCES: AdminUiPreferences = {
  themeKey: 'chicle',
  mode: 'system',
  kit: 'primeng',
  fontFamily: 'system',
  fontScale: 1,
  density: 'comfortable',
  language: 'es'
};

const FONT_FAMILIES: Record<AdminFontFamily, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  inter:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono:
    '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
};

const DENSITY_VARS: Record<AdminDensity, Record<string, string>> = {
  compact: {
    '--ch-page-gap': '12px',
    '--ch-page-padding-top': '18px',
    '--ch-control-height': '38px'
  },
  comfortable: {
    '--ch-page-gap': '18px',
    '--ch-page-padding-top': '24px',
    '--ch-control-height': '44px'
  },
  relaxed: {
    '--ch-page-gap': '24px',
    '--ch-page-padding-top': '30px',
    '--ch-control-height': '50px'
  }
};

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private readonly theme = inject(UiThemeService);
  private readonly presentation = inject(UiPresentationService);
  private readonly i18n = inject(I18nService);
  private readonly preferencesState = signal<AdminUiPreferences>(DEFAULT_ADMIN_UI_PREFERENCES);
  private initialized = false;
  private systemModeQuery?: MediaQueryList;

  readonly preferences = this.preferencesState.asReadonly();

  initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    const stored = this.readStored();
    this.watchSystemMode();
    void this.apply(stored, false);
  }

  async update(patch: Partial<AdminUiPreferences>) {
    await this.apply({ ...this.preferencesState(), ...patch }, true);
  }

  async reset() {
    await this.apply(DEFAULT_ADMIN_UI_PREFERENCES, true);
  }

  private async apply(value: AdminUiPreferences, persist: boolean) {
    const next = this.normalize(value);
    this.preferencesState.set(next);
    await this.theme.apply(next.themeKey, persist);
    this.applyMode(next);
    this.applyTypography(next);
    this.applyDensity(next);
    this.applyLanguage(next);
    this.applyPresentation(next);

    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    }
  }

  private readStored() {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_ADMIN_UI_PREFERENCES;
    }

    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ADMIN_UI_PREFERENCES;
    }

    try {
      return this.normalize(JSON.parse(raw) as Partial<AdminUiPreferences>);
    } catch {
      return DEFAULT_ADMIN_UI_PREFERENCES;
    }
  }

  private normalize(value: Partial<AdminUiPreferences>): AdminUiPreferences {
    const themeKey = this.theme.find(value.themeKey || DEFAULT_ADMIN_UI_PREFERENCES.themeKey).key;
    const mode = this.isMode(value.mode) ? value.mode : DEFAULT_ADMIN_UI_PREFERENCES.mode;
    const kit = this.isKit(value.kit) ? value.kit : DEFAULT_ADMIN_UI_PREFERENCES.kit;
    const fontFamily = this.isFontFamily(value.fontFamily)
      ? value.fontFamily
      : DEFAULT_ADMIN_UI_PREFERENCES.fontFamily;
    const density = this.isDensity(value.density) ? value.density : DEFAULT_ADMIN_UI_PREFERENCES.density;
    const language = this.isLanguage(value.language) ? value.language : DEFAULT_ADMIN_UI_PREFERENCES.language;
    const fontScale =
      typeof value.fontScale === 'number' && Number.isFinite(value.fontScale)
        ? Math.min(1.18, Math.max(0.9, value.fontScale))
        : DEFAULT_ADMIN_UI_PREFERENCES.fontScale;

    return { themeKey, mode, kit, fontFamily, fontScale, density, language };
  }

  private applyMode(preferences: AdminUiPreferences) {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const effectiveMode =
      preferences.mode === 'system' ? (this.prefersDark() ? 'dark' : 'light') : preferences.mode;
    root.dataset['uiMode'] = preferences.mode;
    root.dataset['uiEffectiveMode'] = effectiveMode;
    root.style.setProperty('color-scheme', effectiveMode);

    if (effectiveMode !== 'dark') {
      return;
    }

    root.style.setProperty('--ch-color-surface', '#111827');
    root.style.setProperty('--ch-color-surface-alt', '#0f172a');
    root.style.setProperty('--ch-color-surface-muted', '#1e293b');
    root.style.setProperty('--ch-color-background', '#0b1120');
    root.style.setProperty('--ch-color-text', '#e5edf7');
    root.style.setProperty('--ch-color-muted', '#a7b5c8');
    root.style.setProperty('--ch-color-border', '#263449');
    root.style.setProperty('--ch-color-primary-soft', 'color-mix(in srgb, var(--ch-color-primary) 18%, #0b1120)');
    root.style.setProperty('--ch-color-primary-border', 'color-mix(in srgb, var(--ch-color-primary) 44%, #263449)');
    root.style.setProperty('--ch-color-success', '#3ddc8c');
    root.style.setProperty('--ch-color-success-soft', 'color-mix(in srgb, #3ddc8c 16%, #0b1120)');
    root.style.setProperty('--ch-color-success-border', 'color-mix(in srgb, #3ddc8c 42%, #263449)');
    root.style.setProperty('--ch-color-warning', '#f5b84b');
    root.style.setProperty('--ch-color-warning-soft', 'color-mix(in srgb, #f5b84b 16%, #0b1120)');
    root.style.setProperty('--ch-color-warning-border', 'color-mix(in srgb, #f5b84b 42%, #263449)');
    root.style.setProperty('--ch-color-danger', '#ff827a');
    root.style.setProperty('--ch-color-danger-soft', 'color-mix(in srgb, #ff827a 16%, #0b1120)');
    root.style.setProperty('--ch-color-danger-border', 'color-mix(in srgb, #ff827a 42%, #263449)');
    root.style.setProperty('--ch-shadow-card', '0 18px 48px rgba(0, 0, 0, 0.34)');
    root.style.setProperty('--ion-background-color', '#0b1120');
    root.style.setProperty('--ion-text-color', '#e5edf7');
    root.style.setProperty('--ion-color-success', '#3ddc8c');
    root.style.setProperty('--ion-color-warning', '#f5b84b');
    root.style.setProperty('--ion-color-danger', '#ff827a');
  }

  private applyTypography(preferences: AdminUiPreferences) {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset['uiFont'] = preferences.fontFamily;
    root.style.setProperty('--ch-font-family', FONT_FAMILIES[preferences.fontFamily]);
    root.style.setProperty('--ch-font-scale', String(preferences.fontScale));
  }

  private applyDensity(preferences: AdminUiPreferences) {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.dataset['uiDensity'] = preferences.density;
    Object.entries(DENSITY_VARS[preferences.density]).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  private applyLanguage(preferences: AdminUiPreferences) {
    this.i18n.setLanguage(preferences.language);
  }

  private applyPresentation(preferences: AdminUiPreferences) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.dataset['uiKit'] = preferences.kit;
      root.dataset['uiTheme'] = preferences.themeKey;
    }

    const profile: UiPresentationProfile = {
      key: 'admin-preferences',
      theme: preferences.themeKey,
      defaultKit: preferences.kit,
      rules: [
        { kit: 'ionic', platforms: ['ios', 'android'] },
        { kit: preferences.kit, platforms: ['web'] }
      ]
    };
    this.presentation.setProfile(profile);
  }

  private watchSystemMode() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    this.systemModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemModeQuery.addEventListener('change', () => {
      const preferences = this.preferencesState();
      if (preferences.mode === 'system') {
        void this.apply(preferences, false);
      }
    });
  }

  private prefersDark() {
    return this.systemModeQuery?.matches ?? false;
  }

  private isMode(value: unknown): value is AdminThemeMode {
    return value === 'system' || value === 'light' || value === 'dark';
  }

  private isKit(value: unknown): value is UiKitId {
    return value === 'native' || value === 'primeng' || value === 'ionic' || value === 'material' || value === 'bootstrap';
  }

  private isFontFamily(value: unknown): value is AdminFontFamily {
    return value === 'system' || value === 'inter' || value === 'serif' || value === 'mono';
  }

  private isDensity(value: unknown): value is AdminDensity {
    return value === 'compact' || value === 'comfortable' || value === 'relaxed';
  }

  private isLanguage(value: unknown): value is AdminLanguage {
    return value === 'es' || value === 'en';
  }
}
