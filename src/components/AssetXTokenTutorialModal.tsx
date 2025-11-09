"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Coins, Users, TrendingUp, ShoppingCart,
    ArrowRight, X, CheckCircle, Home, Wallet
} from 'lucide-react';

interface AssetXTokenTutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AssetXTokenTutorialModal: React.FC<AssetXTokenTutorialModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const tutorialSteps = [
        {
            title: "Welcome to AssetXToken",
            subtitle: "Revolutionizing Real Estate Investment",
            icon: Building2,
            color: "from-blue-500 to-blue-600",
            content: (
                <div className="space-y-4">
                    <p className="text-gray-700 text-lg leading-relaxed">
                        AssetXToken is a <strong>tokenized real estate marketplace</strong> where property ownership becomes as simple as buying shares in a company.
                    </p>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-gray-800 font-medium">
                            🎯 Instead of buying entire properties, you can now purchase <strong>tokens</strong> representing fractional ownership.
                        </p>
                    </div>
                    <p className="text-gray-600">
                        Whether you're a landlord looking to raise capital, or an investor seeking diversification, AssetXToken connects you to the future of real estate.
                    </p>
                </div>
            )
        },
        {
            title: "For Landlords",
            subtitle: "Tokenize Your Properties & Raise Capital",
            icon: Home,
            color: "from-green-500 to-emerald-600",
            content: (
                <div className="space-y-4">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">How It Works for Landlords:</h3>
                                <ol className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                        <span><strong>List Your Property:</strong> Add your property to our marketplace with detailed information.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                        <span><strong>Tokenize It:</strong> Create digital tokens representing ownership shares of your property.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                        <span><strong>Set Your Terms:</strong> Define token price, quantity, and revenue-sharing structure.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                        <span><strong>Raise Capital:</strong> Investors buy your tokens, giving you immediate capital while they earn from rental income!</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-700">
                            💡 <strong>Pro Tip:</strong> You maintain control while raising funds without traditional bank loans!
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "For Buyers & Investors",
            subtitle: "Buy Property Tokens & Build Your Portfolio",
            icon: Wallet,
            color: "from-purple-500 to-purple-600",
            content: (
                <div className="space-y-4">
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                <Coins className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">How To Get Started:</h3>
                                <ol className="space-y-3 text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                        <span><strong className="text-purple-700">Create a Buyer Account:</strong> This is <u>required</u> to participate in the tokenized market.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                        <span><strong>Browse Token Offerings:</strong> Explore tokenized properties in our Token Marketplace.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                        <span><strong>Purchase Tokens:</strong> Buy as many tokens as you want - start small or go big!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                        <span><strong>Earn Passive Income:</strong> Receive your share of rental income based on your token ownership.</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Important: You must have a <strong>Buyer Account</strong> to work in the tokenized market!
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "The B2B Token Market",
            subtitle: "Resell & Trade Your Tokens",
            icon: TrendingUp,
            color: "from-orange-500 to-red-600",
            content: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Secondary Token Market:</h3>
                                <div className="space-y-3 text-gray-700">
                                    <p>
                                        <strong>Liquidity Matters!</strong> Unlike traditional real estate where you're locked in, AssetXToken allows you to:
                                    </p>
                                    <ul className="space-y-2 ml-4">
                                        <li className="flex items-start gap-2">
                                            <ShoppingCart className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <span><strong>List Your Tokens for Sale:</strong> Put your tokens on the B2B marketplace anytime.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <span><strong>Buy from Other Investors:</strong> Purchase tokens from sellers looking to exit.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <span><strong>Price Discovery:</strong> Market forces determine fair value, potentially allowing for capital gains.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-300">
                        <p className="text-sm text-gray-800">
                            🚀 <strong>This is revolutionary!</strong> Real estate investment with stock market-like liquidity.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Get Started Today!",
            subtitle: "Join the Future of Real Estate",
            icon: CheckCircle,
            color: "from-blue-500 to-purple-600",
            content: (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're Ready!</h3>
                        <p className="text-gray-600">Here's a quick recap:</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-gray-900">Landlords</h4>
                            </div>
                            <p className="text-sm text-gray-600">Tokenize properties, raise capital, maintain control</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-purple-600" />
                                </div>
                                <h4 className="font-bold text-gray-900">Buyers</h4>
                            </div>
                            <p className="text-sm text-gray-600">Buy tokens, earn rental income, build portfolio</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-orange-400 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                </div>
                                <h4 className="font-bold text-gray-900">B2B Market</h4>
                            </div>
                            <p className="text-sm text-gray-600">Trade tokens freely with other investors</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-green-400 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-green-600" />
                                </div>
                                <h4 className="font-bold text-gray-900">Tenants & Agents</h4>
                            </div>
                            <p className="text-sm text-gray-600">Traditional rental services still available</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-secondary-500 to-red-600 text-white p-6 rounded-xl text-center">
                        <p className="text-lg font-semibold mb-2">Ready to start?</p>
                        <p className="text-sm opacity-90">Explore the marketplace or create your account to begin investing!</p>
                    </div>
                </div>
            )
        }
    ];

    const currentStepData = tutorialSteps[currentStep];
    const IconComponent = currentStepData.icon;

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setCurrentStep(0);
        localStorage.setItem('assetxtoken_tutorial_seen', 'true');
        onClose();
    };

    const handleSkip = () => {
        handleClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] bg-white rounded-xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${currentStepData.color} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
                        }} />
                    </div>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                            <p className="text-white/90 text-sm mt-1">{currentStepData.subtitle}</p>
                        </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-4 flex gap-2">
                        {tutorialSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStepData.content}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 p-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Step {currentStep + 1} of {tutorialSteps.length}
                    </div>
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                onClick={handlePrevious}
                                variant="outline"
                                className="border-gray-300"
                            >
                                Previous
                            </Button>
                        )}
                        <Button
                            onClick={handleSkip}
                            variant="ghost"
                            className="text-gray-600"
                        >
                            Skip Tutorial
                        </Button>
                        <Button
                            onClick={handleNext}
                            className={`bg-gradient-to-r ${currentStepData.color} text-white hover:opacity-90`}
                        >
                            {currentStep < tutorialSteps.length - 1 ? (
                                <>
                                    Next <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Get Started <CheckCircle className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssetXTokenTutorialModal;
