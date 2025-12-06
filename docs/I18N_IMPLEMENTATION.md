# 🌍 Internationalization (i18n) Implementation Guide

## Overview

The amei.beauty app must support **3 languages** from day one:
1. **English (en)** - For development and international users
2. **Brazilian Portuguese (pt-BR)** - Default for Brazilian market
3. **Spanish (es)** - For LATAM expansion

**Key Principle**: Brazilian-first (pt-BR default), but fully internationalized.

---

## Language Detection & Selection

### Auto-Detection Strategy

```typescript
function detectLanguage(): string {
  // 1. Check localStorage (user preference)
  const saved = localStorage.getItem('app_language');
  if (saved && ['en', 'pt-BR', 'es'].includes(saved)) {
    return saved;
  }
  
  // 2. Check browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('en')) return 'en';
  
  // 3. Geolocation-based (optional, requires permission)
  // Brazil → pt-BR, Spanish-speaking countries → es, else → en
  
  // 4. Default fallback
  return 'pt-BR'; // Brazilian-first
}
```

### Language Selector UI

**Placement**: Header or settings menu

**Design**:
```
┌─────────────────────────┐
│  🌍 Idioma / Language   │
│  ─────────────────────  │
│  🇧🇷 Português (BR)     │
│  🇺🇸 English            │
│  🇪🇸 Español            │
└─────────────────────────┘
```

**Behavior**:
- Instant language change (no page reload)
- Save preference to localStorage
- Update all UI immediately
- Show current language with checkmark

---

## Translation File Structure

```
/src
  /locales
    /en
      - common.json       # Common UI strings
      - onboarding.json   # Onboarding flow
      - profile.json      # Profile editing
      - services.json     # Services management
      - directory.json    # Discovery directory
      - viral.json        # Recommendation messages
      - errors.json       # Error messages
      - payments.json     # Payment flow
    /pt-BR
      - common.json
      - onboarding.json
      - ...
    /es
      - common.json
      - onboarding.json
      - ...
```

---

## Translation Keys Examples

### Common UI Strings

**pt-BR** (`locales/pt-BR/common.json`):
```json
{
  "app_name": "amei.beauty",
  "tagline": "Seu cartão profissional em 1 minuto",
  "buttons": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "publish": "Publicar",
    "unpublish": "Despublicar",
    "share": "Compartilhar",
    "close": "Fechar",
    "next": "Próximo",
    "back": "Voltar",
    "finish": "Concluir"
  },
  "navigation": {
    "profile": "Perfil",
    "services": "Serviços",
    "links": "Links",
    "social": "Redes Sociais",
    "settings": "Configurações",
    "preview": "Visualizar"
  }
}
```

**en** (`locales/en/common.json`):
```json
{
  "app_name": "amei.beauty",
  "tagline": "Your professional card in 1 minute",
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "publish": "Publish",
    "unpublish": "Unpublish",
    "share": "Share",
    "close": "Close",
    "next": "Next",
    "back": "Back",
    "finish": "Finish"
  },
  "navigation": {
    "profile": "Profile",
    "services": "Services",
    "links": "Links",
    "social": "Social Media",
    "settings": "Settings",
    "preview": "Preview"
  }
}
```

**es** (`locales/es/common.json`):
```json
{
  "app_name": "amei.beauty",
  "tagline": "Tu tarjeta profesional en 1 minuto",
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "publish": "Publicar",
    "unpublish": "Despublicar",
    "share": "Compartir",
    "close": "Cerrar",
    "next": "Siguiente",
    "back": "Atrás",
    "finish": "Finalizar"
  },
  "navigation": {
    "profile": "Perfil",
    "services": "Servicios",
    "links": "Enlaces",
    "social": "Redes Sociales",
    "settings": "Configuración",
    "preview": "Vista Previa"
  }
}
```

### Onboarding Flow

**pt-BR** (`locales/pt-BR/onboarding.json`):
```json
{
  "title": "Crie seu cartão profissional",
  "subtitle": "Em apenas 1 minuto",
  "steps": {
    "name": {
      "label": "Qual é o seu nome?",
      "placeholder": "Digite seu nome completo"
    },
    "profession": {
      "label": "Qual é a sua profissão?",
      "placeholder": "Ex: Cabeleireira, Manicure, Maquiadora"
    },
    "whatsapp": {
      "label": "Qual é o seu WhatsApp?",
      "placeholder": "(11) 99999-9999",
      "help": "Seus clientes vão usar este número para entrar em contato"
    },
    "photo": {
      "label": "Adicione sua foto profissional",
      "help": "Uma boa foto aumenta sua credibilidade"
    }
  },
  "ai_completion": {
    "title": "Deixe a IA completar seu perfil",
    "description": "Estamos buscando suas informações online...",
    "review": "Revise e aprove o que encontramos"
  }
}
```

