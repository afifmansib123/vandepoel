"use client";
import TokenPurchaseRequestForm from "@/components/TokenPurchaseRequestForm";
import { formatCurrency, getCurrencyFromCountry } from "@/lib/utils";
import { useGetAuthUserQuery } from "@/state/api";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
// import TokenPurchaseModal from "@/components/TokenPurchaseModal";
import { useGetTokenOfferingQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  TrendingUp,
  Calendar,
  Users,
  Shield,
  DollarSign,
  ArrowLeft,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const TokenDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.id as string;

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const {
    data: offeringResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTokenOfferingQuery(tokenId);

    const { data: authUser, refetch: refetchAuthUser } = useGetAuthUserQuery();

  const offering = offeringResponse?.data;

  if (isLoading) return <Loading />;

  if (isError || !offering) {
    return (
      <div className="dashboard-container">
        <Header title="Token Not Found" subtitle="This token offering does not exist" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Token Offering
            </h3>
            <p className="text-red-700 mb-4">
              We couldn't find this token offering or there was an error loading it.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fundingProgress = (offering.tokensSold / offering.totalTokens) * 100;
  const daysLeft = Math.ceil(
    (new Date(offering.offeringEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'funded':
        return 'bg-blue-500 text-white';
      case 'draft':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatOfferingCurrency = (amount: number) => {
    const currency = getCurrencyFromCountry(offering?.propertyId?.location?.country);
    return formatCurrency(amount, currency);
  };

  const propertyImages = offering.propertyId?.photoUrls || [];
  const property = offering.propertyId;

  return (
    <div className="dashboard-container">
      {/* Back Button */}
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Button>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-4">
              <Coins className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{offering.tokenName}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`${getStatusColor(offering.status)}`}>
                    {offering.status.toUpperCase()}
                  </Badge>
                  <Badge className={getRiskColor(offering.riskLevel)}>
                    {offering.riskLevel.toUpperCase()} RISK
                  </Badge>
                  <span className="text-gray-600 font-mono font-semibold">{offering.tokenSymbol}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{offering.description}</p>
          </div>

          {offering.status === 'active' && offering.tokensAvailable > 0 && (
            <div className="lg:w-80">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14 text-lg"
                onClick={() => setIsPurchaseModalOpen(true)}
              >
                <Coins className="w-5 h-5 mr-2" />
                Invest Now
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          {propertyImages.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="relative h-96">
                <img
                  src={propertyImages[0]}
                  alt={offering.tokenName}
                  className="w-full h-full object-cover"
                />
              </div>
              {propertyImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4">
                  {propertyImages.slice(1, 5).map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${offering.tokenName} ${idx + 2}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Property Details */}
          {property && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Property Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.features?.bedrooms?.count && (
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-semibold">{property.features.bedrooms.count}</p>
                    </div>
                  </div>
                )}
                {property.features?.bathrooms?.count && (
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-semibold">{property.features.bathrooms.count}</p>
                    </div>
                  </div>
                )}
                {property.squareFeet && (
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Square Feet</p>
                      <p className="font-semibold">{property.squareFeet.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {property.propertyType && (
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold">{property.propertyType}</p>
                    </div>
                  </div>
                )}
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Investment Highlights */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Investment Highlights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Expected Returns</h3>
                  <p className="text-gray-600">{offering.expectedReturn}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Dividend Frequency</h3>
                  <p className="text-gray-600">{offering.dividendFrequency}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Risk Level</h3>
                  <p className="text-gray-600 capitalize">{offering.riskLevel} risk investment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Investment Info */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Investment Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Token Price</p>
                <p className="text-2xl font-bold">{formatOfferingCurrency(offering.tokenPrice)}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Minimum Investment</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatOfferingCurrency(offering.minPurchase * offering.tokenPrice)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ({offering.minPurchase} tokens minimum)
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Total Property Value</p>
                <p className="text-xl font-bold">{formatOfferingCurrency(offering.propertyValue)}</p>
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Funding Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold">{fundingProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tokens Sold</p>
                  <p className="text-lg font-bold">{offering.tokensSold.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Available</p>
                  <p className="text-lg font-bold text-green-600">
                    {offering.tokensAvailable.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
                <p className="text-lg font-bold">
                  {daysLeft > 0 ? `${daysLeft} days` : 'Offering Ended'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ends {new Date(offering.offeringEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {offering.status === 'active' && offering.tokensAvailable > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-bold text-lg mb-2">Ready to Invest?</h3>
              <p className="text-gray-700 text-sm mb-4">
                Join other investors and start earning passive income through fractional real estate ownership.
              </p>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setIsPurchaseModalOpen(true)}
              >
                <Coins className="w-4 h-4 mr-2" />
                Purchase Tokens
              </Button>
            </div>
          )}

          {offering.status === 'funded' && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Fully Funded</h3>
              <p className="text-gray-700 text-sm">
                This offering has reached its funding goal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      <TokenPurchaseRequestForm
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        offering={offering}
        userEmail={authUser?.userInfo?.email || ""}
        userName={authUser?.userInfo?.name || ""}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default TokenDetailsPage;
