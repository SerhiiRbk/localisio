import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">Localisio</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600 text-sm">{t('tagline')}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/search" className="hover:text-gray-900">
              Find Specialists
            </Link>
            <Link href="/auth/sign-up" className="hover:text-gray-900">
              Become a Provider
            </Link>
          </nav>
          <p className="text-sm text-gray-500">
            {t('copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
