'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SearchFilters } from '@/components/providers/SearchFilters';
import { ProviderGrid } from '@/components/providers/ProviderGrid';
import { Button } from '@/components/ui/Button';
import type { ProviderWithProfile } from '@/types/database';

function SearchContent() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filter state
  const [service, setService] = useState(searchParams.get('service') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');

  const fetchProviders = useCallback(async (newOffset: number = 0) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (service) params.set('service', service);
      if (language) params.set('language', language);
      if (country) params.set('country_code', country);
      if (city) params.set('city', city);
      params.set('sort', sort);
      params.set('limit', '20');
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
  }, [service, language, country, city, sort]);

  useEffect(() => {
    fetchProviders(0);
  }, [fetchProviders]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (language) params.set('language', language);
    if (country) params.set('country', country);
    if (city) params.set('city', city);
    if (sort !== 'relevance') params.set('sort', sort);

    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [service, language, country, city, sort, router]);

  const handleClearFilters = () => {
    setService('');
    setLanguage('');
    setCountry('');
    setCity('');
    setSort('relevance');
  };

  const handleLoadMore = () => {
    fetchProviders(offset + 20);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <SearchFilters
        service={service}
        language={language}
        country={country}
        city={city}
        sort={sort}
        onServiceChange={setService}
        onLanguageChange={setLanguage}
        onCountryChange={setCountry}
        onCityChange={setCity}
        onSortChange={setSort}
        onClear={handleClearFilters}
      />

      <div className="mt-8">
        {isLoading && providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">{t('results.noResults')}</p>
            <p className="text-gray-400 mt-2">{t('results.tryAdjusting')}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">{t('results.showing', { count: total })}</p>
            <ProviderGrid providers={providers} />
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  isLoading={isLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
