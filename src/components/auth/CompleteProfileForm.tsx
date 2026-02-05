'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

export function CompleteProfileForm() {
  const t = useTranslations('auth.completeProfile');
  const router = useRouter();

  const [role, setRole] = useState<'seeker' | 'provider'>('seeker');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and needs to complete profile
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      // Check if user already has a role set
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If profile exists with role, redirect to dashboard
      if (profile?.role) {
        router.push('/dashboard');
        return;
      }

      // Check localStorage for OAuth role preference
      const savedRole = localStorage.getItem('oauth_signup_role');
      if (savedRole === 'seeker' || savedRole === 'provider') {
        setRole(savedRole);
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      // Update profile with selected role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (updateError) {
        setError('Failed to update profile. Please try again.');
        return;
      }

      // If provider role, create provider profile
      if (role === 'provider') {
        await supabase
          .from('provider_profiles')
          .upsert(
            {
              user_id: user.id,
              headline: '',
              bio: '',
              services: [],
              languages: [],
              experience_years: 0,
              country_code: '',
              city: '',
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: true,
            }
          );
      }

      // Clear localStorage
      localStorage.removeItem('oauth_signup_role');

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">{t('loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">{t('title')}</h1>
        <p className="text-center text-slate-600">{t('subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">{t('roleQuestion')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === 'seeker'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block text-2xl mb-1">🔍</span>
                <span className="text-sm font-medium">{t('roleSeeker')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  role === 'provider'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block text-2xl mb-1">💼</span>
                <span className="text-sm font-medium">{t('roleProvider')}</span>
              </button>
            </div>
          </div>

          {/* Provider promotional tip */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-medium text-blue-700">💡 {t('tipTitle')}</span>{' '}
              {t('tipText')}
            </p>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
