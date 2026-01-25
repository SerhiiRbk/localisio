// ============================================================
// i18n Configuration
// ============================================================

export const locales = ['en', 'ru', 'uk', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  es: 'Español',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  
  const preferred = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.split('-')[0].toLowerCase(), q: parseFloat(q) };
    })
    .sort((a, b) => b.q - a.q);
  
  for (const { code } of preferred) {
    if (isValidLocale(code)) {
      return code;
    }
  }
  
  return defaultLocale;
}
