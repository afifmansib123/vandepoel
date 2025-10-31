"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCreateTokenListingMutation } from "@/state/api";
import { DollarSign, TrendingUp, AlertCircle, Tag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ListTokenForSaleDialogProps {
  investment: {
    _id: string;
    tokensRequested?: number; // From TokenPurchaseRequest
    tokensOwned?: number; // From TokenInvestment
    tokenOfferingId?: any; // From TokenPurchaseRequest
    tokenId?: any; // From TokenInvestment
    propertyId: any;
    pricePerToken?: number; // From TokenPurchaseRequest
    purchasePrice?: number; // From TokenInvestment
    totalAmount?: number; // From TokenPurchaseRequest
    totalInvestment?: number; // From TokenInvestment
    currency?: string; // From TokenPurchaseRequest
  };
  existingListings?: any[];
  trigger?: React.ReactNode;
}

const ListTokenForSaleDialog: React.FC<ListTokenForSaleDialogProps> = ({
  investment,
  existingListings = [],
  trigger,
}) => {
  const [open, setOpen] = useState(false);

  // Handle both TokenPurchaseRequest and TokenInvestment data structures
  const tokensOwned = investment.tokensOwned || investment.tokensRequested || 0;
  const purchasePrice = investment.purchasePrice || investment.pricePerToken || 0;
  const tokenOffering = investment.tokenId || investment.tokenOfferingId;
  const currency = investment.currency || (investment.propertyId?.location?.country === 'Thailand' ? 'THB' : 'EUR');

  const [formData, setFormData] = useState({
    tokensForSale: 1,
    pricePerToken: purchasePrice, // Default to purchase price
    description: "",
    expiresInDays: 30,
  });

  const [createListing, { isLoading }] = useCreateTokenListingMutation();

  // Calculate available tokens (owned - already listed)
  const tokensAlreadyListed = existingListings
    .filter((listing: any) => listing.status === 'active')
    .reduce((sum: number, listing: any) => sum + listing.tokensForSale, 0);

  const availableToList = tokensOwned - tokensAlreadyListed;

  const totalPrice = formData.tokensForSale * formData.pricePerToken;
  const potentialProfit = totalPrice - (formData.tokensForSale * purchasePrice);
  const profitPercentage = purchasePrice > 0 ? ((formData.pricePerToken - purchasePrice) / purchasePrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tokensForSale > availableToList) {
      alert(`You can only list ${availableToList} tokens`);
      return;
    }

    if (formData.pricePerToken <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    try {
      await createListing({
        purchaseRequestId: investment._id, // Can be TokenPurchaseRequest or TokenInvestment ID
        tokensForSale: formData.tokensForSale,
        pricePerToken: formData.pricePerToken,
        description: formData.description || undefined,
        expiresInDays: formData.expiresInDays > 0 ? formData.expiresInDays : undefined,
      }).unwrap();

      setOpen(false);
      // Reset form
      setFormData({
        tokensForSale: 1,
        pricePerToken: purchasePrice,
        description: "",
        expiresInDays: 30,
      });
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      alert(error?.data?.message || 'Failed to create listing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="w-4 h-4 mr-2" />
            List for Sale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List Tokens for Sale</DialogTitle>
          <DialogDescription>
            Create a P2P listing to sell your {tokenOffering?.tokenName || 'tokens'} to other buyers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Investment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Token</span>
              <span className="font-semibold">
                {tokenOffering?.tokenName || 'N/A'} ({tokenOffering?.tokenSymbol || 'N/A'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tokens Owned</span>
              <span className="font-semibold">{tokensOwned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Already Listed</span>
              <span className="font-semibold">{tokensAlreadyListed}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm text-gray-600">Available to List</span>
              <span className="font-bold text-green-600">{availableToList}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Your Purchase Price</span>
              <span className="font-semibold">
                {currency} {purchasePrice.toLocaleString()}
              </span>
            </div>
          </div>

          {availableToList === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have no tokens available to list. All your tokens are either already listed or you don't own any.
              </AlertDescription>
            </Alert>
          )}

          {/* Number of Tokens */}
          <div>
            <Label htmlFor="tokensForSale">Number of Tokens to Sell *</Label>
            <Input
              id="tokensForSale"
              type="number"
              min={1}
              max={availableToList}
              value={formData.tokensForSale}
              onChange={(e) =>
                setFormData({ ...formData, tokensForSale: parseInt(e.target.value) || 1 })
              }
              required
              disabled={availableToList === 0}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum: {availableToList} tokens
            </p>
          </div>

          {/* Price Per Token */}
          <div>
            <Label htmlFor="pricePerToken">Price Per Token ({currency}) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="pricePerToken"
                type="number"
                min={0.01}
                step={0.01}
                value={formData.pricePerToken}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerToken: parseFloat(e.target.value) || 0 })
                }
                className="pl-10"
                required
                disabled={availableToList === 0}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Badge variant={profitPercentage >= 0 ? "default" : "destructive"}>
                {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
              </Badge>
              <span className="text-gray-600">
                vs. your purchase price
              </span>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Total Listing Value</span>
              <span className="font-bold text-lg">
                {currency} {totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Your Original Cost</span>
              <span className="font-semibold">
                {currency} {(formData.tokensForSale * purchasePrice).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm text-gray-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Potential {potentialProfit >= 0 ? 'Profit' : 'Loss'}
              </span>
              <span className={`font-bold ${potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {potentialProfit >= 0 ? '+' : ''}{currency} {potentialProfit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes for potential buyers (e.g., reason for selling, property insights, etc.)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              disabled={availableToList === 0}
            />
          </div>

          {/* Expiration */}
          <div>
            <Label htmlFor="expiresInDays">Listing Duration (Days)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min={1}
              max={365}
              value={formData.expiresInDays}
              onChange={(e) =>
                setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 30 })
              }
              disabled={availableToList === 0}
            />
            <p className="text-sm text-gray-500 mt-1">
              Listing will expire after {formData.expiresInDays} days
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || availableToList === 0}
            >
              {isLoading ? "Creating Listing..." : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ListTokenForSaleDialog;
