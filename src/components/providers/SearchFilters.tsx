'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { CityAutocomplete, type CitySelection } from '@/components/ui/CityAutocomplete';
import { ServiceTypeSelect, useServiceTaxonomy } from '@/components/ui/ServiceTypeSelect';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel } from '@/config/countries';

interface SearchFiltersProps {
  /** Service slug (for URL/backward compatibility) */
  service: string;
  language: string;
  country: string;
  /** Selected city for autocomplete (new geocoded approach) */
  selectedCity: CitySelection | null;
  /** Legacy city string (for backward compatibility) */
  city?: string;
  sort: string;
  onServiceChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  /** Handler for city selection from autocomplete */
  onCitySelect: (city: CitySelection | null) => void;
  /** Legacy handler for text input (deprecated) */
  onCityChange?: (value: string) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
}

export function SearchFilters({
  service,
  language,
  country,
  selectedCity,
  sort,
  onServiceChange,
  onLanguageChange,
  onCountryChange,
  onCitySelect,
  onSortChange,
  onClear,
}: SearchFiltersProps) {
  const t = useTranslations('search.filters');
  const tSort = useTranslations('search.sort');
  const locale = useLocale();
  const { taxonomy } = useServiceTaxonomy();

  // Convert service slug to ID for the new component
  const [serviceTypeId, setServiceTypeId] = useState<string | null>(null);

  // Sync service slug to ID when taxonomy loads or service changes
  useEffect(() => {
    if (taxonomy && service) {
      const serviceType = taxonomy.allTypes.find(t => t.slug === service);
      setServiceTypeId(serviceType?.id || null);
    } else if (!service) {
      setServiceTypeId(null);
    }
  }, [taxonomy, service]);

  // Handle service selection - convert ID back to slug for parent
  const handleServiceSelect = useCallback((value: string | string[] | null) => {
    const id = Array.isArray(value) ? value[0] : value;
    setServiceTypeId(id);
    
    if (id && taxonomy) {
      const serviceType = taxonomy.allTypes.find(t => t.id === id);
      onServiceChange(serviceType?.slug || '');
    } else {
      onServiceChange('');
    }
  }, [taxonomy, onServiceChange]);

  const languageOptions = useMemo(() => [
    { value: '', label: t('allLanguages') },
    ...languages.map((l) => ({ value: l.code, label: getLanguageLabel(l.code, locale) })),
  ], [t, locale]);

  const countryOptions = useMemo(() => [
    { value: '', label: t('allCountries') },
    ...countries.map((c) => ({ value: c.code, label: `${c.flag} ${getCountryLabel(c.code, locale)}` })),
  ], [t, locale]);

  const sortOptions = useMemo(() => [
    { value: 'relevance', label: tSort('relevance') },
    { value: 'top', label: tSort('top') },
  ], [tSort]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ServiceTypeSelect
          label={t('service')}
          value={serviceTypeId}
          onChange={handleServiceSelect}
          placeholder={t('allServices')}
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
          onChange={(e) => {
            onCountryChange(e.target.value);
            // Clear city when country changes
            if (selectedCity && e.target.value !== selectedCity.country_code) {
              onCitySelect(null);
            }
          }}
        />
        <CityAutocomplete
          label={t('city')}
          placeholder={t('anyCity')}
          value={selectedCity}
          countryCode={country || undefined}
          onChange={onCitySelect}
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
