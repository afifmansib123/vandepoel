"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetTokenListingQuery, usePurchaseFromListingMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Shield,
  DollarSign,
  ArrowLeft,
  TrendingUp,
  Calendar,
  AlertCircle,
  Building,
  Coins,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";

const P2PTokenDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [tokensToPurchase, setTokensToPurchase] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  const {
    data: listingResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTokenListingQuery(listingId);

  const [purchaseFromListing, { isLoading: isPurchasing }] = usePurchaseFromListingMutation();

  const listing = listingResponse?.data;

  if (isLoading) return <Loading />;

  if (isError || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header title="Listing Not Found" subtitle="This token listing does not exist" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Token Listing
            </h3>
            <p className="text-red-700 mb-4">
              We couldn't find this token listing or there was an error loading it.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const property = listing.propertyId;
  const tokenOffering = listing.tokenOfferingId;
  const propertyImage = property?.images?.[0] || "/placeholder-property.jpg";

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePurchase = async () => {
    if (tokensToPurchase < 1 || tokensToPurchase > listing.tokensForSale) {
      alert(`Please enter a valid quantity (1-${listing.tokensForSale})`);
      return;
    }

    try {
      const result = await purchaseFromListing({
        listingId: listing._id,
        tokensToPurchase,
        proposedPaymentMethod: paymentMethod,
      }).unwrap();

      setIsPurchaseModalOpen(false);
      alert(result.message + '\n\nPlease check your token requests to upload payment proof.');
      router.push('/buyers/token-requests');
    } catch (error: any) {
      console.error('Purchase failed:', error);
      alert(error?.data?.message || 'Failed to purchase tokens');
    }
  };

  const totalPrice = tokensToPurchase * listing.pricePerToken;
  const ownershipPercentage = tokenOffering?.totalTokens
    ? ((tokensToPurchase / tokenOffering.totalTokens) * 100).toFixed(4)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link href="/token-marketplace">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-purple-600">
            <Users className="w-3 h-3 mr-1" />
            P2P Listing
          </Badge>
          {listing.riskLevel && (
            <Badge className={getRiskColor(listing.riskLevel)}>
              {listing.riskLevel.toUpperCase()} RISK
            </Badge>
          )}
          {listing.status === 'active' && (
            <Badge className="bg-green-600">AVAILABLE</Badge>
          )}
        </div>
        <Header
          title={listing.tokenName}
          subtitle={`${listing.tokenSymbol} • Listed by ${listing.sellerName}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Image */}
          <div className="relative h-96 w-full rounded-lg overflow-hidden">
            <Image
              src={propertyImage}
              alt={listing.tokenName}
              fill
              className="object-cover"
            />
          </div>

          {/* Property Info */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Property Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Property</p>
                <p className="font-semibold">{listing.propertyName || property?.propertyTitle || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Property Type</p>
                <p className="font-semibold">{listing.propertyType || 'N/A'}</p>
              </div>
              {property?.location && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">
                      {property.location.city}, {property.location.country}
                    </p>
                  </div>
                </>
              )}
              {tokenOffering?.propertyValue && (
                <div>
                  <p className="text-sm text-gray-600">Property Value</p>
                  <p className="font-semibold">
                    {listing.currency} {tokenOffering.propertyValue.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Token Offering Info */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Token Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {tokenOffering?.totalTokens && (
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="font-semibold">{tokenOffering.totalTokens.toLocaleString()}</p>
                </div>
              )}
              {tokenOffering?.expectedReturn && (
                <div>
                  <p className="text-sm text-gray-600">Expected Return</p>
                  <p className="font-semibold text-green-600">{tokenOffering.expectedReturn}</p>
                </div>
              )}
              {tokenOffering?.dividendFrequency && (
                <div>
                  <p className="text-sm text-gray-600">Dividend Frequency</p>
                  <p className="font-semibold">{tokenOffering.dividendFrequency}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          {listing.description && (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Seller's Message</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Purchase Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-2">
                {listing.currency} {listing.pricePerToken.toLocaleString()}
              </h3>
              <p className="text-gray-600 mb-6">per token</p>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">Available Tokens</span>
                  <span className="font-bold">{listing.tokensForSale.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">Total Value</span>
                  <span className="font-bold">
                    {listing.currency} {listing.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">Seller</span>
                  <span className="font-semibold flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {listing.sellerName}
                  </span>
                </div>
                {listing.listedAt && (
                  <div className="flex justify-between pb-3 border-b">
                    <span className="text-gray-600">Listed On</span>
                    <span className="font-semibold">
                      {new Date(listing.listedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {listing.status === 'active' ? (
                <Button
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Purchase Tokens
                </Button>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This listing is no longer available (Status: {listing.status})
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">P2P Secondary Market</p>
                    <p className="text-sm text-blue-700 mt-1">
                      You're buying from another investor. Ownership transfers instantly upon purchase.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Tokens</DialogTitle>
            <DialogDescription>
              How many tokens would you like to purchase from this listing?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Number of Tokens</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={listing.tokensForSale}
                value={tokensToPurchase}
                onChange={(e) => setTokensToPurchase(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: {listing.tokensForSale} tokens
              </p>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                How you plan to complete payment
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per Token</span>
                <span className="font-semibold">
                  {listing.currency} {listing.pricePerToken.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity</span>
                <span className="font-semibold">{tokensToPurchase}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total Amount</span>
                <span className="font-bold text-lg">
                  {listing.currency} {totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ownership</span>
                <span className="font-semibold text-blue-600">{ownershipPercentage}%</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This is a P2P transaction. Tokens will be transferred instantly from {listing.sellerName} to you.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing || tokensToPurchase < 1 || tokensToPurchase > listing.tokensForSale}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default P2PTokenDetailPage;
