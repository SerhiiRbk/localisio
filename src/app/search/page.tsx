'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SearchFilters } from '@/components/providers/SearchFilters';
import { ProviderCardCompact } from '@/components/providers/ProviderCardCompact';
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
    fetchProviders(offset + 21);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('title')}</h1>

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
            
            {/* Grid matching landing page style */}
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
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-1/4"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
