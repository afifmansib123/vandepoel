"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitTokenPurchaseRequestMutation } from "@/state/api";
import { formatCurrency, getCurrencyFromCountry } from "@/lib/utils";
import { Coins, ArrowRight, CheckCircle, User, Phone, MapPin, MessageSquare, CreditCard, Target } from "lucide-react";

interface TokenPurchaseRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  offering: any; // Token offering with populated property
  userEmail: string;
  userName: string;
}

const TokenPurchaseRequestForm: React.FC<TokenPurchaseRequestFormProps> = ({
  isOpen,
  onClose,
  offering,
  userEmail,
  userName,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tokensRequested: offering?.minPurchase || 1,
    buyerPhone: "",
    buyerAddress: "",
    proposedPaymentMethod: "",
    message: "",
    investmentPurpose: "",
  });

  const [submitRequest, { isLoading }] = useSubmitTokenPurchaseRequestMutation();

  const currency = getCurrencyFromCountry(offering?.propertyId?.location?.country);
  const totalAmount = formData.tokensRequested * (offering?.tokenPrice || 0);
  const ownershipPercentage = ((formData.tokensRequested / offering?.totalTokens) * 100).toFixed(4);

  const handleSubmit = async () => {
    try {
      await submitRequest({
        tokenOfferingId: offering._id,
        tokensRequested: formData.tokensRequested,
        proposedPaymentMethod: formData.proposedPaymentMethod,
        message: formData.message,
        investmentPurpose: formData.investmentPurpose,
        buyerPhone: formData.buyerPhone,
        buyerAddress: formData.buyerAddress,
      }).unwrap();

      toast.success("Purchase request submitted successfully!");
      setStep(3); // Success step
    } catch (error: any) {
      console.error("Failed to submit purchase request:", error);
      toast.error(error?.data?.message || "Failed to submit purchase request. Please try again.");
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      tokensRequested: offering?.minPurchase || 1,
      buyerPhone: "",
      buyerAddress: "",
      proposedPaymentMethod: "",
      message: "",
      investmentPurpose: "",
    });
    onClose();
  };

  if (!offering) return null;

  const availableTokens = offering.totalTokens - offering.tokensSold;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-blue-600" />
            Submit Purchase Request
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Submit a request to invest in {offering.tokenName}
          </p>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-green-600 text-white" : "bg-gray-200"}`}>
              ✓
            </div>
          </div>
        </div>

        {/* Step 1: Token Quantity & Contact Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Investment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Token Price</p>
                  <p className="font-bold">{formatCurrency(offering.tokenPrice, currency)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Available Tokens</p>
                  <p className="font-bold">{availableTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="tokensRequested">Number of Tokens *</Label>
              <Input
                id="tokensRequested"
                type="number"
                min={offering.minPurchase}
                max={Math.min(offering.maxPurchase || availableTokens, availableTokens)}
                value={formData.tokensRequested}
                onChange={(e) => setFormData({ ...formData, tokensRequested: parseInt(e.target.value) })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: {offering.minPurchase} | Max: {Math.min(offering.maxPurchase || availableTokens, availableTokens)}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Investment</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(totalAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ownership</p>
                  <p className="text-xl font-bold text-purple-600">{ownershipPercentage}%</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="buyerPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="buyerPhone"
                type="tel"
                value={formData.buyerPhone}
                onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="buyerAddress" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address (Optional)
              </Label>
              <Textarea
                id="buyerAddress"
                value={formData.buyerAddress}
                onChange={(e) => setFormData({ ...formData, buyerAddress: e.target.value })}
                placeholder="Your mailing address"
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Next: Payment & Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method & Message */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="proposedPaymentMethod" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Proposed Payment Method *
              </Label>
              <Select
                value={formData.proposedPaymentMethod}
                onValueChange={(value) => setFormData({ ...formData, proposedPaymentMethod: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="investmentPurpose" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Investment Purpose (Optional)
              </Label>
              <Input
                id="investmentPurpose"
                value={formData.investmentPurpose}
                onChange={(e) => setFormData({ ...formData, investmentPurpose: e.target.value })}
                placeholder="e.g., Long-term investment, Rental income, Diversification"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message to Property Owner (Optional)
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Introduce yourself and explain your interest in this investment..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Name:</span> {userName}</p>
                <p><span className="text-gray-600">Email:</span> {userEmail}</p>
                {formData.buyerPhone && <p><span className="text-gray-600">Phone:</span> {formData.buyerPhone}</p>}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a purchase request, not an instant purchase. The property owner will review your request and may approve or reject it. If approved, you'll receive payment instructions.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.proposedPaymentMethod || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">Request Submitted!</h3>
              <p className="text-gray-600 mt-2">
                Your purchase request has been sent to the property owner.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-left">
              <h4 className="font-semibold mb-3">What happens next?</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>The property owner will review your request and your details</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>If approved, you'll receive payment instructions via email</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>After payment is confirmed, tokens will be assigned to you</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>You can track your request status in your dashboard</span>
                </li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => window.location.href = "/buyers/token-requests"}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                View My Requests
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchaseRequestForm;