### Viral Recommendations

**pt-BR** (`locales/pt-BR/viral.json`):
```json
{
  "recommend_button": "Amei este profissional!",
  "you_will_love": "Você também vai amar!",
  "share_love": "Compartilhe o amor!",
  "recommended_by": "Recomendado por {{name}}",
  "people_recommended": "{{count}} pessoas recomendaram",
  "person_recommended": "{{count}} pessoa recomendou",
  "share_message": "Amei este profissional! Confira: {{url}}",
  "help_grow": "Ajude este profissional a crescer!",
  "spread_love": "Espalhe o amor pelos profissionais que você ama!"
}
```

**en** (`locales/en/viral.json`):
```json
{
  "recommend_button": "I loved this professional!",
  "you_will_love": "You'll love it too!",
  "share_love": "Share the love!",
  "recommended_by": "Recommended by {{name}}",
  "people_recommended": "{{count}} people recommended",
  "person_recommended": "{{count}} person recommended",
  "share_message": "I loved this professional! Check it out: {{url}}",
  "help_grow": "Help this professional grow!",
  "spread_love": "Spread love for professionals you love!"
}
```

**es** (`locales/es/viral.json`):
```json
{
  "recommend_button": "¡Me encantó este profesional!",
  "you_will_love": "¡También te encantará!",
  "share_love": "¡Comparte el amor!",
  "recommended_by": "Recomendado por {{name}}",
  "people_recommended": "{{count}} personas recomendaron",
  "person_recommended": "{{count}} persona recomendó",
  "share_message": "¡Me encantó este profesional! Échale un vistazo: {{url}}",
  "help_grow": "¡Ayuda a este profesional a crecer!",
  "spread_love": "¡Comparte el amor por los profesionales que amas!"
}
```

---

## Implementation: Custom Lightweight i18n

### Core i18n Class

```typescript
// src/lib/i18n.ts

type Locale = 'en' | 'pt-BR' | 'es';
type Translations = Record<string, any>;

class I18n {
  private locale: Locale = 'pt-BR';
  private translations: Translations = {};
  private listeners: Set<() => void> = new Set();

  async init() {
    // Load saved preference or detect
    const saved = localStorage.getItem('app_language') as Locale;
    const detected = this.detectLanguage();
    this.locale = saved && ['en', 'pt-BR', 'es'].includes(saved) 
      ? saved 
      : detected;
    
    await this.load(this.locale);
  }

  async load(locale: Locale) {
    this.locale = locale;
    
    // Load all translation files for this locale
    const [common, onboarding, profile, services, directory, viral, errors, payments] = 
      await Promise.all([
        import(`/locales/${locale}/common.json`),
        import(`/locales/${locale}/onboarding.json`),
        import(`/locales/${locale}/profile.json`),
        import(`/locales/${locale}/services.json`),
        import(`/locales/${locale}/directory.json`),
        import(`/locales/${locale}/viral.json`),
        import(`/locales/${locale}/errors.json`),
        import(`/locales/${locale}/payments.json`),
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
  }

  t(key: string, params?: Record<string, string | number>): string {
    const value = this.getNestedValue(this.translations, key);
    if (typeof value !== 'string') {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    return this.interpolate(value, params);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj);
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

  setLocale(locale: Locale) {
    this.load(locale);
  }

  detectLanguage(): Locale {
    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('en')) return 'en';
    return 'pt-BR'; // Default
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }
}

export const i18n = new I18n();
```

### Usage in Components

```typescript
// src/components/Button.tsx

import { i18n } from '../lib/i18n';
import { useEffect, useState } from 'preact/hooks';

export function Button({ labelKey, ...props }) {
  const [label, setLabel] = useState(i18n.t(labelKey));
  
  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLabel(i18n.t(labelKey));
    });
    return unsubscribe;
  }, [labelKey]);
  
  return <button {...props}>{label}</button>;
}

// Usage
<Button labelKey="buttons.save" onClick={handleSave} />
```

### React/Preact Hook

```typescript
// src/hooks/useTranslation.ts

import { i18n } from '../lib/i18n';
import { useEffect, useState } from 'preact/hooks';

export function useTranslation() {
  const [locale, setLocale] = useState(i18n.getLocale());
  
  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLocale(i18n.getLocale());
    });
    return unsubscribe;
  }, []);
  
  return {
    t: (key: string, params?: Record<string, string | number>) => i18n.t(key, params),
    locale,
    setLocale: (locale: Locale) => i18n.setLocale(locale),
  };
}

// Usage in component
const { t, locale, setLocale } = useTranslation();
<button>{t('buttons.save')}</button>
```

