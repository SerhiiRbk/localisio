import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ActivityTracker } from '@/components/ActivityTracker';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Localisio - Find Local Specialists Who Speak Your Language',
    template: '%s | Localisio',
  },
  description:
    'Connect with verified professionals in your new country - lawyers, doctors, accountants, and more who understand expat needs.',
  keywords: ['expat services', 'local specialists', 'immigration', 'relocation', 'professional services'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Localisio',
    title: 'Localisio - Find Local Specialists Who Speak Your Language',
    description:
      'Connect with verified professionals in your new country - lawyers, doctors, accountants, and more who understand expat needs.',
    images: [
      {
        url: 'https://localisio.com/og_en.jpg',
        width: 1536,
        height: 1024,
        alt: 'Localisio - Find Local Specialists Who Speak Your Language',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Localisio - Find Local Specialists Who Speak Your Language',
    description:
      'Connect with verified professionals in your new country - lawyers, doctors, accountants, and more who understand expat needs.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Get user data
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let isAdmin = false;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    isAdmin = !!adminRole;
  }

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-07VR46HXGL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-07VR46HXGL');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col bg-white font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {profile && <ActivityTracker />}
          <Header user={profile} isAdmin={isAdmin} />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
