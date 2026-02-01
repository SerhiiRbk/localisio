'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { buildExpertsUrl } from '@/lib/utils';

/**
 * Redirect old /search URLs to new /experts URLs for backward compatibility
 */
function SearchRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const service = searchParams.get('service');
    const language = searchParams.get('language');
    const country = searchParams.get('country');
    const cityPlaceId = searchParams.get('city_place_id');
    const cityName = searchParams.get('city_name');
    const sort = searchParams.get('sort');

    const newUrl = buildExpertsUrl({
      service,
      language,
      country,
      city_place_id: cityPlaceId || undefined,
      city_name: cityName || undefined,
      sort: sort || undefined,
    });

    router.replace(newUrl);
  }, [searchParams, router]);

  return (
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
      <SearchRedirect />
    </Suspense>
  );
}
