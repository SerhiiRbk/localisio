// ============================================================
// i18n Request Configuration for next-intl
// ============================================================

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, isValidLocale, getLocaleFromHeader, type Locale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  
  let locale: Locale = defaultLocale;
  
  if (localeCookie && isValidLocale(localeCookie)) {
    locale = localeCookie;
  } else {
    // Fall back to Accept-Language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    locale = getLocaleFromHeader(acceptLanguage);
  }
  
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
