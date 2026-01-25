// ============================================================
// Languages Configuration
// ============================================================

export interface LanguageConfig {
  code: string;
  labels: {
    en: string;
    ru: string;
    uk: string;
    es: string;
  };
  flag?: string;
}

export const languages: LanguageConfig[] = [
  {
    code: 'en',
    labels: {
      en: 'English',
      ru: 'Английский',
      uk: 'Англійська',
      es: 'Inglés',
    },
    flag: '🇬🇧',
  },
  {
    code: 'ru',
    labels: {
      en: 'Russian',
      ru: 'Русский',
      uk: 'Російська',
      es: 'Ruso',
    },
    flag: '🇷🇺',
  },
  {
    code: 'uk',
    labels: {
      en: 'Ukrainian',
      ru: 'Украинский',
      uk: 'Українська',
      es: 'Ucraniano',
    },
    flag: '🇺🇦',
  },
  {
    code: 'es',
    labels: {
      en: 'Spanish',
      ru: 'Испанский',
      uk: 'Іспанська',
      es: 'Español',
    },
    flag: '🇪🇸',
  },
  {
    code: 'de',
    labels: {
      en: 'German',
      ru: 'Немецкий',
      uk: 'Німецька',
      es: 'Alemán',
    },
    flag: '🇩🇪',
  },
  {
    code: 'fr',
    labels: {
      en: 'French',
      ru: 'Французский',
      uk: 'Французька',
      es: 'Francés',
    },
    flag: '🇫🇷',
  },
  {
    code: 'pt',
    labels: {
      en: 'Portuguese',
      ru: 'Португальский',
      uk: 'Португальська',
      es: 'Portugués',
    },
    flag: '🇵🇹',
  },
  {
    code: 'it',
    labels: {
      en: 'Italian',
      ru: 'Итальянский',
      uk: 'Італійська',
      es: 'Italiano',
    },
    flag: '🇮🇹',
  },
  {
    code: 'zh',
    labels: {
      en: 'Chinese',
      ru: 'Китайский',
      uk: 'Китайська',
      es: 'Chino',
    },
    flag: '🇨🇳',
  },
  {
    code: 'ja',
    labels: {
      en: 'Japanese',
      ru: 'Японский',
      uk: 'Японська',
      es: 'Japonés',
    },
    flag: '🇯🇵',
  },
  {
    code: 'ar',
    labels: {
      en: 'Arabic',
      ru: 'Арабский',
      uk: 'Арабська',
      es: 'Árabe',
    },
    flag: '🇸🇦',
  },
  {
    code: 'pl',
    labels: {
      en: 'Polish',
      ru: 'Польский',
      uk: 'Польська',
      es: 'Polaco',
    },
    flag: '🇵🇱',
  },
];

export const languagesByCode = languages.reduce(
  (acc, lang) => {
    acc[lang.code] = lang;
    return acc;
  },
  {} as Record<string, LanguageConfig>
);

export const languageCodes = languages.map((l) => l.code);

// UI Locales (supported interface languages)
export const uiLocales = ['en', 'ru', 'uk', 'es'] as const;
export type UILocale = (typeof uiLocales)[number];

export function getLanguageLabel(code: string, locale: string): string {
  const lang = languagesByCode[code];
  if (!lang) return code;
  return lang.labels[locale as keyof typeof lang.labels] || lang.labels.en;
}

export function isValidUILocale(locale: string): locale is UILocale {
  return uiLocales.includes(locale as UILocale);
}
