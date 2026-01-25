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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Localisio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/search" className="text-gray-600 hover:text-gray-900 font-medium">
              Find an Expert
            </Link>
            <Link href="/auth/sign-up?role=provider" className="text-gray-600 hover:text-gray-900 font-medium">
              For Professionals
            </Link>
            <Link href="/#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
              How It Works
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                    {t('admin')}
                  </Link>
                )}
                <Link href="/dashboard/messages" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </Link>
                <Link href="/dashboard">
                  <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />
                </Link>
                <form action="/api/auth/sign-out" method="POST">
                  <Button variant="ghost" size="sm" type="submit">
                    {t('signOut')}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

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
              <Link href="/search" className="text-gray-600 hover:text-gray-900 font-medium">
                Find an Expert
              </Link>
              <Link href="/auth/sign-up?role=provider" className="text-gray-600 hover:text-gray-900 font-medium">
                For Professionals
              </Link>
              <Link href="/#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
                How It Works
              </Link>
              <hr className="border-gray-200" />
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
                    Sign In
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="w-full">Sign Up</Button>
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
