import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/Button';
import { ProviderGrid } from '@/components/providers/ProviderGrid';
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
    .order('is_verified', { ascending: false })
    .order('priority_score', { ascending: false })
    .limit(8);

  if (country) {
    query = query.eq('country_code', country);
  }

  const { data } = await query;

  if (!data || data.length < 4) {
    const { data: globalData } = await supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos(*)
      `)
      .order('is_verified', { ascending: false })
      .order('priority_score', { ascending: false })
      .limit(8);
    
    return (globalData || []) as ProviderWithProfile[];
  }

  return data as ProviderWithProfile[];
}

export default async function HomePage() {
  const t = await getTranslations('landing');
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country') || null;
  const providers = await getFeaturedProviders(country);

  // Category data
  const categories = [
    { key: 'immigration', icon: '📋', service: 'immigration_lawyer' },
    { key: 'accounting', icon: '📊', service: 'tax_accountant' },
    { key: 'realEstate', icon: '🏠', service: 'real_estate_agent' },
    { key: 'health', icon: '🏥', service: 'doctor' },
    { key: 'business', icon: '💼', service: 'business_consultant' },
    { key: 'education', icon: '📚', service: 'language_teacher' },
    { key: 'wellness', icon: '🧘', service: 'yoga_instructor' },
    { key: 'beauty', icon: '💇', service: 'hairdresser' },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-in">
              
              <h1 className="text-4xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                {t('hero.title')}{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                {t('hero.subtitle1')}<br />
                <span className="text-slate-500">{t('hero.subtitle2')}</span>
              </p>
              
              <p className="mt-4 text-slate-500 leading-relaxed max-w-xl">
                {t('hero.description')}
              </p>
              
              <ul className="mt-8 space-y-4">
                {['benefit1', 'benefit2', 'benefit3'].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-slate-700">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t(`hero.${benefit}` as Parameters<typeof t>[0])}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/search">
                  <Button size="lg" className="px-8 py-4 text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                    {t('hero.findExpert')}
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/auth/sign-up?role=provider">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-base border-2 hover:bg-slate-50">
                    {t('hero.imProfessional')}
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <Image
                  src="/hero-transparent.png"
                  alt="Local experts - doctor, lawyer, consultant"
                  width={600}
                  height={500}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 lg:gap-4">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={`/search?service=${category.service}`}
                className="group flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent hover:border-blue-100 transition-all duration-200"
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
              <span className="w-8 h-8 bg-slate-200 group-hover:bg-slate-300 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 transition-colors">
                +
              </span>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700">{t('categories.more')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Built for expats Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Quality guaranteed
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                {t('curated.title')}<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t('curated.titleHighlight')}
                </span>
              </h2>
              
              <p className="mt-6 text-lg text-slate-600 font-medium">
                {t('curated.subtitle')}
              </p>
              
              <ul className="mt-8 space-y-5">
                {['benefit1', 'benefit2', 'benefit3', 'benefit4'].map((benefit, i) => (
                  <li key={benefit} className="flex items-start gap-4 text-slate-700">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25">
                      {i + 1}
                    </div>
                    <span className="text-lg pt-0.5">{t(`curated.${benefit}` as Parameters<typeof t>[0])}</span>
                  </li>
                ))}
              </ul>
              
              <blockquote className="mt-8 pl-6 border-l-4 border-blue-500 text-slate-500 italic text-lg">
                {t('curated.note')}
              </blockquote>
              
              <div className="mt-10">
                <Link href="/search">
                  <Button size="lg" className="px-8 py-4 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
                    {t('curated.cta')}
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Card */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-100 rounded-full opacity-50 blur-2xl" />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-teal-100 rounded-full opacity-50 blur-2xl" />
                
                <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
                  <div className="flex items-start gap-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-blue-500/30">
                      👩‍💻
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-900">Maria Santos</span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">
                          Verified
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1 font-medium">Immigration Lawyer</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex text-yellow-400 text-lg">★★★★★</div>
                        <span className="text-slate-400 text-sm font-medium">(47 reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      { flag: '🇬🇧', lang: 'English' },
                      { flag: '🇪🇸', lang: 'Spanish' },
                      { flag: '🇷🇺', lang: 'Russian' },
                    ].map((item) => (
                      <span key={item.lang} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                        {item.flag} {item.lang}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">Barcelona, Spain</span>
                      </div>
                      <div className="text-sm text-slate-500 font-medium">12 years exp.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experts Section */}
      {providers.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
                Featured professionals
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{t('topProviders.title')}</h2>
              <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">{t('topProviders.subtitle')}</p>
            </div>
            <ProviderGrid providers={providers.slice(0, 6)} />
            <div className="text-center mt-12">
              <Link href="/search">
                <Button variant="outline" size="lg" className="px-8 py-4 text-base border-2">
                  {t('topProviders.viewAll')}
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="flex -space-x-4">
              {['👨‍⚖️', '👩‍⚕️', '👨‍💼', '👩‍🏫', '👨‍🔧', '👩‍💻', '👨‍🍳', '👩‍🎨'].map((emoji, i) => (
                <div
                  key={i}
                  className="w-14 h-14 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full border-4 border-white flex items-center justify-center text-2xl shadow-lg"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {emoji}
                </div>
              ))}
              <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">+99</span>
              </div>
            </div>
            <p className="mt-6 text-lg text-slate-600 text-center max-w-lg">
              {t('social.joinExperts')}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {t('cta.title')}
          </h2>
          <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/search">
              <Button size="lg" className="px-10 py-4 text-base bg-white text-blue-700 hover:bg-blue-50 shadow-xl shadow-blue-900/20 font-semibold">
                {t('cta.findExpert')}
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline" className="px-10 py-4 text-base border-2 border-white/30 text-white hover:bg-white/10 font-semibold backdrop-blur-sm">
                {t('cta.joinProfessional')}
              </Button>
            </Link>
          </div>
          
          {/* Social Links */}
          <div className="mt-16 flex justify-center gap-4">
            {[
              { icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', label: 'Facebook' },
              { icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z', label: 'Twitter' },
              { icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', label: 'LinkedIn' },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
                aria-label={social.label}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={social.icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
