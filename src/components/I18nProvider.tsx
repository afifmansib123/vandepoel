"use client";

import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';
import { defaultLocale, type Locale } from '@/lib/i18n-config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    // Load locale from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    const initialLocale = savedLocale || defaultLocale;

    // Load messages
    import(`../../messages/${initialLocale}.json`).then((msgs) => {
      setMessages(msgs.default);
      setLocale(initialLocale);
    });

    // Listen for locale changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'locale' && e.newValue) {
        const newLocale = e.newValue as Locale;
        import(`../../messages/${newLocale}.json`).then((msgs) => {
          setMessages(msgs.default);
          setLocale(newLocale);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!messages) {
    return <>{children}</>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
