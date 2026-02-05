'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { GoogleAuthButton } from './GoogleAuthButton';

export function SignInForm() {
  const t = useTranslations('auth.signIn');
  const tAuth = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(tErrors('invalidCredentials'));
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError(tErrors('generic'));
    } finally {
      setIsLoading(false);
    }
  };

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
          />
          <Input
            label={t('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <Button type="submit" isLoading={isLoading} className="w-full">
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

          <GoogleAuthButton mode="sign-in" />

          <p className="text-center text-sm text-gray-600">
            {t('noAccount')}{' '}
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
