import { Injectable, computed, signal } from '@angular/core';
import { I18N_TRANSLATIONS, SupportedLanguage } from './i18n.translations';

const LANGUAGE_STORAGE_KEY = 'chicle.admin.language';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageState = signal<SupportedLanguage>('es');

  readonly language = this.languageState.asReadonly();
  readonly dictionary = computed(() => I18N_TRANSLATIONS[this.language()]);

  initialize() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    this.setLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  }

  setLanguage(language: unknown) {
    const next = this.normalizeLanguage(language);
    this.languageState.set(next);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
  }

  translate(key: string, params?: Record<string, string | number>) {
    const template = this.dictionary()[key] ?? I18N_TRANSLATIONS.es[key] ?? key;
    return this.interpolate(template, params);
  }

  label(key: string, fallback: string) {
    const translated = this.dictionary()[key] ?? I18N_TRANSLATIONS.es[key];
    return translated || fallback;
  }

  normalizeLanguage(language: unknown): SupportedLanguage {
    return language === 'en' ? 'en' : 'es';
  }

  private interpolate(template: string, params?: Record<string, string | number>) {
    if (!params) {
      return template;
    }

    return Object.entries(params).reduce(
      (value, [key, replacement]) => value.replaceAll(`{{${key}}}`, String(replacement)),
      template
    );
  }
}