---

## User-Generated Content

### Important: Don't Translate User Content

**Principle**: User-generated content (profiles, services, testimonials) should **NOT** be translated automatically.

**Why**:
- Preserves authenticity
- User wrote it in their language intentionally
- Translation might lose nuance
- Professional content should be in professional's language

**What Gets Translated**:
- ✅ UI strings (buttons, labels, messages)
- ✅ System messages (errors, confirmations)
- ✅ Help text and instructions
- ✅ Marketing copy

**What Doesn't Get Translated**:
- ❌ User's name
- ❌ User's bio/description
- ❌ Service names and descriptions
- ❌ Testimonials/reviews
- ❌ Prices (but currency formatting can change)

### Language Tagging (Optional)

Allow users to tag their content language:

```typescript
interface PublishedCard {
  // ...
  content_language: 'pt-BR' | 'es' | 'en'; // Language of user's content
  ui_language: 'pt-BR' | 'es' | 'en'; // Language of UI when viewing
}
```

This enables:
- Filter directory by content language
- Show "Available in Portuguese" badge
- Better search results

---

## Currency & Formatting

### Currency Display

```typescript
function formatCurrency(amount: number, locale: Locale): string {
  const currencies = {
    'pt-BR': 'BRL', // R$
    'es': 'USD',    // $ (or local currency)
    'en': 'USD',    // $
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencies[locale],
  }).format(amount);
}
```

### Date Formatting

```typescript
function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

### Phone Number Formatting

```typescript
function formatPhone(phone: string, locale: Locale): string {
  // Brazilian format: (11) 99999-9999
  if (locale === 'pt-BR') {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  // Default: +1 (555) 123-4567
  return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
}
```

---

## Testing i18n

### Checklist

- [ ] All 3 languages load correctly
- [ ] Language detection works (browser + geolocation)
- [ ] Language selector works (instant change)
- [ ] Preference persists across sessions
- [ ] All UI strings are translated (no hardcoded text)
- [ ] No missing translations (check console warnings)
- [ ] Currency formatting correct per locale
- [ ] Date formatting correct per locale
- [ ] Phone number formatting correct per locale
- [ ] RTL support (if needed for future languages)
- [ ] Text doesn't overflow in different languages
- [ ] Button sizes accommodate longer/shorter text

### Testing Tools

```typescript
// src/lib/i18n-test.ts

export function checkMissingTranslations() {
  const keys = getAllTranslationKeys(); // Extract all keys from code
  const locales = ['en', 'pt-BR', 'es'];
  
  locales.forEach(locale => {
    const missing = keys.filter(key => !hasTranslation(locale, key));
    if (missing.length > 0) {
      console.warn(`Missing translations in ${locale}:`, missing);
    }
  });
}
```

---

## Implementation Priority

### Week 1-2: Infrastructure
- [ ] Set up i18n system (custom or i18next)
- [ ] Create translation file structure
- [ ] Implement language detection
- [ ] Build language selector component
- [ ] Translate core UI (common.json)

### Week 2-3: Core Features
- [ ] Translate onboarding flow
- [ ] Translate profile editing
- [ ] Translate services management
- [ ] Translate directory/search

### Week 3-4: Advanced Features
- [ ] Translate viral recommendations
- [ ] Translate payment flow
- [ ] Translate error messages
- [ ] Test all languages thoroughly

---

## Best Practices

1. **Always use translation keys** - Never hardcode strings
2. **Use descriptive keys** - `buttons.save` not `btn1`
3. **Group related translations** - `onboarding.step1.title`
4. **Keep translations in sync** - When adding a feature, translate all 3 languages
5. **Test with long translations** - German/Spanish can be longer than English
6. **Use interpolation** - `"Hello {{name}}"` not string concatenation
7. **Context matters** - Same word might need different translations
8. **Review by native speakers** - Don't rely on Google Translate

---

## Future Expansion

When adding more languages:
1. Add locale to `Locale` type
2. Create new `/locales/[locale]/` directory
3. Copy structure from existing language
4. Translate all files
5. Update language selector
6. Test thoroughly

**Potential future languages**:
- Portuguese (PT) - Portugal
- French (fr) - Canada, France
- Italian (it) - Italy
- German (de) - Germany

---

*This i18n implementation ensures amei.beauty is accessible to users across Brazil, LATAM, and internationally while maintaining Brazilian-first approach.*

