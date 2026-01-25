import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/Button';
import { ProviderGrid } from '@/components/providers/ProviderGrid';
import { services, getServiceLabel, getServiceIcon } from '@/config/services';
import { createClient } from '@/lib/supabase/server';
import type { ProviderWithProfile } from '@/types/database';

async function getFeaturedProviders(country: string | null, language: string): Promise<ProviderWithProfile[]> {
  const supabase = await createClient();

  // Try to get featured providers
  let query = supabase
    .from('provider_profiles')
    .select(`
      *,
      profile:profiles!inner(*),
      photos:provider_photos(*)
    `)
    .eq('featured', true);

  if (country) {
    query = query.or(`featured_country_code.eq.${country},featured_country_code.is.null`);
  }

  query = query
    .order('is_verified', { ascending: false })
    .order('priority_score', { ascending: false })
    .limit(6);

  const { data: featured } = await query;

  // If not enough, get top providers
  if (!featured || featured.length < 6) {
    const excludeIds = featured?.map((p) => p.user_id) || [];
    
    let topQuery = supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos(*)
      `);

    if (excludeIds.length > 0) {
      topQuery = topQuery.not('user_id', 'in', `(${excludeIds.join(',')})`);
    }

    if (country) {
      topQuery = topQuery.eq('country_code', country);
    }

    topQuery = topQuery
      .order('is_verified', { ascending: false })
      .order('priority_score', { ascending: false })
      .limit(6 - (featured?.length || 0));

    const { data: top } = await topQuery;

    // If still not enough, get global top
    if ((!featured?.length && !top?.length) || ((featured?.length || 0) + (top?.length || 0) < 3)) {
      const { data: global } = await supabase
        .from('provider_profiles')
        .select(`
          *,
          profile:profiles!inner(*),
          photos:provider_photos(*)
        `)
        .order('is_verified', { ascending: false })
        .order('priority_score', { ascending: false })
        .limit(6);

      return (global || []) as ProviderWithProfile[];
    }

    return [...(featured || []), ...(top || [])] as ProviderWithProfile[];
  }

  return featured as ProviderWithProfile[];
}

export default async function HomePage() {
  const t = await getTranslations('landing');
  const headersList = await headers();
  
  // Get country from Vercel headers
  const country = headersList.get('x-vercel-ip-country') || null;
  const acceptLanguage = headersList.get('accept-language') || 'en';
  const language = acceptLanguage.split(',')[0]?.split('-')[0] || 'en';

  const providers = await getFeaturedProviders(country, language);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('hero.title')}</h1>
            <p className="text-xl text-blue-100 mb-8">{t('hero.subtitle')}</p>
            <Link href="/search">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                {t('hero.cta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Providers Section */}
      {providers.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('topProviders.title')}</h2>
              <Link href="/search">
                <Button variant="outline">{t('topProviders.viewProfile')}</Button>
              </Link>
            </div>
            <ProviderGrid providers={providers} />
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('services.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {services.slice(0, 12).map((service) => (
              <Link
                key={service.code}
                href={`/search?service=${service.code}`}
                className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">{getServiceIcon(service.code)}</div>
                <h3 className="font-medium text-gray-900 text-sm">{getServiceLabel(service.code, language)}</h3>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/search" className="text-blue-600 hover:underline">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-12 text-center">{t('howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step1.title')}</h3>
              <p className="text-gray-600">{t('howItWorks.step1.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step2.title')}</h3>
              <p className="text-gray-600">{t('howItWorks.step2.description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step3.title')}</h3>
              <p className="text-gray-600">{t('howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find your specialist?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of expats who have found the help they need through Localisio.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Find Specialists
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                Become a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
