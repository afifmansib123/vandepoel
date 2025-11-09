"use client";

import React from "react";
import { useTranslations } from "next-intl";
import FooterSection from "../landing/FooterSection";

const AboutPage = () => {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("about.title")}
          </h1>
          <p className="text-xl text-gray-600">{t("about.subtitle")}</p>
        </div>

        {/* Content */}
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-md mb-12">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t("about.description")}
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              {t("about.mission")}
            </p>
          </div>
        </div>

        {/* Value Propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4 text-center">🏠</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              For Landlords
            </h3>
            <p className="text-gray-600 text-center">
              Centralize property information and streamline administrative
              tasks with ease.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4 text-center">🤝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              For Agents
            </h3>
            <p className="text-gray-600 text-center">
              Connect with property owners and buyers while managing portfolios
              efficiently.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4 text-center">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              For Tenants
            </h3>
            <p className="text-gray-600 text-center">
              Ensure your rental is managed according to international standards
              with proper documentation.
            </p>
          </div>
        </div>

        {/* Core Features */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 md:p-12 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            360° Property Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Inspection Reports
                </h4>
                <p className="text-gray-700 text-sm">
                  Professional move-in and move-out documentation
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-3">📝</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Rental & Sales Agreements
                </h4>
                <p className="text-gray-700 text-sm">
                  Standardized contracts and documentation
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-3">🔧</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Maintenance Crew Details
                </h4>
                <p className="text-gray-700 text-sm">
                  Quick access to service providers and contractors
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-3">🚨</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Issue Escalation
                </h4>
                <p className="text-gray-700 text-sm">
                  Streamlined problem resolution and documentation
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-3">🪙</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Tokenization
                </h4>
                <p className="text-gray-700 text-sm">
                  Fractional ownership and investment opportunities
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">
                  Portfolio Tracking
                </h4>
                <p className="text-gray-700 text-sm">
                  Monitor and analyze your property investments
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default AboutPage;
