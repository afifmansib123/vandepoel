"use client";

import React, { useState, useEffect } from "react";
import { X, Coins, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchaseTokensMutation } from "@/state/api";
import { useGetAuthUserQuery } from "@/state/api";

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  offering: {
    _id: string;
    tokenName: string;
    tokenSymbol: string;
    tokenPrice: number;
    tokensAvailable: number;
    minPurchase: number;
    maxPurchase?: number;
    propertyValue: number;
  };
  onSuccess: () => void;
}

const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  offering,
  onSuccess,
}) => {
  const { data: authUser } = useGetAuthUserQuery();
  const [purchaseTokens, { isLoading }] = usePurchaseTokensMutation();

  const [tokensQuantity, setTokensQuantity] = useState(offering.minPurchase);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Input, 2: Confirm, 3: Success

  const totalCost = tokensQuantity * offering.tokenPrice;
  const ownershipPercentage = ((tokensQuantity / (offering.tokensAvailable + tokensQuantity)) * 100).toFixed(4);

  useEffect(() => {
    if (isOpen) {
      setTokensQuantity(offering.minPurchase);
      setStep(1);
      setError(null);
    }
  }, [isOpen, offering.minPurchase]);

  const handleQuantityChange = (value: number) => {
    setError(null);

    if (value < offering.minPurchase) {
      setError(`Minimum purchase is ${offering.minPurchase} tokens`);
    } else if (value > offering.tokensAvailable) {
      setError(`Only ${offering.tokensAvailable} tokens available`);
    } else if (offering.maxPurchase && value > offering.maxPurchase) {
      setError(`Maximum purchase is ${offering.maxPurchase} tokens`);
    }

    setTokensQuantity(value);
  };

  const handlePurchase = async () => {
    if (!authUser?.cognitoInfo?.userId) {
      setError("You must be logged in to purchase tokens");
      return;
    }

    if (error) return;

    setStep(2); // Move to confirmation
  };

  const handleConfirmPurchase = async () => {
    try {
      const result = await purchaseTokens({
        tokenId: offering._id,
        tokensQuantity,
        investorId: authUser?.cognitoInfo?.userId,
        investorEmail: (authUser?.userInfo as any)?.email,
        investorPhone: (authUser?.userInfo as any)?.phoneNumber,
        paymentMethod,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }).unwrap();

      setStep(3); // Success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.data?.message || "Failed to purchase tokens");
      setStep(1);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Coins className="w-7 h-7" />
                {step === 3 ? "Purchase Successful!" : "Purchase Tokens"}
              </h2>
              <p className="opacity-90 mt-1">{offering.tokenName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              disabled={isLoading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center mt-6 gap-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= stepNum
                      ? "bg-white text-blue-600"
                      : "bg-white/20 text-white/60"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step > stepNum ? "bg-white" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Token Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Token Symbol</p>
                    <p className="font-bold text-lg">{offering.tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Price per Token</p>
                    <p className="font-bold text-lg">{formatCurrency(offering.tokenPrice)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Available</p>
                    <p className="font-semibold">{offering.tokensAvailable.toLocaleString()} tokens</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min/Max Purchase</p>
                    <p className="font-semibold">
                      {offering.minPurchase} - {offering.maxPurchase || "Unlimited"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tokens *
                </label>
                <Input
                  type="number"
                  value={tokensQuantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                  min={offering.minPurchase}
                  max={Math.min(offering.tokensAvailable, offering.maxPurchase || offering.tokensAvailable)}
                  className="text-lg font-semibold"
                />
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tokens</span>
                    <span className="font-semibold">{tokensQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Token</span>
                    <span className="font-semibold">{formatCurrency(offering.tokenPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ownership Percentage</span>
                    <span className="font-semibold">{ownershipPercentage}%</span>
                  </div>
                  <div className="pt-3 border-t border-gray-300 flex justify-between">
                    <span className="text-lg font-bold">Total Cost</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Confirm Your Purchase</p>
                  <p className="text-sm text-yellow-700">
                    Please review your purchase details carefully before confirming.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-lg mb-4">Purchase Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Property</p>
                    <p className="font-semibold">{offering.tokenName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Token Symbol</p>
                    <p className="font-semibold">{offering.tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tokens</p>
                    <p className="font-semibold">{tokensQuantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Investment</p>
                    <p className="font-semibold text-lg text-blue-600">{formatCurrency(totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ownership</p>
                    <p className="font-semibold">{ownershipPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-semibold capitalize">{paymentMethod.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 rounded-full p-6 mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                You have successfully purchased {tokensQuantity} {offering.tokenSymbol} tokens.
                Your portfolio has been updated.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
                <p className="text-sm text-gray-600 mb-2">Transaction Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tokens</span>
                    <span className="font-semibold">{tokensQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {error && step === 1 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-4">
            {step === 1 && (
              <>
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={isLoading || !!error || tokensQuantity < offering.minPurchase}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Confirmation
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Processing..." : "Confirm Purchase"}
                </Button>
              </>
            )}

            {step === 3 && (
              <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
                View My Portfolio
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchaseModal;
