/**
 * Lightweight i18n implementation
 * Supports: English (en), Brazilian Portuguese (pt-BR), Spanish (es)
 */

import type { Locale } from '../models/types';
import { countryToLanguage } from './country-to-language';
import { api } from './api';

type Translations = Record<string, string | Record<string, unknown>>;

class I18n {
  private locale: Locale = 'pt-BR';
  private translations: Translations = {};
  private listeners: Set<() => void> = new Set();

  async init(): Promise<void> {
    // Detection priority:
    // 1. localStorage (user preference) - highest priority
    // 2. Location-based (CF-IPCountry) - new
    // 3. Browser language - existing
    // 4. Default (pt-BR) - fallback

    const saved = localStorage.getItem('app_language') as Locale;
    if (saved && ['en', 'pt-BR', 'es'].includes(saved)) {
      // User has explicitly set a preference, use it
      this.locale = saved;
    } else {
      // No saved preference, detect language
      const detected = await this.detectLanguage();
      this.locale = detected;
    }

    await this.load(this.locale);
  }

  async load(locale: Locale): Promise<void> {
    this.locale = locale;

    try {
      // Load all translation files for this locale
      const [common, onboarding, profile, services, directory, viral, errors, payments] =
        await Promise.all([
          import(`../locales/${locale}/common.json`),
          import(`../locales/${locale}/onboarding.json`),
          import(`../locales/${locale}/profile.json`),
          import(`../locales/${locale}/services.json`),
          import(`../locales/${locale}/directory.json`),
          import(`../locales/${locale}/viral.json`),
          import(`../locales/${locale}/errors.json`),
          import(`../locales/${locale}/payments.json`),
        ]);

      this.translations = {
        ...common.default,
        onboarding: onboarding.default,
        profile: profile.default,
        services: services.default,
        directory: directory.default,
        viral: viral.default,
        errors: errors.default,
        payments: payments.default,
      };

      localStorage.setItem('app_language', locale);
      this.notifyListeners();
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error);
      // Fallback to pt-BR if loading fails
      if (locale !== 'pt-BR') {
        await this.load('pt-BR');
      }
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    const value = this.getNestedValue(this.translations, key);
    if (typeof value !== 'string') {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    return this.interpolate(value, params);
  }

  private getNestedValue(obj: Translations, path: string): string | Record<string, unknown> | undefined {
    return path.split('.').reduce<Translations[string] | undefined>((o, p) => {
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        return (o as Record<string, unknown>)[p] as Translations[string] | undefined;
      }
      return undefined;
    }, obj);
  }

  private interpolate(str: string, params?: Record<string, string | number>): string {
    if (!params) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key]?.toString() || '';
    });
  }

  getLocale(): Locale {
    return this.locale;
  }

  async setLocale(locale: Locale): Promise<void> {
    await this.load(locale);
  }

  /**
   * Detect language based on location and browser settings
   * Priority: Location (country) → Browser language → Default (pt-BR)
   */
  async detectLanguage(): Promise<Locale> {
    try {
      // Try location-based detection first
      const location = await api.detectLocation();
      const locationBasedLang = countryToLanguage(location.country);
      if (locationBasedLang) {
        return locationBasedLang;
      }
    } catch (error) {
      // If location detection fails, fall back to browser language
      console.warn('Location detection failed, falling back to browser language:', error);
    }

    // Fall back to browser language detection
    return this.detectBrowserLanguage();
  }

  /**
   * Detect language from browser settings
   */
  private detectBrowserLanguage(): Locale {
    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('en')) return 'en';
    return 'pt-BR'; // Default fallback
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb());
  }
}

export const i18n = new I18n();

