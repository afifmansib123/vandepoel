"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Building2, Coins, TrendingUp, Users, ArrowRight,
    Home, Wallet, ShoppingCart, DollarSign
} from 'lucide-react';
import AssetXTokenTutorialModal from "@/components/AssetXTokenTutorialModal";
import { useTranslations } from 'next-intl';

const TutorialSection = () => {
    const t = useTranslations();
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    const features = [
        {
            icon: Building2,
            titleKey: "landlords",
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-green-50",
            iconBg: "bg-green-100",
            iconColor: "text-green-600"
        },
        {
            icon: Wallet,
            titleKey: "buyers",
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600"
        },
        {
            icon: TrendingUp,
            titleKey: "b2bMarket",
            color: "from-orange-500 to-red-600",
            bgColor: "bg-orange-50",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600"
        }
    ];

    const steps = [
        {
            number: "1",
            icon: Home,
            stepKey: "step1"
        },
        {
            number: "2",
            icon: ShoppingCart,
            stepKey: "step2"
        },
        {
            number: "3",
            icon: DollarSign,
            stepKey: "step3"
        },
        {
            number: "4",
            icon: TrendingUp,
            stepKey: "step4"
        }
    ];

    return (
        <section className="relative py-20 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Coins className="w-4 h-4" />
                        {t('landing.tutorial.badge')}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {t('landing.tutorial.title')}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {t('landing.tutorial.subtitle')}
                    </p>
                </motion.div>

                {/* Main feature cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`${feature.bgColor} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300`}
                        >
                            <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{t(`landing.tutorial.${feature.titleKey}.title`)}</h3>
                            <p className="text-gray-600 leading-relaxed">{t(`landing.tutorial.${feature.titleKey}.description`)}</p>
                        </motion.div>
                    ))}
                </div>

                {/* How it works steps */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200"
                >
                    <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        {t('landing.tutorial.stepsTitle')}
                    </h3>

                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                            <step.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow">
                                            {step.number}
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{t(`landing.tutorial.${step.stepKey}.title`)}</h4>
                                    <p className="text-sm text-gray-600">{t(`landing.tutorial.${step.stepKey}.description`)}</p>
                                </div>

                                {/* Arrow between steps */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-8 left-full w-full">
                                        <ArrowRight className="w-6 h-6 text-gray-300 mx-auto" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Important notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mt-12 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {t('landing.tutorial.notice.title')}
                            </h4>
                            <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: t('landing.tutorial.notice.description') }} />
                        </div>
                    </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mt-12 text-center"
                >
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={() => setIsTutorialOpen(true)}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <Coins className="mr-2 w-5 h-5" />
                            {t('landing.tutorial.viewTutorialButton')}
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/marketplace'}
                            size="lg"
                            variant="outline"
                            className="border-2 border-gray-300 hover:border-secondary-500 px-8 py-6 text-lg rounded-xl"
                        >
                            {t('landing.tutorial.exploreMarketplaceButton')}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        {t('landing.tutorial.footerText')}
                    </p>
                </motion.div>
            </div>

            {/* Tutorial Modal */}
            <AssetXTokenTutorialModal
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />
        </section>
    );
};

export default TutorialSection;
