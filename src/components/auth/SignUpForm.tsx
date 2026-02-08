'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton } from './GoogleAuthButton';

export function SignUpForm() {
  const t = useTranslations('auth.signUp');
  const tAuth = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'seeker' | 'provider'>('seeker');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const supabase = createClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (resendError) {
        setError(tErrors('generic'));
      } else {
        setResendSuccess(true);
        // Start cooldown (60 seconds)
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Sign up with user metadata (profile will be created in callback)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
          },
          emailRedirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError(tErrors('emailInUse'));
        } else {
          setError(tErrors('generic'));
        }
        return;
      }

      // Only create profile if we have an active session (email confirmation disabled)
      if (data.session && data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          role,
          display_name: displayName,
          email,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Create provider profile if provider
        if (role === 'provider') {
          await supabase.from('provider_profiles').insert({
            user_id: data.user.id,
            headline: '',
            bio: '',
            services: [],
            languages: [],
            experience_years: 0,
            country_code: '',
            city: '',
          });
        }

        router.push(role === 'provider' ? '/dashboard/provider/profile' : '/dashboard');
        router.refresh();
      } else if (devBypass && data.user) {
        // Dev bypass mode - also try to create profile
        router.push(role === 'provider' ? '/dashboard/provider/profile' : '/dashboard');
        router.refresh();
      } else {
        // Email confirmation required - show confirmation message
        // Profile will be created in /auth/callback after email confirmation
        setShowConfirmation(true);
      }
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('confirmEmailTitle')}</h2>
          <p className="text-slate-600 mb-2">{t('confirmEmailSent')}</p>
          <p className="text-slate-900 font-medium mb-4">{email}</p>
          <p className="text-sm text-slate-500 mb-6">{t('confirmEmailHint')}</p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm mb-4">{error}</div>
          )}

          {resendSuccess && (
            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm mb-4">
              {t('resendSuccess')}
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {isResending ? (
                t('resending')
              ) : resendCooldown > 0 ? (
                t('resendCooldown', { seconds: resendCooldown })
              ) : (
                t('resendEmail')
              )}
            </Button>
            <Link href="/auth/sign-in" className="block">
              <Button variant="ghost" className="w-full">
                {t('backToSignIn')}
              </Button>
            </Link>
          </div>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <Input
            label={t('displayName')}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('role')}</label>
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
            {/* Provider promotional tip */}
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-medium text-blue-700">💡 {t('providerTipTitle')}</span>{' '}
                {t('providerTipText')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-slate-600">
              {t('agreeToTerms')}{' '}
              <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                {t('termsAndConditions')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                {t('privacyPolicy')}
              </Link>
            </label>
          </div>
          <Button type="submit" isLoading={isLoading} disabled={!termsAccepted} className="w-full">
            {t('submit')}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{tAuth('orContinueWith')}</span>
            </div>
          </div>

          <GoogleAuthButton mode="sign-up" role={role} disabled={!termsAccepted} />

          <p className="text-center text-sm text-slate-600">
            {t('hasAccount')}{' '}
            <Link href="/auth/sign-in" className="text-blue-600 hover:underline font-medium">
              {t('signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
