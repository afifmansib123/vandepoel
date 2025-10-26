"use client";

import React from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetInvestorPortfolioQuery } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Coins,
  Calendar,
  ArrowUpRight,
  Building,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const BuyerPortfolio = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const investorId = authUser?.cognitoInfo?.userId;

  const {
    data: portfolioResponse,
    isLoading,
    isError,
    refetch,
  } = useGetInvestorPortfolioQuery(investorId || "", {
    skip: !investorId,
  });

  const portfolio = portfolioResponse?.data;

  // Helper to format currency - using EUR as default for portfolio stats
  const formatPortfolioCurrency = (amount: number) => {
    return formatPortfolioCurrency(amount, 'EUR');
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="dashboard-container">
        <Header title="My Portfolio" subtitle="Track your token investments and returns" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Portfolio</h3>
            <p className="text-red-700 mb-4">
              We encountered an issue while fetching your portfolio data.
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio || portfolio.investments.length === 0) {
    return (
      <div className="dashboard-container">
        <Header title="My Portfolio" subtitle="Track your token investments and returns" />
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Investments Yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your real estate portfolio by investing in tokenized properties.
            </p>
            <Link href="/buyers/tokens">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Coins className="w-4 h-4 mr-2" />
                Browse Token Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = portfolio.statistics;

  return (
    <div className="dashboard-container">
      <Header title="My Portfolio" subtitle="Track your token investments and returns" />

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Invested</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatPortfolioCurrency(stats.totalInvested)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Principal investment amount</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Dividends</span>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPortfolioCurrency(stats.totalDividends)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Earnings to date</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Value</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatPortfolioCurrency(stats.currentValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Investment + dividends</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Return</span>
              <div className="bg-orange-100 p-2 rounded-lg">
                <ArrowUpRight className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.averageReturn}%</div>
            <p className="text-xs text-gray-500 mt-1">Average ROI</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 mb-8 flex flex-wrap justify-around gap-4">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Properties</p>
            <p className="font-bold text-lg">{stats.totalProperties}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm text-gray-600">Total Tokens</p>
            <p className="font-bold text-lg">{stats.totalTokens.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Active Investments</p>
            <p className="font-bold text-lg">{portfolio.investments.length}</p>
          </div>
        </div>
      </div>

      {/* Investment Breakdown by Property */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Investments</h2>
        <p className="text-gray-600 mb-6">
          Detailed breakdown of your token holdings by property
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portfolio.investmentsByProperty.map((investment: any) => {
          const property = investment.property;
          const tokenOffering = investment.tokenOffering;
          const propertyImage = property?.photoUrls?.[0] || '/placeholder-property.jpg';

          return (
            <Card key={property?._id || Math.random()} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={propertyImage}
                  alt={property?.name || 'Property'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-blue-600 text-white">
                    {investment.ownershipPercentage.toFixed(2)}% Ownership
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">{property?.name || 'Property'}</h3>
                  <p className="text-sm text-gray-600 font-mono">{tokenOffering?.tokenSymbol}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tokens Owned</p>
                    <p className="font-bold text-lg">{investment.totalTokens.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Invested</p>
                    <p className="font-bold text-lg text-blue-600">
                      {formatPortfolioCurrency(investment.totalInvested)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dividends Earned</span>
                    <span className="font-semibold text-green-600">
                      {formatPortfolioCurrency(investment.totalDividends)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected Return</span>
                    <span className="font-semibold">{tokenOffering?.expectedReturn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dividend Frequency</span>
                    <span className="font-semibold">{tokenOffering?.dividendFrequency}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href={`/buyers/tokens/${tokenOffering?._id}`}>
                    <Button variant="outline" className="w-full">
                      View Token Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Transactions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.investments.map((investment: any) => (
                    <tr key={investment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(investment.purchaseDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.propertyId?.name || 'Property'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {investment.tokenId?.tokenSymbol}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {investment.tokensOwned.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPortfolioCurrency(investment.totalInvestment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            investment.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {investment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyerPortfolio;
