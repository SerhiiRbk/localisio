import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Admin Panel',
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check admin role
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) {
    redirect('/dashboard');
  }

  const t = await getTranslations('admin');

  // Get some stats
  const { count: totalProviders } = await supabase
    .from('provider_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: verifiedProviders } = await supabase
    .from('provider_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  const { count: featuredProviders } = await supabase
    .from('provider_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('featured', true);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{totalProviders || 0}</div>
            <p className="text-gray-600">Total Providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{verifiedProviders || 0}</div>
            <p className="text-gray-600">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">{featuredProviders || 0}</div>
            <p className="text-gray-600">Featured</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">{t('providers.title')}</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Manage provider verification, featured status, and priority scores.
          </p>
          <Link href="/admin/providers">
            <Button>Manage Providers</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
