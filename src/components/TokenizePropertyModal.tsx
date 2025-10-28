"use client";

import React, { useState, useEffect } from "react";
import { X, Coins, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenizePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    _id: string;
    name: string;
    salePrice: number;
    propertyType: string;
    location?: {
      country?: string;
    };
  };
  onSuccess: () => void;
}

const TokenizePropertyModal: React.FC<TokenizePropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Determine currency based on country
  const currency = property.location?.country?.toLowerCase() === "thailand" ? "THB" : "EUR";
  const currencySymbol = currency === "THB" ? "฿" : "€";

  // Form state
  const [formData, setFormData] = useState({
    tokenName: `${property.name} Tokens`,
    tokenSymbol: "",
    totalTokens: 10000,
    tokenPrice: 0,
    minPurchase: 10,
    maxPurchase: 1000,
    propertyValue: property.salePrice,
    expectedReturn: "8-12% annually",
    dividendFrequency: "Quarterly",
    offeringStartDate: new Date().toISOString().split("T")[0],
    offeringEndDate: "",
    description: `Invest in ${property.name} through tokenized ownership. Each token represents a fractional share of this property.`,
    riskLevel: "medium" as "low" | "medium" | "high",
  });

  // Auto-calculate token price when total tokens changes
  useEffect(() => {
    if (formData.totalTokens > 0) {
      const calculatedPrice = Math.round(property.salePrice / formData.totalTokens);
      setFormData((prev) => ({ ...prev, tokenPrice: calculatedPrice }));
    }
  }, [formData.totalTokens, property.salePrice]);

  // Auto-generate token symbol from property name
  useEffect(() => {
    if (!formData.tokenSymbol) {
      const words = property.name.split(" ").filter((w) => w.length > 0);
      const symbol = words
        .slice(0, 3)
        .map((w) => w[0].toUpperCase())
        .join("");
      const randomNum = Math.floor(Math.random() * 1000);
      setFormData((prev) => ({
        ...prev,
        tokenSymbol: `${symbol}-${randomNum}`,
      }));
    }
  }, [property.name, formData.tokenSymbol]);

  // Set default end date (90 days from now)
  useEffect(() => {
    if (!formData.offeringEndDate) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      setFormData((prev) => ({
        ...prev,
        offeringEndDate: endDate.toISOString().split("T")[0],
      }));
    }
  }, [formData.offeringEndDate]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currency === "THB" ? "th-TH" : "nl-BE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tokens/offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property._id,
          ...formData,
          propertyType: property.propertyType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create token offering");
      }

      toast.success("Token offering created successfully! It's now in draft status.");
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalValue = formData.totalTokens * formData.tokenPrice;
  const minInvestment = formData.minPurchase * formData.tokenPrice;
  const maxInvestment = formData.maxPurchase * formData.tokenPrice;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Coins className="w-7 h-7" />
                Tokenize Property
              </h2>
              <p className="opacity-90 mt-1">{property.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
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
          {/* Step 1: Token Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">
                      Property Value: {formatCurrency(property.salePrice)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Each token represents fractional ownership of this property
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Name *
                  </label>
                  <Input
                    value={formData.tokenName}
                    onChange={(e) => handleChange("tokenName", e.target.value)}
                    placeholder="e.g., Gulshan Villa Tokens"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Symbol *
                  </label>
                  <Input
                    value={formData.tokenSymbol}
                    onChange={(e) =>
                      handleChange("tokenSymbol", e.target.value.toUpperCase())
                    }
                    placeholder="e.g., GVT-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Tokens *
                  </label>
                  <Input
                    type="number"
                    value={formData.totalTokens}
                    onChange={(e) =>
                      handleChange("totalTokens", parseInt(e.target.value))
                    }
                    min="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total number of tokens representing 100% ownership
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Token ({currencySymbol}) *
                  </label>
                  <Input
                    type="number"
                    value={formData.tokenPrice}
                    onChange={(e) =>
                      handleChange("tokenPrice", parseFloat(e.target.value))
                    }
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated: {formatCurrency(property.salePrice)} ÷{" "}
                    {formData.totalTokens} tokens
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Token Value:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Property Value:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(property.salePrice)}
                  </span>
                </div>
                {totalValue !== property.salePrice && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Token value doesn&apos;t match property value
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Investment Terms */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Purchase (tokens) *
                  </label>
                  <Input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      handleChange("minPurchase", parseInt(e.target.value))
                    }
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min investment: {formatCurrency(minInvestment)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Purchase (tokens)
                  </label>
                  <Input
                    type="number"
                    value={formData.maxPurchase}
                    onChange={(e) =>
                      handleChange("maxPurchase", parseInt(e.target.value))
                    }
                    min={formData.minPurchase}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max investment: {formatCurrency(maxInvestment)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Return *
                  </label>
                  <Input
                    value={formData.expectedReturn}
                    onChange={(e) =>
                      handleChange("expectedReturn", e.target.value)
                    }
                    placeholder="e.g., 8-12% annually"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dividend Frequency *
                  </label>
                  <Select
                    value={formData.dividendFrequency}
                    onValueChange={(value) =>
                      handleChange("dividendFrequency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Bi-annually">Bi-annually</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level *
                  </label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value: any) =>
                      handleChange("riskLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Offering Period & Description */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offering Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.offeringStartDate}
                    onChange={(e) =>
                      handleChange("offeringStartDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offering End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.offeringEndDate}
                    onChange={(e) =>
                      handleChange("offeringEndDate", e.target.value)
                    }
                    min={formData.offeringStartDate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={5}
                  placeholder="Describe the investment opportunity..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Offering Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Tokens</p>
                    <p className="font-semibold text-gray-900">
                      {formData.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Price per Token</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(formData.tokenPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Min Investment</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(minInvestment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Expected Return</p>
                    <p className="font-semibold text-gray-900">
                      {formData.expectedReturn}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-4">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating..." : "Create Token Offering"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenizePropertyModal;