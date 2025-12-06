import { describe, it, expect, beforeEach, vi } from 'vitest';
import { i18n } from '../i18n';

describe('i18n', () => {
  beforeEach(async () => {
    // Reset i18n state
    localStorage.clear();
    await i18n.init();
  });

  it('should detect language from browser', async () => {
    const detected = await i18n.detectLanguage();
    expect(['en', 'pt-BR', 'es']).toContain(detected);
  });

  it('should load pt-BR translations', async () => {
    await i18n.load('pt-BR');
    expect(i18n.getLocale()).toBe('pt-BR');
    // Test a known translation key
    const translation = i18n.t('buttons.save');
    expect(translation).toBeTruthy();
    expect(translation).not.toBe('buttons.save'); // Should be translated
  });

  it('should load en translations', async () => {
    await i18n.load('en');
    expect(i18n.getLocale()).toBe('en');
    const translation = i18n.t('buttons.save');
    expect(translation).toBe('Save');
  });

  it('should load es translations', async () => {
    await i18n.load('es');
    expect(i18n.getLocale()).toBe('es');
    const translation = i18n.t('buttons.save');
    expect(translation).toBe('Guardar');
  });

  it('should interpolate parameters', async () => {
    await i18n.load('pt-BR');
    const translation = i18n.t('viral.people_recommended', { count: 5 });
    expect(translation).toContain('5');
  });

  it('should notify listeners on locale change', async () => {
    const listener = vi.fn();
    i18n.subscribe(listener);

    await i18n.load('en');
    expect(listener).toHaveBeenCalled();
  });

  it('should return key if translation missing', async () => {
    await i18n.load('pt-BR');
    const translation = i18n.t('nonexistent.key');
    expect(translation).toBe('nonexistent.key');
  });
});

