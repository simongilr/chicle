import { Injectable, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { UiThemeDefinition } from './ui-theme.types';

const THEME_STORAGE_KEY = 'chicle.ui.theme';

const CHICLE_PRIMARY = {
  50: '#eef6ff',
  100: '#d9eaff',
  200: '#bcd9ff',
  300: '#8fc0ff',
  400: '#5b9cf5',
  500: '#1554a2',
  600: '#12498e',
  700: '#163f76',
  800: '#173961',
  900: '#17324f',
  950: '#10223b'
};
const LARA_PRIMARY = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#047857',
  600: '#036c4e',
  700: '#065f46',
  800: '#06513d',
  900: '#064e3b',
  950: '#022c22'
};
const MATERIAL_PRIMARY = {
  50: '#eef0ff',
  100: '#dfe3ff',
  200: '#c5ccff',
  300: '#a2adff',
  400: '#7c88f4',
  500: '#3f51b5',
  600: '#3546a3',
  700: '#2f3e91',
  800: '#293678',
  900: '#252f61',
  950: '#171b38'
};
const NORA_PRIMARY = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#0f766e',
  600: '#0d6b64',
  700: '#0f5f59',
  800: '#11504c',
  900: '#134e4a',
  950: '#042f2e'
};
const BOOTSTRAP_PRIMARY = {
  50: '#eef5ff',
  100: '#d9e9ff',
  200: '#b9d6ff',
  300: '#8dbbff',
  400: '#5d9bfa',
  500: '#0d6efd',
  600: '#0b5ed7',
  700: '#0a58ca',
  800: '#084298',
  900: '#052c65',
  950: '#031633'
};

export const INSTALLED_UI_THEMES: UiThemeDefinition[] = [
  {
    key: 'chicle',
    label: 'Azul Chicle',
    description: 'Paleta azul operativa predeterminada de Chicle Engine.',
    loadPrimePreset: () => import('@primeuix/themes/aura').then((module) => module.default),
    primaryPalette: CHICLE_PRIMARY,
    tokens: {
      primary: '#1554a2',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#f8fbfe',
      surfaceMuted: '#eef6ff',
      background: '#f4f7fb',
      text: '#173b5f',
      muted: '#52677a',
      border: '#d9e2ec',
      primarySoft: '#eaf3fc',
      primaryBorder: '#b7cce2',
      success: '#238152',
      successSoft: '#f2faf5',
      successBorder: '#9fd2b0',
      warning: '#b87515',
      warningSoft: '#fff9ef',
      warningBorder: '#e6bd7d',
      danger: '#b42318',
      dangerSoft: '#fff6f6',
      dangerBorder: '#f1b4b4',
      shadow: '0 16px 42px rgba(20, 50, 80, 0.06)',
      radius: '8px'
    }
  },
  {
    key: 'lara',
    label: 'Verde Operativo',
    description: 'Paleta verde para estados productivos, listas densas y operación diaria.',
    loadPrimePreset: () => import('@primeuix/themes/lara').then((module) => module.default),
    primaryPalette: LARA_PRIMARY,
    tokens: {
      primary: '#047857',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#f7fbf8',
      surfaceMuted: '#ecfdf5',
      background: '#f4f8f6',
      text: '#17352d',
      muted: '#526c64',
      border: '#d4e2dd',
      primarySoft: '#e7f7f0',
      primaryBorder: '#9fd8c4',
      success: '#047857',
      successSoft: '#ecfdf5',
      successBorder: '#9fd8c4',
      warning: '#a16207',
      warningSoft: '#fffbeb',
      warningBorder: '#f3cf7a',
      danger: '#b42318',
      dangerSoft: '#fff1f2',
      dangerBorder: '#f3b4b8',
      shadow: '0 14px 36px rgba(22, 65, 48, 0.08)',
      radius: '6px'
    }
  },
  {
    key: 'material',
    label: 'Índigo Profesional',
    description: 'Paleta índigo sobria para experiencias administrativas y formularios.',
    loadPrimePreset: () => import('@primeuix/themes/material').then((module) => module.default),
    primaryPalette: MATERIAL_PRIMARY,
    tokens: {
      primary: '#3f51b5',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#f8f9fa',
      surfaceMuted: '#eef0ff',
      background: '#f5f5f7',
      text: '#202124',
      muted: '#5f6368',
      border: '#dadce0',
      primarySoft: '#eef0ff',
      primaryBorder: '#b9c1f2',
      success: '#188038',
      successSoft: '#e6f4ea',
      successBorder: '#a8dab5',
      warning: '#b06000',
      warningSoft: '#fef7e0',
      warningBorder: '#f3cf7a',
      danger: '#d93025',
      dangerSoft: '#fce8e6',
      dangerBorder: '#f4b4ad',
      shadow: '0 2px 8px rgba(60, 64, 67, 0.18)',
      radius: '4px'
    }
  },
  {
    key: 'nora',
    label: 'Teal Sereno',
    description: 'Paleta teal de bajo ruido visual para jornadas largas de trabajo.',
    loadPrimePreset: () => import('@primeuix/themes/nora').then((module) => module.default),
    primaryPalette: NORA_PRIMARY,
    tokens: {
      primary: '#0f766e',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      surfaceMuted: '#ecfdfa',
      background: '#f5f7fa',
      text: '#1f2937',
      muted: '#5c6673',
      border: '#d7dde5',
      primarySoft: '#e6fffb',
      primaryBorder: '#9edbd4',
      success: '#0f766e',
      successSoft: '#ecfdf5',
      successBorder: '#9edbd4',
      warning: '#b45309',
      warningSoft: '#fff7ed',
      warningBorder: '#f3c178',
      danger: '#b91c1c',
      dangerSoft: '#fef2f2',
      dangerBorder: '#f0aaaa',
      shadow: '0 14px 34px rgba(31, 41, 55, 0.08)',
      radius: '8px'
    }
  },
  {
    key: 'bootstrap',
    label: 'Azul Clásico',
    description: 'Paleta azul familiar para backoffices compactos y lectura rápida.',
    loadPrimePreset: () => import('@primeuix/themes/aura').then((module) => module.default),
    primaryPalette: BOOTSTRAP_PRIMARY,
    tokens: {
      primary: '#0d6efd',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#f8f9fa',
      surfaceMuted: '#e9ecef',
      background: '#f8f9fa',
      text: '#212529',
      muted: '#6c757d',
      border: '#dee2e6',
      primarySoft: '#e7f1ff',
      primaryBorder: '#9ec5fe',
      success: '#198754',
      successSoft: '#d1e7dd',
      successBorder: '#a3cfbb',
      warning: '#fd7e14',
      warningSoft: '#fff3cd',
      warningBorder: '#ffda6a',
      danger: '#dc3545',
      dangerSoft: '#f8d7da',
      dangerBorder: '#f1aeb5',
      shadow: '0 .5rem 1rem rgba(0, 0, 0, .08)',
      radius: '6px'
    }
  }
];

