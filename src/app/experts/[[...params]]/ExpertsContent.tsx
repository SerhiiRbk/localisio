'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SearchFilters } from '@/components/providers/SearchFilters';
import { ProviderCardCompact } from '@/components/providers/ProviderCardCompact';
import { Button } from '@/components/ui/Button';
import type { CitySelection } from '@/components/ui/CityAutocomplete';
import type { ProviderWithProfile } from '@/types/database';
import { buildExpertsUrl } from '@/lib/utils';

interface ExpertsContentProps {
  initialService: string | null;
  initialLanguage: string | null;
  initialCountry: string | null;
  initialCityPlaceId?: string;
  initialCityName?: string;
  initialSort: string;
}

export function ExpertsContent({
  initialService,
  initialLanguage,
  initialCountry,
  initialCityPlaceId,
  initialCityName,
  initialSort,
}: ExpertsContentProps) {
  const t = useTranslations('search');
  const tExperts = useTranslations('experts');
  const router = useRouter();

  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filter state
  const [service, setService] = useState(initialService || '');
  const [language, setLanguage] = useState(initialLanguage || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [sort, setSort] = useState(initialSort);
  
  // City selection state
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(() => {
    if (initialCityPlaceId && initialCityName) {
      return {
        place_id: initialCityPlaceId,
        display_name: initialCityName,
        city_name: initialCityName,
        country_code: initialCountry || '',
        country_name: '',
        lat: 0,
        lon: 0,
      };
    }
    return null;
  });

  const fetchProviders = useCallback(async (newOffset: number = 0) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (service) params.set('service', service);
      if (language) params.set('language', language);
      if (country) params.set('country_code', country);
      if (selectedCity?.place_id) {
        params.set('city_place_id', selectedCity.place_id);
      }
      params.set('sort', sort);
      params.set('limit', '21');
      params.set('offset', String(newOffset));

      const response = await fetch(`/api/providers/search?${params}`);
      const data = await response.json();

      if (newOffset === 0) {
        setProviders(data.providers || []);
      } else {
        setProviders((prev) => [...prev, ...(data.providers || [])]);
      }
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setOffset(newOffset);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [service, language, country, selectedCity, sort]);

  useEffect(() => {
    fetchProviders(0);
  }, [fetchProviders]);

  // Update URL when filters change
  useEffect(() => {
    const newUrl = buildExpertsUrl({
      service: service || null,
      language: language || null,
      country: country || null,
      city_place_id: selectedCity?.place_id,
      city_name: selectedCity?.city_name,
      sort,
    });
    
    router.replace(newUrl, { scroll: false });
  }, [service, language, country, selectedCity, sort, router]);

  const handleClearFilters = () => {
    setService('');
    setLanguage('');
    setCountry('');
    setSelectedCity(null);
    setSort('relevance');
  };

  const handleCitySelect = (city: CitySelection | null) => {
    setSelectedCity(city);
    if (city && city.country_code && !country) {
      setCountry(city.country_code);
    }
  };

  const handleLoadMore = () => {
    fetchProviders(offset + 21);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{tExperts('title')}</h1>

      <SearchFilters
        service={service}
        language={language}
        country={country}
        selectedCity={selectedCity}
        sort={sort}
        onServiceChange={setService}
        onLanguageChange={setLanguage}
        onCountryChange={setCountry}
        onCitySelect={handleCitySelect}
        onSortChange={setSort}
        onClear={handleClearFilters}
      />

      <div className="mt-8">
        {isLoading && providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-600 text-lg font-medium">{t('results.noResults')}</p>
            <p className="text-slate-400 mt-2">{t('results.tryAdjusting')}</p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 mb-6">{t('results.showing', { count: total })}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <ProviderCardCompact key={provider.user_id} provider={provider} />
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-10 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  isLoading={isLoading}
                  className="px-8"
                >
                  {t('loadMore')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
