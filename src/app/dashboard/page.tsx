import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getProviderProfileUrl } from '@/lib/utils';
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error:', authError);
    redirect('/auth/sign-in');
  }

  // Try to get existing profile
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile doesn't exist or error, create one
  if (!profile || profileError) {
    console.log('Profile not found or error, creating new profile for user:', user.id);
    const defaultRole = 'seeker';
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    
    // First try insert
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        display_name: displayName,
        role: defaultRole,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert profile error:', insertError);
      
      // If insert failed (maybe duplicate), try to fetch
      const { data: retryProfile, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (retryProfile) {
        profile = retryProfile;
      } else {
        console.error('Retry fetch error:', retryError);
        // Last resort: upsert
        const { data: upsertProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email!,
            display_name: displayName,
            role: defaultRole,
          }, { onConflict: 'id' })
          .select()
          .single();
        
        if (upsertError) {
          console.error('Upsert profile error:', upsertError);
          redirect('/auth/sign-in');
        }
        profile = upsertProfile;
      }
    } else {
      profile = newProfile;
    }
  }

  if (!profile) {
    console.error('Failed to get or create profile for user:', user.id);
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          {t('welcome', { name: profile.display_name })}
        </h1>

        {/* Pending Approval Notice */}
        {providerProfile && !providerProfile.is_approved && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">{t('provider.pendingApproval')}</h3>
                <p className="text-sm text-amber-700">{t('provider.pendingApprovalDescription')}</p>
              </div>
            </div>
          </div>
        )}

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
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              {profileCompletion < 100 && (
                <p className="text-sm text-slate-600 mb-4">{t('provider.completeProfile')}</p>
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
              <p className="text-slate-600 text-sm mb-4">Unread messages</p>
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
                <p className="text-slate-600 text-sm">
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
                <Link href={providerProfile ? getProviderProfileUrl(providerProfile) : `/p/${profile.id}`} className="block">
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
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {t('welcome', { name: profile.display_name })}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Find Specialists */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">{t('seeker.findSpecialists')}</h2>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Browse our directory of verified specialists ready to help you.
            </p>
            <Link href="/experts">
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
            <p className="text-slate-600 text-sm mb-4">Unread messages</p>
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
