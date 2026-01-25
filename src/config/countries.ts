// ============================================================
// Countries Configuration (common countries for expats)
// ============================================================

export interface CountryConfig {
  code: string;
  labels: {
    en: string;
    ru: string;
    uk: string;
    es: string;
  };
  flag: string;
}

export const countries: CountryConfig[] = [
  { code: 'US', labels: { en: 'United States', ru: 'США', uk: 'США', es: 'Estados Unidos' }, flag: '🇺🇸' },
  { code: 'GB', labels: { en: 'United Kingdom', ru: 'Великобритания', uk: 'Велика Британія', es: 'Reino Unido' }, flag: '🇬🇧' },
  { code: 'DE', labels: { en: 'Germany', ru: 'Германия', uk: 'Німеччина', es: 'Alemania' }, flag: '🇩🇪' },
  { code: 'FR', labels: { en: 'France', ru: 'Франция', uk: 'Франція', es: 'Francia' }, flag: '🇫🇷' },
  { code: 'ES', labels: { en: 'Spain', ru: 'Испания', uk: 'Іспанія', es: 'España' }, flag: '🇪🇸' },
  { code: 'IT', labels: { en: 'Italy', ru: 'Италия', uk: 'Італія', es: 'Italia' }, flag: '🇮🇹' },
  { code: 'NL', labels: { en: 'Netherlands', ru: 'Нидерланды', uk: 'Нідерланди', es: 'Países Bajos' }, flag: '🇳🇱' },
  { code: 'PL', labels: { en: 'Poland', ru: 'Польша', uk: 'Польща', es: 'Polonia' }, flag: '🇵🇱' },
  { code: 'PT', labels: { en: 'Portugal', ru: 'Португалия', uk: 'Португалія', es: 'Portugal' }, flag: '🇵🇹' },
  { code: 'CZ', labels: { en: 'Czech Republic', ru: 'Чехия', uk: 'Чехія', es: 'República Checa' }, flag: '🇨🇿' },
  { code: 'AT', labels: { en: 'Austria', ru: 'Австрия', uk: 'Австрія', es: 'Austria' }, flag: '🇦🇹' },
  { code: 'CH', labels: { en: 'Switzerland', ru: 'Швейцария', uk: 'Швейцарія', es: 'Suiza' }, flag: '🇨🇭' },
  { code: 'BE', labels: { en: 'Belgium', ru: 'Бельгия', uk: 'Бельгія', es: 'Bélgica' }, flag: '🇧🇪' },
  { code: 'SE', labels: { en: 'Sweden', ru: 'Швеция', uk: 'Швеція', es: 'Suecia' }, flag: '🇸🇪' },
  { code: 'NO', labels: { en: 'Norway', ru: 'Норвегия', uk: 'Норвегія', es: 'Noruega' }, flag: '🇳🇴' },
  { code: 'DK', labels: { en: 'Denmark', ru: 'Дания', uk: 'Данія', es: 'Dinamarca' }, flag: '🇩🇰' },
  { code: 'FI', labels: { en: 'Finland', ru: 'Финляндия', uk: 'Фінляндія', es: 'Finlandia' }, flag: '🇫🇮' },
  { code: 'IE', labels: { en: 'Ireland', ru: 'Ирландия', uk: 'Ірландія', es: 'Irlanda' }, flag: '🇮🇪' },
  { code: 'CA', labels: { en: 'Canada', ru: 'Канада', uk: 'Канада', es: 'Canadá' }, flag: '🇨🇦' },
  { code: 'AU', labels: { en: 'Australia', ru: 'Австралия', uk: 'Австралія', es: 'Australia' }, flag: '🇦🇺' },
  { code: 'NZ', labels: { en: 'New Zealand', ru: 'Новая Зеландия', uk: 'Нова Зеландія', es: 'Nueva Zelanda' }, flag: '🇳🇿' },
  { code: 'JP', labels: { en: 'Japan', ru: 'Япония', uk: 'Японія', es: 'Japón' }, flag: '🇯🇵' },
  { code: 'SG', labels: { en: 'Singapore', ru: 'Сингапур', uk: 'Сінгапур', es: 'Singapur' }, flag: '🇸🇬' },
  { code: 'AE', labels: { en: 'UAE', ru: 'ОАЭ', uk: 'ОАЕ', es: 'Emiratos Árabes Unidos' }, flag: '🇦🇪' },
  { code: 'IL', labels: { en: 'Israel', ru: 'Израиль', uk: 'Ізраїль', es: 'Israel' }, flag: '🇮🇱' },
  { code: 'TR', labels: { en: 'Turkey', ru: 'Турция', uk: 'Туреччина', es: 'Turquía' }, flag: '🇹🇷' },
  { code: 'TH', labels: { en: 'Thailand', ru: 'Таиланд', uk: 'Таїланд', es: 'Tailandia' }, flag: '🇹🇭' },
  { code: 'MX', labels: { en: 'Mexico', ru: 'Мексика', uk: 'Мексика', es: 'México' }, flag: '🇲🇽' },
  { code: 'BR', labels: { en: 'Brazil', ru: 'Бразилия', uk: 'Бразилія', es: 'Brasil' }, flag: '🇧🇷' },
  { code: 'AR', labels: { en: 'Argentina', ru: 'Аргентина', uk: 'Аргентина', es: 'Argentina' }, flag: '🇦🇷' },
  { code: 'CL', labels: { en: 'Chile', ru: 'Чили', uk: 'Чилі', es: 'Chile' }, flag: '🇨🇱' },
  { code: 'UY', labels: { en: 'Uruguay', ru: 'Уругвай', uk: 'Уругвай', es: 'Uruguay' }, flag: '🇺🇾' },
  { code: 'PY', labels: { en: 'Paraguay', ru: 'Парагвай', uk: 'Парагвай', es: 'Paraguay' }, flag: '🇵🇾' },
  { code: 'PA', labels: { en: 'Panama', ru: 'Панама', uk: 'Панама', es: 'Panamá' }, flag: '🇵🇦' },
  { code: 'GE', labels: { en: 'Georgia', ru: 'Грузия', uk: 'Грузія', es: 'Georgia' }, flag: '🇬🇪' },
  { code: 'RS', labels: { en: 'Serbia', ru: 'Сербия', uk: 'Сербія', es: 'Serbia' }, flag: '🇷🇸' },
  { code: 'ID', labels: { en: 'Indonesia', ru: 'Индонезия', uk: 'Індонезія', es: 'Indonesia' }, flag: '🇮🇩' },
  { code: 'VN', labels: { en: 'Vietnam', ru: 'Вьетнам', uk: 'В\'єтнам', es: 'Vietnam' }, flag: '🇻🇳' },
];

export const countriesByCode = countries.reduce(
  (acc, country) => {
    acc[country.code] = country;
    return acc;
  },
  {} as Record<string, CountryConfig>
);

export const countryCodes = countries.map((c) => c.code);

export function getCountryLabel(code: string, locale: string): string {
  const country = countriesByCode[code];
  if (!country) return code;
  return country.labels[locale as keyof typeof country.labels] || country.labels.en;
}

export function getCountryFlag(code: string): string {
  return countriesByCode[code]?.flag || '';
}
