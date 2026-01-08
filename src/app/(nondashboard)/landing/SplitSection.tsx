"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const SplitSection = () => {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* Left Column - Asset Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-2 border-blue-200 hover:shadow-2xl transition-shadow"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('landing.hero.assetManagement.title')}
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 font-semibold">
                {t('landing.hero.assetManagement.subtitle')}
              </p>
            </div>

            {/* Bullets */}
            <div className="space-y-4 mb-10 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet1')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet2')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet3')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet4')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet5')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet6')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.assetManagement.bullet7')}
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="text-center">
              <Button
                onClick={() => router.push('/AssetManagement')}
                size="lg"
                className="bg-secondary-500 text-white hover:bg-secondary-600 px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
              >
                {t('landing.hero.assetManagement.button')}
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Tokens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-2 border-purple-200 hover:shadow-2xl transition-shadow"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('landing.hero.tokenization.title')}
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 font-semibold">
                {t('landing.hero.tokenization.subtitle')}
              </p>
            </div>

            {/* Bullets */}
            <div className="space-y-4 mb-10 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.tokenization.bullet1')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.tokenization.bullet2')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.tokenization.bullet3')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-2xl flex-shrink-0 font-bold">•</span>
                <p className="text-gray-700 text-base md:text-lg">
                  {t('landing.hero.tokenization.bullet4')}
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="text-center">
              <Button
                onClick={() => router.push('/tokens')}
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700 px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
              >
                {t('landing.hero.tokenization.button')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SplitSection;
