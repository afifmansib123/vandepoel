"use client";

import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { X } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface TokenizedFeaturesWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TokenizedFeaturesWelcomeModal: React.FC<TokenizedFeaturesWelcomeModalProps> = ({
    isOpen,
    onClose
}) => {
    const router = useRouter();
    const t = useTranslations();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-white to-gray-50">
                <div className="relative">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 pb-12">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <h2 className="text-4xl font-bold mb-2">Welcome to AssetXToken!</h2>
                            <p className="text-xl text-blue-100">
                                Your Complete Property Management & Investment Platform
                            </p>
                        </motion.div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="p-8 -mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Left Column - Asset Management */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                        {t('landing.hero.assetManagement.title')}
                                    </h2>
                                    <p className="text-xl text-gray-700 font-semibold">
                                        {t('landing.hero.assetManagement.subtitle')}
                                    </p>
                                </div>

                                {/* Bullets */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.assetManagement.bullet1')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.assetManagement.bullet2')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.assetManagement.bullet3')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.assetManagement.bullet4')}
                                        </p>
                                    </div>
                                </div>

                                {/* Button */}
                                <div className="text-center">
                                    <Button
                                        onClick={() => {
                                            onClose();
                                            router.push('/marketplace');
                                        }}
                                        size="lg"
                                        className="bg-secondary-500 text-white hover:bg-secondary-600 px-8 py-6 text-lg rounded-xl shadow-lg w-full"
                                    >
                                        {t('landing.hero.assetManagement.button')}
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Right Column - Tokens */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                        {t('landing.hero.tokenization.title')}
                                    </h2>
                                    <p className="text-xl text-gray-700 font-semibold">
                                        {t('landing.hero.tokenization.subtitle')}
                                    </p>
                                </div>

                                {/* Bullets */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.tokenization.bullet1')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.tokenization.bullet2')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.tokenization.bullet3')}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-purple-600 text-xl flex-shrink-0">•</span>
                                        <p className="text-gray-700 text-base">
                                            {t('landing.hero.tokenization.bullet4')}
                                        </p>
                                    </div>
                                </div>

                                {/* Button */}
                                <div className="text-center">
                                    <Button
                                        onClick={() => {
                                            onClose();
                                            router.push('/token-marketplace');
                                        }}
                                        size="lg"
                                        className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-6 text-lg rounded-xl shadow-lg w-full"
                                    >
                                        {t('landing.hero.tokenization.button')}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer Note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-sm text-gray-500 mt-6"
                        >
                            You can access the full tutorial anytime from the navigation menu
                        </motion.p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TokenizedFeaturesWelcomeModal;
