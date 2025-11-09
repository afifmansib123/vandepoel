"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import FooterSection from "../landing/FooterSection";

const CollabPage = () => {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("collab.title")}
          </h1>
          <p className="text-xl text-gray-600">{t("collab.subtitle")}</p>
        </div>

        {/* Content */}
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-md">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t("collab.intro")}
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              {t("collab.callToAction")}
            </p>

            <div className="text-center mt-10">
              <Link
                href="/contact"
                className="inline-block bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition text-lg font-semibold"
              >
                {t("collab.contactButton")}
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Global Expansion
            </h3>
            <p className="text-gray-600">
              Expand our platform to new countries and regions
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Partnership Opportunities
            </h3>
            <p className="text-gray-600">
              Work together to enhance features and services
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Innovation
            </h3>
            <p className="text-gray-600">
              Continuous improvement and innovation in property management
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default CollabPage;
