'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { services, getServiceLabel } from '@/config/services';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel } from '@/config/countries';

export function HeroSearchForm() {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  
  const [service, setService] = useState('');
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (language) params.set('language', language);
    if (country) params.set('country_code', country);
    if (city) params.set('city', city);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Service Type */}
          <div className="flex-1 min-w-0">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border-0 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="">{t('serviceType')}</option>
              {services.map((s) => (
                <option key={s.code} value={s.code}>
                  {getServiceLabel(s.code, locale)}
                </option>
              ))}
            </select>
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
              onChange={(e) => setCountry(e.target.value)}
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

          {/* City */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('city')}
              className="w-full h-12 px-4 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
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
