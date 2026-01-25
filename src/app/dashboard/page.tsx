import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Profile, ProviderProfile } from '@/types/database';

export const metadata = {
  title: 'Dashboard',
};

async function getUserData(): Promise<{
  profile: Profile;
  providerProfile?: ProviderProfile;
  unreadMessages: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/sign-in');
  }

  let providerProfile;
  if (profile.role === 'provider') {
    const { data } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    providerProfile = data || undefined;
  }

  // Get unread message count
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('*, conversations!inner(*)', { count: 'exact', head: true })
    .neq('sender_id', user.id)
    .is('read_at', null)
    .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`, { foreignTable: 'conversations' });

  return {
    profile,
    providerProfile: providerProfile || undefined,
    unreadMessages: unreadMessages || 0,
  };
}

export default async function DashboardPage() {
  const { profile, providerProfile, unreadMessages } = await getUserData();
  const t = await getTranslations('dashboard');

  if (profile.role === 'provider') {
    // Provider Dashboard
    const profileCompletion = calculateProfileCompletion(providerProfile);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('welcome', { name: profile.display_name })}
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('provider.profileCompletion')}</h2>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              {profileCompletion < 100 && (
                <p className="text-sm text-gray-600 mb-4">{t('provider.completeProfile')}</p>
              )}
              <div className="flex gap-3">
                <Link href="/dashboard/provider/profile">
                  <Button variant="outline" size="sm">
                    {t('provider.editProfile')}
                  </Button>
                </Link>
                <Link href="/dashboard/provider/photos">
                  <Button variant="outline" size="sm">
                    {t('provider.managePhotos')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('provider.messages')}</h2>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {unreadMessages}
                {unreadMessages > 0 && (
                  <Badge variant="danger" size="sm" className="ml-2">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">Unread messages</p>
              <Link href="/dashboard/messages">
                <Button variant="outline" size="sm">
                  View Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">{t('provider.verified')}</h2>
            </CardHeader>
            <CardContent>
              {providerProfile?.is_verified ? (
                <Badge variant="success" size="md">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </Badge>
              ) : (
                <p className="text-gray-600 text-sm">
                  Not verified yet. Complete your profile and we&apos;ll review it.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/p/${profile.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    View Public Profile
                  </Button>
                </Link>
                <Link href="/dashboard/notifications" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Seeker Dashboard
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {t('welcome', { name: profile.display_name })}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Find Specialists */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('seeker.findSpecialists')}</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Browse our directory of verified specialists ready to help you.
            </p>
            <Link href="/search">
              <Button>Find Specialists</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('seeker.recentConversations')}</h2>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {unreadMessages}
              {unreadMessages > 0 && (
                <Badge variant="danger" size="sm" className="ml-2">
                  New
                </Badge>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-4">Unread messages</p>
            <Link href="/dashboard/messages">
              <Button variant="outline" size="sm">
                View Messages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function calculateProfileCompletion(profile?: ProviderProfile): number {
  if (!profile) return 0;

  let score = 0;
  const fields = [
    { value: profile.headline, weight: 15 },
    { value: profile.bio, weight: 20 },
    { value: profile.experience_years > 0, weight: 10 },
    { value: profile.country_code, weight: 15 },
    { value: profile.city, weight: 10 },
    { value: profile.languages.length > 0, weight: 15 },
    { value: profile.services.length > 0, weight: 15 },
  ];

  for (const field of fields) {
    if (field.value) score += field.weight;
  }

  return score;
}
