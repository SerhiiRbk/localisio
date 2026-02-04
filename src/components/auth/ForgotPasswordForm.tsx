'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const tErrors = useTranslations('auth.errors');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(tErrors('generic'));
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('successTitle')}</h2>
          <p className="text-slate-600 mb-2">{t('successMessage')}</p>
          <p className="text-slate-900 font-medium mb-4">{email}</p>
          <p className="text-sm text-slate-500 mb-6">{t('successHint')}</p>
          <Link href="/auth/sign-in">
            <Button variant="outline" className="w-full">
              {t('backToSignIn')}
            </Button>
          </Link>
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
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('submit')}
          </Button>
          <p className="text-center text-sm text-gray-600">
            {t('rememberPassword')}{' '}
            <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
