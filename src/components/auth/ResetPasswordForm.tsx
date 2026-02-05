'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Use onAuthStateChange to detect when session becomes available
    // This is necessary because Supabase needs time to process auth tokens
    // from the URL hash/fragment (which aren't sent to the server).
    // Calling getSession() immediately would return null before token processing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY event fires when the reset link tokens are processed
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsValidSession(!!session);
      } else if (event === 'INITIAL_SESSION') {
        // INITIAL_SESSION fires after Supabase processes URL tokens
        // If there's no session at this point, the link is invalid/expired
        setIsValidSession(!!session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        if (updateError.message.includes('same')) {
          setError(t('samePassword'));
        } else {
          setError(tErrors('generic'));
        }
        return;
      }

      setIsSuccess(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 3000);
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">{t('loading')}</p>
        </CardContent>
      </Card>
    );
  }

  // Show error if no valid session
  if (!isValidSession) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-700">{t('invalidLinkTitle')}</h2>
          <p className="text-slate-600 mb-6">{t('invalidLinkMessage')}</p>
          <Link href="/auth/forgot-password">
            <Button className="w-full">{t('requestNewLink')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('successTitle')}</h2>
          <p className="text-slate-600 mb-4">{t('successMessage')}</p>
          <p className="text-sm text-slate-500">{t('redirecting')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h1 className="text-2xl font-bold text-center">{t('title')}</h1>
        <p className="text-center text-gray-600">{t('subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <Input
            label={t('newPassword')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            label={t('confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500">{t('passwordRequirements')}</p>
          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
