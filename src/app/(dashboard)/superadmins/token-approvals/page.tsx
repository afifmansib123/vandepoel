"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Coins,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCurrencyFromCountry } from "@/lib/utils";

const SuperadminTokenApprovals = () => {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    const fetchAllOfferings = async () => {
      try {
        // Fetch ALL offerings across all landlords
        const response = await fetch(`/api/tokens/offerings?limit=1000&includeAll=true`);
        const data = await response.json();

        if (data.success) {
          setOfferings(data.data);
        }
      } catch (error) {
        console.error("Error fetching token offerings:", error);
        toast.error("Failed to load token offerings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllOfferings();
  }, []);

  const handleApprove = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/tokens/offerings/${tokenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (response.ok) {
        setOfferings((prev) =>
          prev.map((off) =>
            off._id === tokenId ? { ...off, status: "active" } : off
          )
        );
        toast.success("Token offering approved and activated successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to approve token offering");
      }
    } catch (error) {
      console.error("Error approving offering:", error);
      toast.error("An error occurred while approving the offering");
    }
  };

  const handleReject = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/tokens/offerings/${tokenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        setOfferings((prev) =>
          prev.map((off) =>
            off._id === tokenId ? { ...off, status: "cancelled" } : off
          )
        );
        toast.success("Token offering rejected successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to reject token offering");
      }
    } catch (error) {
      console.error("Error rejecting offering:", error);
      toast.error("An error occurred while rejecting the offering");
    }
  };

  const formatOfferingCurrency = (amount: number, offering: any) => {
    const currency = getCurrencyFromCountry(offering.propertyId?.location?.country);
    return formatCurrency(amount, currency);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "draft":
        return "bg-yellow-100 text-yellow-700";
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

  // Filter offerings
  const filteredOfferings = offerings.filter((offering) => {
    const matchesStatus = filterStatus === "all" || offering.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      offering.tokenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.tokenSymbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.propertyId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group by status for summary
  const statusSummary = {
    total: offerings.length,
    draft: offerings.filter((o) => o.status === "draft").length,
    active: offerings.filter((o) => o.status === "active").length,
    funded: offerings.filter((o) => o.status === "funded").length,
    cancelled: offerings.filter((o) => o.status === "cancelled").length,
  };

  if (isLoading) return <Loading />;

  return (
    <div className="p-8">
      <Header title="Token Offering Approvals" subtitle="Review and approve token offerings from landlords" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("all")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Offerings</p>
                <p className="text-2xl font-bold">{statusSummary.total}</p>
              </div>
              <Coins className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200" onClick={() => setFilterStatus("draft")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{statusSummary.draft}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={() => setFilterStatus("active")}>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statusSummary.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200" onClick={() => setFilterStatus("funded")}>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-500">Funded</p>
              <p className="text-2xl font-bold text-blue-600">{statusSummary.funded}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200" onClick={() => setFilterStatus("cancelled")}>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statusSummary.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by token name, symbol, or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
        <Button
          variant={filterStatus === "draft" ? "default" : "outline"}
          onClick={() => setFilterStatus("draft")}
        >
          Pending
        </Button>
      </div>

      {/* Offerings List */}
      {filteredOfferings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Token Offerings Found</h3>
            <p className="text-gray-500">
              {filterStatus === "draft"
                ? "There are no pending token offerings to review."
                : "No token offerings match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOfferings.map((offering) => (
            <Card key={offering._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{offering.tokenName}</h3>
                      <Badge variant="outline" className="text-xs font-mono">
                        {offering.tokenSymbol}
                      </Badge>
                      <Badge className={getStatusColor(offering.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(offering.status)}
                          {offering.status.toUpperCase()}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Property: <span className="font-medium">{offering.propertyId?.name || "Unknown Property"}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Landlord: {offering.propertyId?.sellerCognitoId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/marketplace/${offering.propertyId?._id}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Property
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Token Price</p>
                      <p className="font-semibold">{formatOfferingCurrency(offering.tokenPrice, offering)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Coins className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Total Tokens</p>
                      <p className="font-semibold">{offering.totalTokens?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Expected Return</p>
                      <p className="font-semibold text-green-600">{offering.expectedReturn}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Offering Period</p>
                      <p className="font-semibold text-sm">
                        {new Date(offering.offeringStartDate).toLocaleDateString()} -
                        {new Date(offering.offeringEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">{offering.description}</p>
                </div>

                {/* Action Buttons */}
                {offering.status === "draft" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(offering._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Activate
                    </Button>
                    <Button
                      onClick={() => handleReject(offering._id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {offering.status === "active" && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      This offering is currently active and available for purchase
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperadminTokenApprovals;
