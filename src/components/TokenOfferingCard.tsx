"use client";

import React from "react";
import Link from "next/link";
import { Coins, TrendingUp, Calendar, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TokenOfferingCardProps {
  offering: {
    _id: string;
    propertyId: any;
    tokenName: string;
    tokenSymbol: string;
    totalTokens: number;
    tokenPrice: number;
    tokensSold: number;
    tokensAvailable: number;
    minPurchase: number;
    propertyValue: number;
    expectedReturn: string;
    dividendFrequency: string;
    offeringEndDate: string | Date;
    status: 'draft' | 'active' | 'funded' | 'closed' | 'cancelled';
    riskLevel: 'low' | 'medium' | 'high';
    propertyType: string;
  };
  onInvest?: (offeringId: string) => void;
}

const TokenOfferingCard: React.FC<TokenOfferingCardProps> = ({ offering, onInvest }) => {
  const fundingProgress = (offering.tokensSold / offering.totalTokens) * 100;
  const daysLeft = Math.ceil(
    (new Date(offering.offeringEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'funded':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-400';
      case 'closed':
        return 'bg-gray-600';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const propertyImage = offering.propertyId?.photoUrls?.[0] || '/placeholder-property.jpg';
  const propertyName = offering.propertyId?.name || offering.tokenName;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={propertyImage}
          alt={propertyName}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={`${getStatusColor(offering.status)} text-white border-none`}>
            {offering.status.toUpperCase()}
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className={`${getRiskColor(offering.riskLevel)} border`}>
            {offering.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg line-clamp-1 mb-1">{offering.tokenName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono font-semibold">{offering.tokenSymbol}</span>
              <span className="text-gray-400">•</span>
              <span>{offering.propertyType}</span>
            </div>
          </div>
          <Coins className="w-6 h-6 text-blue-600 flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Token Price</p>
            <p className="font-bold text-lg">{formatCurrency(offering.tokenPrice)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Min. Investment</p>
            <p className="font-bold text-lg">
              {formatCurrency(offering.minPurchase * offering.tokenPrice)}
            </p>
          </div>
        </div>

        {/* Expected Return */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Expected Return</span>
          </div>
          <span className="font-bold text-green-700">{offering.expectedReturn}</span>
        </div>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Funding Progress</span>
            <span className="font-semibold">{fundingProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{offering.tokensSold.toLocaleString()} sold</span>
            <span>{offering.tokensAvailable.toLocaleString()} available</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Time Left</p>
              <p className="font-semibold">{daysLeft > 0 ? `${daysLeft}d` : 'Ended'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Dividends</p>
              <p className="font-semibold">{offering.dividendFrequency}</p>
            </div>
          </div>
        </div>

        {/* Property Value */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-gray-500 mb-1">Total Property Value</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(offering.propertyValue)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t gap-2">
        <Link href={`/buyers/tokens/${offering._id}`} className="flex-1">
          <Button className="w-full" variant="outline">
            View Details
          </Button>
        </Link>
        {offering.status === 'active' && offering.tokensAvailable > 0 && (
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => onInvest && onInvest(offering._id)}
          >
            <Coins className="w-4 h-4 mr-2" />
            Invest Now
          </Button>
        )}
        {offering.status === 'funded' && (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-600 font-semibold">
            <AlertCircle className="w-4 h-4" />
            Fully Funded
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TokenOfferingCard;
