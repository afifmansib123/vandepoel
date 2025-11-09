"use client";

import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { useTranslations } from "next-intl";

const FooterSection = () => {
  const t = useTranslations();

  return (
    <footer className="border-t border-gray-200 py-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4">
            <Link href="/" className="text-xl font-bold" scroll={false}>
              AssetXToken
            </Link>
          </div>
          <nav className="mb-4">
            <ul className="flex space-x-6">
              <li>
                <Link href="/about">{t('landing.footer.aboutUs')}</Link>
              </li>
              <li>
                <Link href="/contact">{t('landing.footer.contactUs')}</Link>
              </li>
              <li>
                <Link href="/collab">{t('landing.footer.collab')}</Link>
              </li>
              <li>
                <Link href="/faq">{t('landing.footer.faq')}</Link>
              </li>
              <li>
                <a href="/documents/terms.pdf" target="_blank" rel="noopener noreferrer">{t('landing.footer.terms')}</a>
              </li>
              <li>
                <a href="/documents/privacy.pdf" target="_blank" rel="noopener noreferrer">{t('landing.footer.privacy')}</a>
              </li>
            </ul>
          </nav>
          <div className="flex space-x-4 mb-4">
            <a
              href="#"
              aria-label="Facebook"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-primary-600">
              <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
            </a>
            <a
              href="#"
              aria-label="Linkedin"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Youtube" className="hover:text-primary-600">
              <FontAwesomeIcon icon={faYoutube} className="h-6 w-6" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500 flex justify-center space-x-4">
          <span>{t('landing.footer.copyright')}</span>
          <a href="/documents/privacy.pdf" target="_blank" rel="noopener noreferrer">{t('landing.footer.privacyPolicy')}</a>
          <a href="/documents/terms.pdf" target="_blank" rel="noopener noreferrer">{t('landing.footer.termsOfService')}</a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
