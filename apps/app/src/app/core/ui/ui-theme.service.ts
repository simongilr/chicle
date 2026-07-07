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

export const INSTALLED_UI_THEMES: UiThemeDefinition[] = [
  {
    key: 'chicle',
    label: 'Chicle / Aura',
    description: 'Tema operativo predeterminado de Chicle Engine.',
    loadPrimePreset: () => import('@primeuix/themes/aura').then((module) => module.default),
    primaryPalette: CHICLE_PRIMARY,
    tokens: {
      primary: '#1554a2',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      background: '#f4f7fb',
      text: '#173b5f',
      muted: '#52677a',
      border: '#d9e2ec',
      radius: '8px'
    }
  },
  {
    key: 'lara',
    label: 'Lara',
    description: 'Superficies ligeras y acento verde para interfaces densas.',
    loadPrimePreset: () => import('@primeuix/themes/lara').then((module) => module.default),
    primaryPalette: LARA_PRIMARY,
    tokens: {
      primary: '#047857',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      background: '#f4f8f6',
      text: '#17352d',
      muted: '#526c64',
      border: '#d4e2dd',
      radius: '6px'
    }
  },
  {
    key: 'material',
    label: 'Material',
    description: 'Geometría compacta y acento índigo.',
    loadPrimePreset: () => import('@primeuix/themes/material').then((module) => module.default),
    primaryPalette: MATERIAL_PRIMARY,
    tokens: {
      primary: '#3f51b5',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      background: '#f5f5f7',
      text: '#202124',
      muted: '#5f6368',
      border: '#dadce0',
      radius: '4px'
    }
  },
  {
    key: 'nora',
    label: 'Nora',
    description: 'Contraste sereno y acento teal para operación prolongada.',
    loadPrimePreset: () => import('@primeuix/themes/nora').then((module) => module.default),
    primaryPalette: NORA_PRIMARY,
    tokens: {
      primary: '#0f766e',
      primaryContrast: '#ffffff',
      surface: '#ffffff',
      background: '#f5f7fa',
      text: '#1f2937',
      muted: '#5c6673',
      border: '#d7dde5',
      radius: '8px'
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
      root.style.setProperty('--ch-color-background', theme.tokens.background);
      root.style.setProperty('--ch-color-text', theme.tokens.text);
      root.style.setProperty('--ch-color-muted', theme.tokens.muted);
      root.style.setProperty('--ch-color-border', theme.tokens.border);
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
