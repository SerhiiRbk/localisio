import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/Button';
import { ProviderCardCompact } from '@/components/providers/ProviderCardCompact';
import { HeroSearchForm } from '@/components/search/HeroSearchForm';
import { createClient } from '@/lib/supabase/server';
import type { ProviderWithProfile } from '@/types/database';

async function getFeaturedProviders(country: string | null): Promise<ProviderWithProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from('provider_profiles')
    .select(`
      *,
      profile:profiles!inner(*),
      photos:provider_photos(*)
    `)
    .eq('is_hidden', false)
    .order('is_verified', { ascending: false })
    .order('average_rating', { ascending: false })
    .order('priority_score', { ascending: false })
    .limit(9);

  if (country) {
    query = query.eq('country_code', country);
  }

  const { data } = await query;

  if (!data || data.length < 3) {
    const { data: globalData } = await supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos(*)
      `)
      .eq('is_hidden', false)
      .order('is_verified', { ascending: false })
      .order('average_rating', { ascending: false })
      .order('priority_score', { ascending: false })
      .limit(9);
    
    return (globalData || []) as ProviderWithProfile[];
  }

  return data as ProviderWithProfile[];
}

export default async function HomePage() {
  const t = await getTranslations('landing');
  const locale = await getLocale();
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country') || null;
  const providers = await getFeaturedProviders(country);

  // Category data with icons
  const categories = [
    { key: 'immigration', icon: '⚖️', service: 'immigration_lawyer' },
    { key: 'accounting', icon: '📊', service: 'tax_accountant' },
    { key: 'realEstate', icon: '🏠', service: 'real_estate_agent' },
    { key: 'health', icon: '🏥', service: 'doctor' },
    { key: 'business', icon: '💼', service: 'business_consultant' },
    { key: 'education', icon: '📚', service: 'language_teacher' },
    { key: 'homeServices', icon: '🔧', service: 'handyman' },
    { key: 'wellness', icon: '🧘', service: 'yoga_instructor' },
  ];

  // How it works steps
  const steps = [
    { icon: '🔍', titleKey: 'step1Title', descKey: 'step1Desc' },
    { icon: '📋', titleKey: 'step2Title', descKey: 'step2Desc' },
    { icon: '💬', titleKey: 'step3Title', descKey: 'step3Desc' },
  ];

  // Trust signals
  const trustSignals = [
    { icon: '🛡️', titleKey: 'trust1Title', descKey: 'trust1Desc' },
    { icon: '🗣️', titleKey: 'trust2Title', descKey: 'trust2Desc' },
    { icon: '⚡', titleKey: 'trust3Title', descKey: 'trust3Desc' },
    { icon: '🌍', titleKey: 'trust4Title', descKey: 'trust4Desc' },
    { icon: '⭐', titleKey: 'trust5Title', descKey: 'trust5Desc' },
    { icon: '🔒', titleKey: 'trust6Title', descKey: 'trust6Desc' },
  ];

  return (
    <div className="bg-white">
      {/* ============================================================ */}
      {/* 1. HERO + INTEGRATED SEARCH */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              {t('hero.title')}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            
            {/* Search Form */}
            <div className="mt-10 max-w-4xl mx-auto">
              <HeroSearchForm />
            </div>
            
            {/* Trust Micro-badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('hero.badge1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('hero.badge2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('hero.badge3')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CATEGORY QUICK ACCESS */}
      {/* ============================================================ */}
      <section className="py-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">
            {t('categories.title')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/search?service=${category.service}`}
                className="group flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent hover:border-blue-200 transition-all duration-200"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{category.icon}</span>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                  {t(`categories.${category.key}` as Parameters<typeof t>[0])}
                </span>
              </Link>
            ))}
            <Link
              href="/search"
              className="group flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200"
            >
              <span className="w-7 h-7 bg-slate-200 group-hover:bg-slate-300 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 transition-colors">
                +
              </span>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700">{t('categories.more')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. HOW IT WORKS */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-transparent" />
                )}
                
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6 relative">
                  <span className="text-4xl">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {t(`howItWorks.${step.titleKey}` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {t(`howItWorks.${step.descKey}` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/search">
              <Button size="lg" className="px-8">
                {t('howItWorks.cta')}
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FEATURED EXPERTS */}
      {/* ============================================================ */}
      {providers.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {t('featuredExperts.badge')}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                  {t('featuredExperts.title')}
                </h2>
                <p className="mt-3 text-lg text-slate-500">
                  {t('featuredExperts.subtitle')}
                </p>
              </div>
              <Link href="/search" className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
                {t('featuredExperts.viewAll')}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.slice(0, 9).map((provider) => (
                <ProviderCardCompact key={provider.user_id} provider={provider} />
              ))}
            </div>
            
            <div className="text-center mt-10 sm:hidden">
              <Link href="/search">
                <Button variant="outline" size="lg" className="px-8 border-2">
                  {t('featuredExperts.viewAll')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. TRUST SIGNALS / WHY LOCALISIO */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {t('whyLocalisio.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              {t('whyLocalisio.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trustSignals.map((signal, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-3xl mb-5">
                  {signal.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {t(`whyLocalisio.${signal.titleKey}` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {t(`whyLocalisio.${signal.descKey}` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FOR PROFESSIONALS CTA */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-300 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              {t('forProfessionals.badge')}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t('forProfessionals.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              {t('forProfessionals.subtitle')}
            </p>
            
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-slate-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('forProfessionals.benefit1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('forProfessionals.benefit2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('forProfessionals.benefit3')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{t('forProfessionals.benefit4')}</span>
              </div>
            </div>
            
            <div className="mt-10">
              <Link href="/auth/sign-up?role=provider">
                <Button size="lg" className="px-10 py-4 text-base bg-white text-slate-900 hover:bg-slate-100 shadow-xl font-semibold">
                  {t('forProfessionals.cta')}
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FINAL CTA */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {t('finalCta.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              {t('finalCta.subtitle')}
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/search">
                <Button size="lg" className="px-10 py-4 text-base shadow-lg shadow-blue-500/25">
                  {t('finalCta.search')}
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="lg" variant="outline" className="px-10 py-4 text-base border-2">
                  {t('finalCta.signUp')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
