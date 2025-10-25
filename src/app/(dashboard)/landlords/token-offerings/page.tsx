"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Edit,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

const LandlordTokenOfferings = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const landlordId = authUser?.cognitoInfo?.userId;

  const [offerings, setOfferings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchOfferings = async () => {
      if (!landlordId) return;

      try {
        // Fetch all offerings and filter by landlord
        const response = await fetch(`/api/tokens/offerings?limit=100`);
        const data = await response.json();

        if (data.success) {
          // Filter offerings for properties owned by this landlord
          const landlordOfferings = data.data.filter((offering: any) => {
            return offering.propertyId?.sellerCognitoId === landlordId;
          });
          setOfferings(landlordOfferings);
        }
      } catch (error) {
        console.error("Error fetching token offerings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferings();
  }, [landlordId]);

  const handleStatusChange = async (tokenId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tokens/offerings/${tokenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh offerings
        setOfferings((prev) =>
          prev.map((off) =>
            off._id === tokenId ? { ...off, status: newStatus } : off
          )
        );
        alert(`Token offering ${newStatus === "active" ? "activated" : "updated"} successfully!`);
      } else {
        alert("Failed to update token offering status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating the status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "funded":
        return "bg-blue-100 text-blue-700";
      case "closed":
        return "bg-gray-400 text-gray-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "draft":
        return <Clock className="w-4 h-4" />;
      case "funded":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="dashboard-container">
      <Header
        title="My Token Offerings"
        subtitle="Manage your tokenized property offerings"
      />

      {/* Summary Stats */}
      {offerings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Offerings</p>
                  <p className="text-2xl font-bold">{offerings.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {offerings.filter((o) => o.status === "active").length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Raised</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      offerings.reduce(
                        (sum, o) => sum + o.tokensSold * o.tokenPrice,
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Funded</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {offerings.filter((o) => o.status === "funded").length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Offerings List */}
      {offerings.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-blue-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Coins className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Token Offerings Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Tokenize your properties to raise capital through fractional ownership
          </p>
          <Link href="/landlords/properties">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Coins className="w-4 h-4 mr-2" />
              View My Properties
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {offerings.map((offering) => {
            const fundingProgress =
              (offering.tokensSold / offering.totalTokens) * 100;
            const daysLeft = Math.ceil(
              (new Date(offering.offeringEndDate).getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={offering._id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{offering.tokenName}</h3>
                        <Badge className={getStatusColor(offering.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(offering.status)}
                            {offering.status.toUpperCase()}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 font-mono">
                        {offering.tokenSymbol}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/buyers/tokens/${offering._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>

                      {offering.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(offering._id, "active")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate
                        </Button>
                      )}

                      {offering.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(offering._id, "closed")}
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Token Price</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(offering.tokenPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Tokens</p>
                      <p className="text-xl font-bold">
                        {offering.totalTokens.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tokens Sold</p>
                      <p className="text-xl font-bold text-green-600">
                        {offering.tokensSold.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Funds Raised</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(offering.tokensSold * offering.tokenPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-semibold">{fundingProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Expected Return</p>
                        <p className="font-semibold text-sm">{offering.expectedReturn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Time Left</p>
                        <p className="font-semibold text-sm">
                          {daysLeft > 0 ? `${daysLeft}d` : "Ended"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Dividends</p>
                        <p className="font-semibold text-sm">
                          {offering.dividendFrequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Property Value</p>
                        <p className="font-semibold text-sm">
                          {formatCurrency(offering.propertyValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LandlordTokenOfferings;
