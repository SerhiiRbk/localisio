'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { getStorageUrl } from '@/lib/utils';
import { getCountryLabel, getCountryFlag } from '@/config/countries';
import type { ProviderWithProfile } from '@/types/database';

export default function AdminProvidersPage() {
  const t = useTranslations('admin.providers');
  const locale = useLocale();

  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const response = await fetch('/api/providers/search?limit=50');
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProviders = providers.filter(
    (p) =>
      p.profile.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.headline?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            Back to Admin
          </Button>
        </Link>
      </div>

      <Input
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      <div className="space-y-4">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No providers found
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map((provider) => {
            const primaryPhoto =
              provider.photos?.find((p) => p.is_primary) || provider.photos?.[0];
            const avatarUrl = primaryPhoto
              ? getStorageUrl(primaryPhoto.storage_path)
              : provider.profile.avatar_url;

            return (
              <Card key={provider.user_id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={avatarUrl} alt={provider.profile.display_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {provider.profile.display_name}
                        </h3>
                        {provider.is_verified && (
                          <Badge variant="success" size="sm">
                            Verified
                          </Badge>
                        )}
                        {provider.featured && (
                          <Badge variant="info" size="sm">
                            Featured
                          </Badge>
                        )}
                      </div>
                      {provider.headline && (
                        <p className="text-sm text-gray-600">{provider.headline}</p>
                      )}
                      {provider.country_code && (
                        <p className="text-sm text-gray-500">
                          {getCountryFlag(provider.country_code)}{' '}
                          {getCountryLabel(provider.country_code, locale)}
                          {provider.city && `, ${provider.city}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Priority: {provider.priority_score}
                      </p>
                    </div>
                    <Link href={`/admin/providers/${provider.user_id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
