import { useEffect, useState } from 'preact/hooks';
import { i18n } from '../lib/i18n';
import type { Locale } from '../models/types';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(i18n.getLocale());

  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLocaleState(i18n.getLocale());
    });
    return unsubscribe;
  }, []);

  return {
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    locale,
    setLocale: async (newLocale: Locale) => {
      await i18n.setLocale(newLocale);
      setLocaleState(newLocale);
    },
  };
}

