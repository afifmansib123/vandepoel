"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, FileText, Users, Calendar, Wrench, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "../landing/FooterSection";

const AssetManagementPage = () => {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-6">
              {t('landing.hero.assetManagement.title')}
            </h1>
            <p className="text-2xl mb-8 text-blue-100">
              {t('landing.hero.assetManagement.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* About Us Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold text-center mb-8 text-gray-900">
              {t('landing.discover.title')}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center max-w-4xl mx-auto">
              {t('landing.discover.description')}
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
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600"
            >
              <div className="flex items-start gap-4">
                <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.assetManagement.bullet1')}
                  </h3>
                  <p className="text-gray-700">
                    Keep all your rental contracts in one centralized location. Easy access, better organization, complete control.
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
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600"
            >
              <div className="flex items-start gap-4">
                <Wrench className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.assetManagement.bullet2')}
                  </h3>
                  <p className="text-gray-700">
                    Streamlined maintenance request and issue escalation system. Track, manage, and resolve property issues efficiently.
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
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600"
            >
              <div className="flex items-start gap-4">
                <Calendar className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.assetManagement.bullet3')}
                  </h3>
                  <p className="text-gray-700">
                    Complete workflow from scheduling property visits to finalizing contracts. Everything you need in one place.
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
              className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600"
            >
              <div className="flex items-start gap-4">
                <MapPin className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('landing.hero.assetManagement.bullet4')}
                  </h3>
                  <p className="text-gray-700">
                    Access exclusive off-market properties and opportunities. Connect directly with landlords and agents.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Asset Management Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-10 mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {t('about.title')}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {t('about.subtitle')}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t('about.description')}
            </p>
            <div className="mt-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('about.mission')}
              </p>
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
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Explore our marketplace and discover properties for rent or sale
            </p>
            <Button
              onClick={() => router.push('/marketplace')}
              size="lg"
              className="bg-secondary-500 text-white hover:bg-secondary-600 px-12 py-6 text-xl rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Browse Properties
            </Button>
          </motion.div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default AssetManagementPage;
