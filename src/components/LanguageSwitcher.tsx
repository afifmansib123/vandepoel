"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { locales, localeNames, defaultLocale, type Locale } from '@/lib/i18n-config';

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    }
  }, []);

  const changeLanguage = (locale: Locale) => {
    localStorage.setItem('locale', locale);
    setCurrentLocale(locale);
    // Trigger a custom event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'locale',
      newValue: locale,
    }));
    // Reload to apply new translations
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none text-primary-200 hover:text-primary-400 transition-colors">
        <Globe className="w-5 h-5" />
        <span className="hidden md:block text-sm">{localeNames[currentLocale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white text-primary-700">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            className={`cursor-pointer hover:!bg-primary-700 hover:!text-primary-100 ${
              currentLocale === locale ? 'bg-primary-100 font-bold' : ''
            }`}
            onClick={() => changeLanguage(locale)}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
