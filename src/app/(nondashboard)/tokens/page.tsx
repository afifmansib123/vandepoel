"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Coins, TrendingUp, DollarSign, Repeat, CheckCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "../landing/FooterSection";

const TokensPage = () => {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
              <Coins className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              {t('landing.hero.tokenization.title')}
            </h1>
            <p className="text-2xl mb-8 text-purple-100">
              {t('landing.hero.tokenization.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Tutorial Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              {t('landing.tutorial.badge')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.tutorial.title')}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t('landing.tutorial.subtitle')}
            </p>
          </motion.div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-600"
            >
              <div className="flex items-start gap-4">
                <Coins className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.tokenization.bullet1')}
                  </h3>
                  <p className="text-gray-700">
                    Own a piece of premium properties without the need for large capital investment. Start small and build your portfolio.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-600"
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.tokenization.bullet2')}
                  </h3>
                  <p className="text-gray-700">
                    Each token comes with clear, defined participation rights. Know exactly what you own and what benefits you receive.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-600"
            >
              <div className="flex items-start gap-4">
                <DollarSign className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.tokenization.bullet3')}
                  </h3>
                  <p className="text-gray-700">
                    Receive rental income automatically based on your token holdings. Exit proceeds are distributed proportionally.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-600"
            >
              <div className="flex items-start gap-4">
                <Repeat className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.tokenization.bullet4')}
                  </h3>
                  <p className="text-gray-700">
                    Trade your tokens on our aftermarket platform. Enjoy liquidity that traditional real estate cannot offer.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-10 mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('landing.tutorial.stepsTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('landing.tutorial.step1.title')}
                </h3>
                <p className="text-gray-700">
                  {t('landing.tutorial.step1.description')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('landing.tutorial.step2.title')}
                </h3>
                <p className="text-gray-700">
                  {t('landing.tutorial.step2.description')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('landing.tutorial.step3.title')}
                </h3>
                <p className="text-gray-700">
                  {t('landing.tutorial.step3.description')}
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('landing.tutorial.step4.title')}
                </h3>
                <p className="text-gray-700">
                  {t('landing.tutorial.step4.description')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 mb-16 border-2 border-orange-200"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-10 h-10 text-orange-600 flex-shrink-0" />
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('landing.tutorial.notice.title')}
                </h4>
                <p className="text-lg text-gray-700 mb-4">
                  {t('landing.tutorial.notice.description')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Start Investing?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Browse our token marketplace and discover investment opportunities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/token-marketplace')}
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700 px-12 py-6 text-xl rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <TrendingUp className="mr-2 w-6 h-6" />
                Explore Token Marketplace
              </Button>
              <Button
                onClick={() => router.push('/marketplace')}
                size="lg"
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-12 py-6 text-xl rounded-xl"
              >
                Browse All Properties
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              {t('landing.tutorial.footerText')}
            </p>
          </motion.div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default TokensPage;
