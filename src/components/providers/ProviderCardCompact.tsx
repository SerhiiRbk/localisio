'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { getServiceLabel } from '@/config/services';
import { getCountryFlag, getCountryLabel } from '@/config/countries';
import { getLanguageLabel, languages } from '@/config/languages';
import { getStorageUrl } from '@/lib/utils';
import type { ProviderWithProfile } from '@/types/database';

interface ProviderCardCompactProps {
  provider: ProviderWithProfile;
}

// Get flag emoji for language
function getLanguageFlag(code: string): string {
  const lang = languages.find(l => l.code === code);
  return lang?.flag || '';
}

export function ProviderCardCompact({ provider }: ProviderCardCompactProps) {
  const locale = useLocale();

  const primaryPhoto = provider.photos?.find((p) => p.is_primary) || provider.photos?.[0];
  const avatarUrl = primaryPhoto ? getStorageUrl(primaryPhoto.storage_path) : provider.profile.avatar_url;

  return (
    <Link href={`/p/${provider.user_id}`} className="group block">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 flex">
        {/* Avatar - Left side */}
        <div className="relative w-32 sm:w-40 flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={provider.profile.display_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">
                {provider.profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Verified Badge */}
          {provider.is_verified && (
            <div className="absolute top-2 left-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Info - Right side */}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {provider.profile.display_name}
            </h3>
          </div>
          
          {provider.headline && (
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {provider.headline}
            </p>
          )}
          
          {/* Country & City */}
          {provider.country_code && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
              <span>{getCountryFlag(provider.country_code)}</span>
              <span className="truncate">
                {getCountryLabel(provider.country_code, locale)}
                {provider.city && `, ${provider.city}`}
              </span>
            </div>
          )}
          
          {/* Languages - icon + flags with tooltip */}
          {provider.languages.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <div className="flex items-center gap-0.5">
                {provider.languages.slice(0, 5).map((lang) => (
                  <span 
                    key={lang} 
                    className="relative text-base cursor-default group/flag"
                  >
                    {getLanguageFlag(lang)}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover/flag:opacity-100 group-hover/flag:visible transition-all z-10">
                      {getLanguageLabel(lang, locale)}
                    </span>
                  </span>
                ))}
                {provider.languages.length > 5 && (
                  <span className="text-xs text-slate-400 ml-0.5">+{provider.languages.length - 5}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Services */}
          {provider.services.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {provider.services.slice(0, 2).map((service) => (
                <Badge key={service} variant="info" size="sm" className="text-xs">
                  {getServiceLabel(service, locale)}
                </Badge>
              ))}
              {provider.services.length > 2 && (
                <span className="text-xs text-slate-400 self-center">+{provider.services.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
