'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { services, getServiceLabel } from '@/config/services';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel } from '@/config/countries';

interface SearchFiltersProps {
  service: string;
  language: string;
  country: string;
  city: string;
  sort: string;
  onServiceChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
}

export function SearchFilters({
  service,
  language,
  country,
  city,
  sort,
  onServiceChange,
  onLanguageChange,
  onCountryChange,
  onCityChange,
  onSortChange,
  onClear,
}: SearchFiltersProps) {
  const t = useTranslations('search.filters');
  const tSort = useTranslations('search.sort');
  const locale = useLocale();

  const serviceOptions = [
    { value: '', label: t('allServices') },
    ...services.map((s) => ({ value: s.code, label: getServiceLabel(s.code, locale) })),
  ];

  const languageOptions = [
    { value: '', label: t('allLanguages') },
    ...languages.map((l) => ({ value: l.code, label: getLanguageLabel(l.code, locale) })),
  ];

  const countryOptions = [
    { value: '', label: t('allCountries') },
    ...countries.map((c) => ({ value: c.code, label: `${c.flag} ${getCountryLabel(c.code, locale)}` })),
  ];

  const sortOptions = [
    { value: 'relevance', label: tSort('relevance') },
    { value: 'top', label: tSort('top') },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Select
          label={t('service')}
          options={serviceOptions}
          value={service}
          onChange={(e) => onServiceChange(e.target.value)}
        />
        <Select
          label={t('language')}
          options={languageOptions}
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        />
        <Select
          label={t('country')}
          options={countryOptions}
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        />
        <Input
          label={t('city')}
          placeholder={t('anyCity')}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        />
        <Select
          label={tSort('label')}
          options={sortOptions}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('clearFilters')}
        </Button>
      </div>
    </div>
  );
}
