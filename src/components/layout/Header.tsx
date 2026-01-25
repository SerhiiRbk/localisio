'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import type { Profile } from '@/types/database';
import { useState } from 'react';

interface HeaderProps {
  user: Profile | null;
  isAdmin?: boolean;
}

export function Header({ user, isAdmin }: HeaderProps) {
  const t = useTranslations('nav');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">Localisio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              {t('search')}
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  {t('dashboard')}
                </Link>
                <Link href="/dashboard/messages" className="text-gray-600 hover:text-gray-900">
                  {t('messages')}
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                    {t('admin')}
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <Link href="/dashboard">
                    <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />
                  </Link>
                  <form action="/api/auth/sign-out" method="POST">
                    <Button variant="ghost" size="sm" type="submit">
                      {t('signOut')}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/sign-in">
                  <Button variant="ghost" size="sm">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">{t('signUp')}</Button>
                </Link>
              </div>
            )}
            <LanguageSwitcher />
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link href="/search" className="text-gray-600 hover:text-gray-900">
                {t('search')}
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                    {t('dashboard')}
                  </Link>
                  <Link href="/dashboard/messages" className="text-gray-600 hover:text-gray-900">
                    {t('messages')}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                      {t('admin')}
                    </Link>
                  )}
                  <form action="/api/auth/sign-out" method="POST">
                    <Button variant="ghost" size="sm" type="submit" className="w-full justify-start">
                      {t('signOut')}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-in" className="text-gray-600 hover:text-gray-900">
                    {t('signIn')}
                  </Link>
                  <Link href="/auth/sign-up" className="text-gray-600 hover:text-gray-900">
                    {t('signUp')}
                  </Link>
                </>
              )}
              <LanguageSwitcher />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
