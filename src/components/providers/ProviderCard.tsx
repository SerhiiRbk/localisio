import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getServiceLabel } from '@/config/services';
import { getLanguageLabel } from '@/config/languages';
import { getCountryLabel, getCountryFlag } from '@/config/countries';
import { getStorageUrl, getProviderProfileUrl } from '@/lib/utils';
import type { ProviderWithProfile } from '@/types/database';

interface ProviderCardProps {
  provider: ProviderWithProfile;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const t = useTranslations('provider.card');
  const locale = useLocale();

  const primaryPhoto = provider.photos?.find((p) => p.is_primary) || provider.photos?.[0];
  const avatarUrl = primaryPhoto ? getStorageUrl(primaryPhoto.storage_path) : provider.profile.avatar_url;

  return (
    <Card hover className="overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          <Avatar src={avatarUrl} alt={provider.profile.display_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {provider.profile.display_name}
                </h3>
                {provider.headline && (
                  <p className="text-sm text-gray-600 truncate">{provider.headline}</p>
                )}
              </div>
              {provider.is_verified && (
                <Badge variant="success" size="sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('verified')}
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {provider.country_code && (
                <span className="text-sm text-gray-500">
                  {getCountryFlag(provider.country_code)} {getCountryLabel(provider.country_code, locale)}
                  {provider.city && `, ${provider.city}`}
                </span>
              )}
            </div>

            {provider.experience_years > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {t('yearsExp', { years: provider.experience_years })}
              </p>
            )}
          </div>
        </div>

        {/* Services */}
        {provider.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {provider.services.slice(0, 3).map((service) => (
              <Badge key={service} variant="info" size="sm">
                {getServiceLabel(service, locale)}
              </Badge>
            ))}
            {provider.services.length > 3 && (
              <Badge variant="default" size="sm">
                +{provider.services.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Languages */}
        {provider.languages.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {provider.languages.slice(0, 4).map((lang, i) => (
              <span key={lang}>
                {i > 0 && ', '}
                {getLanguageLabel(lang, locale)}
              </span>
            ))}
            {provider.languages.length > 4 && <span>, +{provider.languages.length - 4}</span>}
          </div>
        )}

        <div className="mt-4">
          <Link href={getProviderProfileUrl(provider)}>
            <Button variant="outline" size="sm" className="w-full">
              {t('viewProfile')}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
