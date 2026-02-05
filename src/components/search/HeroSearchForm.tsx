'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CityAutocomplete, type CitySelection } from '@/components/ui/CityAutocomplete';
import { ServiceTypeSelect, useServiceTaxonomy } from '@/components/ui/ServiceTypeSelect';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel, ONLINE_COUNTRY_CODE } from '@/config/countries';
import { buildExpertsUrl } from '@/lib/utils';

export function HeroSearchForm() {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const { taxonomy } = useServiceTaxonomy();
  
  const [serviceTypeId, setServiceTypeId] = useState<string | null>(null);
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(null);

  const handleCitySelect = (city: CitySelection | null) => {
    setSelectedCity(city);
    // Auto-set country if city has country info and country is not set
    if (city && city.country_code && !country) {
      setCountry(city.country_code);
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    // Clear city if country changes to a different one, or if "World - Online" is selected
    if (newCountry === ONLINE_COUNTRY_CODE || (selectedCity && newCountry !== selectedCity.country_code)) {
      setSelectedCity(null);
    }
  };

  const handleServiceChange = useCallback((value: string | string[] | null) => {
    // For hero form, we only support single select
    setServiceTypeId(Array.isArray(value) ? value[0] || null : value);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get service slug from taxonomy for URL
    let serviceSlug: string | null = null;
    if (serviceTypeId && taxonomy) {
      const serviceType = taxonomy.allTypes.find(t => t.id === serviceTypeId);
      if (serviceType) {
        serviceSlug = serviceType.slug;
      }
    }
    
    // Build SEO-friendly URL
    const url = buildExpertsUrl({
      service: serviceSlug,
      language: language || null,
      country: country || null,
      city_place_id: selectedCity?.place_id,
      city_name: selectedCity?.city_name,
    });
    
    router.push(url);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Service Type */}
          <div className="flex-1 min-w-0 lg:min-w-[200px]">
            <ServiceTypeSelect
              value={serviceTypeId}
              onChange={handleServiceChange}
              placeholder={t('serviceType')}
              inputClassName="h-12 bg-slate-50 border-0 rounded-xl"
              showClear={true}
            />
          </div>

          {/* Language */}
          <div className="flex-1 min-w-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border-0 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">{t('language')}</option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {getLanguageLabel(l.code, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div className="flex-1 min-w-0">
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border-0 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">{t('country')}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {getCountryLabel(c.code, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* City - disabled when "World - Online" is selected */}
          <div className="flex-1 min-w-0">
            <CityAutocomplete
              value={selectedCity}
              onChange={handleCitySelect}
              countryCode={country === ONLINE_COUNTRY_CODE ? undefined : country || undefined}
              placeholder={country === ONLINE_COUNTRY_CODE ? t('onlineNoCity') : t('city')}
              inputClassName={`h-12 px-4 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${country === ONLINE_COUNTRY_CODE ? 'opacity-50 cursor-not-allowed' : ''}`}
              hideSelectedIndicator
              disabled={country === ONLINE_COUNTRY_CODE}
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">{t('findExpert')}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
