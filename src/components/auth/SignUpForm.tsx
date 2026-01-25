'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

export function SignUpForm() {
  const t = useTranslations('auth.signUp');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'seeker' | 'provider'>('seeker');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

      if (data.user) {
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
          });
        }
      }

      if (devBypass || data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
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
          <h2 className="text-xl font-semibold mb-2">{t('confirmEmail')}</h2>
          <p className="text-gray-600 mb-4">{email}</p>
          <Link href="/auth/sign-in">
            <Button variant="outline">{t('signIn')}</Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('role')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('seeker')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  role === 'seeker'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-2xl mb-1">🔍</span>
                <span className="text-sm">{t('roleSeeker')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  role === 'provider'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-2xl mb-1">💼</span>
                <span className="text-sm">{t('roleProvider')}</span>
              </button>
            </div>
          </div>
          <Button type="submit" isLoading={isLoading} className="w-full">
            {t('submit')}
          </Button>
          <p className="text-center text-sm text-gray-600">
            {t('hasAccount')}{' '}
            <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
