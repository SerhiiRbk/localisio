'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { getProviderProfileUrl } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { useState, useRef, useEffect, useCallback } from 'react';

interface HeaderProps {
  user: Profile | null;
  isAdmin?: boolean;
}

export function Header({ user, isAdmin }: HeaderProps) {
  const t = useTranslations('nav');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [providerProfileUrl, setProviderProfileUrl] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    const supabase = createClient();
    
    // Get conversations where user is participant
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`);
    
    if (!conversations || conversations.length === 0) {
      setUnreadCount(0);
      return;
    }
    
    const conversationIds = conversations.map(c => c.id);
    
    // Count unread messages in those conversations
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .is('read_at', null);
    
    setUnreadCount(count || 0);
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch provider profile URL for "View Public Profile" link
  useEffect(() => {
    if (!user || user.role !== 'provider') {
      setProviderProfileUrl(null);
      return;
    }
    
    const fetchProviderProfile = async () => {
      const supabase = createClient();
      const { data: providerProfile } = await supabase
        .from('provider_profiles')
        .select('user_id, slug, country_code')
        .eq('user_id', user.id)
        .single();
      
      if (providerProfile) {
        setProviderProfileUrl(getProviderProfileUrl(providerProfile));
      } else {
        setProviderProfileUrl(`/p/${user.id}`);
      }
    };
    
    fetchProviderProfile();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">Localisio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/experts" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              {t('findExpert')}
            </Link>
            {user?.role === 'provider' ? (
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                {t('dashboard')}
              </Link>
            ) : (
              <Link href="/#for-professionals" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                {t('forProfessionals')}
              </Link>
            )}
            <Link href="/services" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              {t('services')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href="/admin" className="text-slate-600 hover:text-slate-900 font-medium">
                    {t('admin')}
                  </Link>
                )}
                <Link href="/dashboard/messages" className="relative text-slate-500 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-medium text-slate-900 truncate">{user.display_name}</p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>
                        
                        {user.role === 'provider' && (
                          <>
                            <Link
                              href="/dashboard/provider/profile"
                              className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Edit Profile
                            </Link>
                            <Link
                              href={providerProfileUrl || `/p/${user.id}`}
                              className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Public Profile
                            </Link>
                          </>
                        )}
                        
                        <Link
                          href="/dashboard/messages"
                          className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="flex items-center gap-3">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Messages
                          </span>
                          {unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                        
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-1">
                        <form action="/api/auth/sign-out" method="POST">
                          <button
                            type="submit"
                            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
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
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-2">
              <Link href="/experts" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                {t('findExpert')}
              </Link>
              {user?.role === 'provider' ? (
                <Link href="/dashboard" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                  {t('dashboard')}
                </Link>
              ) : (
                <Link href="/#for-professionals" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                  {t('forProfessionals')}
                </Link>
              )}
              <Link href="/services" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                {t('services')}
              </Link>
              <hr className="my-2 border-slate-200" />
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="font-medium text-slate-900">{user.display_name}</p>
                    <span className="text-sm text-slate-500 capitalize">{user.role}</span>
                  </div>
                  <Link href="/dashboard" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    {t('dashboard')}
                  </Link>
                  {user.role === 'provider' && (
                    <Link href="/dashboard/provider/profile" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                      {t('editProfile')}
                    </Link>
                  )}
                  <Link href="/dashboard/messages" className="flex items-center justify-between px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    <span>{t('messages')}</span>
                    {unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/dashboard/settings" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    {t('settings')}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                      {t('admin')}
                    </Link>
                  )}
                  <form action="/api/auth/sign-out" method="POST" className="mt-2">
                    <Button variant="outline" size="sm" type="submit" className="w-full">
                      {t('signOut')}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-in" className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    {t('signIn')}
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="w-full">{t('signUp')}</Button>
                  </Link>
                </>
              )}
              <div className="mt-2">
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
