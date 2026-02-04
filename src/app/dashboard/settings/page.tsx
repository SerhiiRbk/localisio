'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<'seeker' | 'provider'>('seeker');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setCurrentRole(profile.role);
        setAvatarUrl(profile.avatar_url);
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a JPEG, PNG, or WebP image' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 5MB' });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      setAvatarUrl(data.avatar_url + '?t=' + Date.now()); // Add timestamp to bust cache
      setMessage({ type: 'success', text: 'Avatar updated!' });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload avatar' });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const response = await fetch('/api/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove avatar');
      }

      setAvatarUrl(null);
      setMessage({ type: 'success', text: 'Avatar removed!' });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to remove avatar' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBecomeProvider = async () => {
    setIsChangingRole(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update role to provider
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create or update provider profile using upsert
      const { error: providerError } = await supabase
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
            ignoreDuplicates: true, // Don't update if exists, just skip
          }
        );

      if (providerError) {
        console.error('Provider profile error:', providerError);
        // Don't throw - profile might already exist with data
      }

      setMessage({ type: 'success', text: 'You are now a provider! Redirecting...' });
      
      setTimeout(() => {
        router.push('/dashboard/provider/profile');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to change role' });
      setIsChangingRole(false);
    }
  };

  const handleBecomeSeeker = async () => {
    setIsChangingRole(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update role to seeker
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'seeker' })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentRole('seeker');
      setMessage({ type: 'success', text: 'You are now a seeker!' });
      
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to change role' });
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validate passwords
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: t('password.mismatch') });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: t('password.tooShort') });
      return;
    }

    setIsChangingPassword(true);

    try {
      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setPasswordMessage({ type: 'error', text: t('password.error') });
        return;
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordMessage({ type: 'error', text: t('password.incorrectCurrent') });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('same')) {
          setPasswordMessage({ type: 'error', text: t('password.sameAsOld') });
        } else {
          setPasswordMessage({ type: 'error', text: t('password.error') });
        }
        return;
      }

      setPasswordMessage({ type: 'success', text: t('password.success') });
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error(error);
      setPasswordMessage({ type: 'error', text: t('password.error') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-40 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar Settings */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Profile Photo</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div 
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center cursor-pointer border-2 border-slate-200 hover:border-blue-400 transition-colors"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">
                    {displayName?.charAt(0)?.toUpperCase() || '👤'}
                  </span>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-3">
                Click the image to upload a new photo. JPEG, PNG, or WebP. Max 5MB.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  Upload Photo
                </Button>
                {avatarUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('profileInfo')}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label={t('displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button onClick={handleSaveProfile} isLoading={isSaving}>
              {t('saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('password.title')}</h2>
        </CardHeader>
        <CardContent>
          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label={t('password.current')}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Input
              label={t('password.new')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              label={t('password.confirm')}
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-slate-500">{t('password.requirements')}</p>
            <Button type="submit" isLoading={isChangingPassword}>
              {t('password.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Role Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Account Type</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl">
                {currentRole === 'seeker' ? '🔍' : '💼'}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  Current role: <span className="text-blue-600 capitalize">{currentRole}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {currentRole === 'seeker'
                    ? 'You can search for and contact specialists'
                    : 'You can offer your services and receive messages from clients'}
                </p>
              </div>
            </div>

            {currentRole === 'seeker' ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">💼</div>
                <h3 className="font-semibold text-slate-900 mb-2">Want to offer your services?</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  Become a provider to create your professional profile, list your services, and connect with clients.
                </p>
                <Button onClick={handleBecomeProvider} isLoading={isChangingRole}>
                  Become a Provider
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-slate-900 mb-2">Switch to Seeker?</h3>
                <p className="text-slate-600 mb-4 text-sm">
                  Your provider profile will be hidden but not deleted. You can switch back anytime.
                </p>
                <Button variant="outline" onClick={handleBecomeSeeker} isLoading={isChangingRole}>
                  Switch to Seeker
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
