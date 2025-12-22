"use client";

import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    Coins, ShoppingCart, TrendingUp, Wallet, X,
    CheckCircle, AlertCircle, Building2
} from 'lucide-react';

interface TokenizedFeaturesWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TokenizedFeaturesWelcomeModal: React.FC<TokenizedFeaturesWelcomeModalProps> = ({
    isOpen,
    onClose
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-white to-blue-50">
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
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-xl">
                                <Coins className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-4xl font-bold mb-2">Welcome to AssetXToken!</h2>
                            <p className="text-xl text-blue-100">
                                Discover the Future of Real Estate Investment
                            </p>
                        </motion.div>
                    </div>

                    {/* Main Content */}
                    <div className="p-8 -mt-8">
                        {/* Key Feature Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        🎯 Tokenized Real Estate Made Simple
                                    </h3>
                                    <p className="text-gray-700 text-lg leading-relaxed">
                                        AssetXToken revolutionizes property investment by converting real estate into
                                        <strong className="text-blue-600"> digital tokens</strong>. This means you can own a
                                        <strong className="text-blue-600"> fraction of a property</strong> instead of buying the entire building!
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* For Buyers Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-purple-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Wallet className="w-8 h-8 text-purple-600" />
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Perfect for Buyers & Investors
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <p className="text-gray-700">
                                        <strong>Lower Entry Costs:</strong> Invest in premium properties without needing hundreds of thousands
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <p className="text-gray-700">
                                        <strong>Passive Income:</strong> Earn rental income proportional to your token ownership
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <p className="text-gray-700">
                                        <strong>Diversification:</strong> Build a portfolio across multiple properties instead of putting all your money in one
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <p className="text-gray-700">
                                        <strong>Liquidity:</strong> Trade your tokens on our aftermarket - no need to wait months to sell
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* How It Works */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                                How It Works (Simple 3-Step Process)
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Browse Tokenized Properties</p>
                                        <p className="text-gray-600 text-sm">Explore our marketplace and find properties you want to invest in</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Purchase Tokens</p>
                                        <p className="text-gray-600 text-sm">Buy as many or as few tokens as you want - start with any budget</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Earn & Trade</p>
                                        <p className="text-gray-600 text-sm">Receive rental income and trade tokens anytime on our marketplace</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Important Notice */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-200"
                        >
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0" />
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                        🚨 Important: Buyer Account Required
                                    </h4>
                                    <p className="text-gray-700">
                                        To participate in tokenized real estate and access all these amazing features, you
                                        <strong className="text-orange-600"> must create a Buyer Account</strong>. This special account type enables you to:
                                    </p>
                                    <ul className="mt-3 space-y-1 text-gray-700">
                                        <li>✅ Purchase property tokens</li>
                                        <li>✅ Receive rental income distributions</li>
                                        <li>✅ Trade on the aftermarket</li>
                                        <li>✅ Build and manage your token portfolio</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Button
                                onClick={onClose}
                                size="lg"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                <CheckCircle className="mr-2 w-5 h-5" />
                                Got It! Let's Explore
                            </Button>
                            <Button
                                onClick={() => {
                                    onClose();
                                    window.location.href = '/marketplace';
                                }}
                                size="lg"
                                variant="outline"
                                className="flex-1 border-2 border-purple-300 hover:border-purple-500 py-6 text-lg rounded-xl"
                            >
                                <TrendingUp className="mr-2 w-5 h-5" />
                                View Marketplace
                            </Button>
                        </motion.div>

                        {/* Footer Note */}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            You can access the full tutorial anytime from the navigation menu
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TokenizedFeaturesWelcomeModal;