@Injectable({ providedIn: 'root' })
export class UiThemeService {
  private readonly prime = inject(PrimeNG);
  private readonly activeThemeKeyState = signal('chicle');

  readonly themes = INSTALLED_UI_THEMES;
  readonly activeThemeKey = this.activeThemeKeyState.asReadonly();

  initialize() {
    const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY);
    this.apply(stored || 'chicle', false);
  }

  async apply(themeKey: string, persist = true) {
    const theme = this.find(themeKey);
    this.activeThemeKeyState.set(theme.key);

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.dataset['uiTheme'] = theme.key;
      root.style.setProperty('--ch-color-primary', theme.tokens.primary);
      root.style.setProperty('--ch-color-primary-contrast', theme.tokens.primaryContrast);
      root.style.setProperty('--ch-color-surface', theme.tokens.surface);
      root.style.setProperty('--ch-color-surface-alt', theme.tokens.surfaceAlt || theme.tokens.surface);
      root.style.setProperty('--ch-color-surface-muted', theme.tokens.surfaceMuted || theme.tokens.background);
      root.style.setProperty('--ch-color-background', theme.tokens.background);
      root.style.setProperty('--ch-color-text', theme.tokens.text);
      root.style.setProperty('--ch-color-muted', theme.tokens.muted);
      root.style.setProperty('--ch-color-border', theme.tokens.border);
      root.style.setProperty('--ch-color-primary-soft', theme.tokens.primarySoft || theme.tokens.background);
      root.style.setProperty('--ch-color-primary-border', theme.tokens.primaryBorder || theme.tokens.border);
      root.style.setProperty('--ch-color-success', theme.tokens.success || '#238152');
      root.style.setProperty('--ch-color-success-soft', theme.tokens.successSoft || theme.tokens.background);
      root.style.setProperty('--ch-color-success-border', theme.tokens.successBorder || theme.tokens.border);
      root.style.setProperty('--ch-color-warning', theme.tokens.warning || '#b87515');
      root.style.setProperty('--ch-color-warning-soft', theme.tokens.warningSoft || theme.tokens.background);
      root.style.setProperty('--ch-color-warning-border', theme.tokens.warningBorder || theme.tokens.border);
      root.style.setProperty('--ch-color-danger', theme.tokens.danger || '#b42318');
      root.style.setProperty('--ch-color-danger-soft', theme.tokens.dangerSoft || theme.tokens.background);
      root.style.setProperty('--ch-color-danger-border', theme.tokens.dangerBorder || theme.tokens.border);
      root.style.setProperty('--ch-shadow-card', theme.tokens.shadow || '0 16px 42px rgba(20, 50, 80, 0.06)');
      root.style.setProperty('--ch-radius', theme.tokens.radius);
      root.style.setProperty('--ion-color-primary', theme.tokens.primary);
      root.style.setProperty('--ion-color-primary-contrast', theme.tokens.primaryContrast);
      root.style.setProperty('--ion-background-color', theme.tokens.background);
      root.style.setProperty('--ion-text-color', theme.tokens.text);
      Object.entries(theme.primaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--p-primary-${shade}`, color);
      });
      root.style.setProperty('--p-primary-color', theme.primaryPalette[500]);
      root.style.setProperty('--p-primary-contrast-color', theme.tokens.primaryContrast);
      root.style.setProperty('--p-primary-hover-color', theme.primaryPalette[600]);
      root.style.setProperty('--p-primary-active-color', theme.primaryPalette[700]);
    }

    const preset = await theme.loadPrimePreset();
    this.prime.setThemeConfig({
      theme: {
        preset
      }
    });

    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme.key);
    }

    return theme;
  }

  find(themeKey: string) {
    return this.themes.find((theme) => theme.key === themeKey) ?? this.themes[0];
  }
}
