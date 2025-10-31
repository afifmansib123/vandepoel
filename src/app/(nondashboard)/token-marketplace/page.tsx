"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetTokenMarketplaceQuery } from "@/state/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp, DollarSign, Shield, Users, Building, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const TokenizedMarketplace = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    propertyType: "",
    riskLevel: "",
    source: "all", // 'official' | 'p2p' | 'all'
  });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: marketplaceResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTokenMarketplaceQuery({
    page,
    limit: 12,
    propertyType: filters.propertyType,
    riskLevel: filters.riskLevel,
    source: filters.source as 'official' | 'p2p' | 'all',
    sortBy,
  });

  const items = marketplaceResponse?.data || [];
  const pagination = marketplaceResponse?.pagination;

  // Filter by search term locally
  const filteredItems = items.filter((item: any) =>
    item.tokenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.property?.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ propertyType: "", riskLevel: "", source: "all" });
    setSearchTerm("");
    setSortBy('newest');
    setPage(1);
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header
          title="Tokenized Property Marketplace"
          subtitle="Trade real estate tokens - official offerings and peer-to-peer"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Marketplace
            </h3>
            <p className="text-red-700 mb-4">
              We encountered an issue while fetching the marketplace. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <Header
        title="Tokenized Property Marketplace"
        subtitle="Invest in fractional real estate ownership - official offerings and peer-to-peer trading"
      />

      {/* Info Banner */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Official Offerings</h4>
            <p className="text-sm text-blue-700">Direct from property owners</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-purple-500 p-2 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">P2P Trading</h4>
            <p className="text-sm text-purple-700">Buy from other investors</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 mb-1">Passive Income</h4>
            <p className="text-sm text-green-700">Earn regular dividends</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Flexible Pricing</h4>
            <p className="text-sm text-amber-700">Market-driven prices</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by token, property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filters.source} onValueChange={(value) => handleFilterChange("source", value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="official">Official Only</SelectItem>
              <SelectItem value="p2p">P2P Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.propertyType || "all"} onValueChange={(value) => handleFilterChange("propertyType", value)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Townhouse">Townhouse</SelectItem>
              <SelectItem value="Cottage">Cottage</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.riskLevel || "all"} onValueChange={(value) => handleFilterChange("riskLevel", value)}>
            <SelectTrigger className="w-[150px]">
              <Shield className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {(filters.propertyType || filters.riskLevel || filters.source !== "all" || searchTerm || sortBy !== 'newest') && (
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            <span className="font-semibold">{filteredItems.length}</span> listing
            {filteredItems.length !== 1 ? "s" : ""} available
          </p>
          {pagination && (
            <p className="text-sm text-gray-500">
              {pagination.officialCount} official • {pagination.p2pCount} P2P
            </p>
          )}
        </div>
        {pagination && (
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        )}
      </div>

      {/* Token Marketplace Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item: any) => (
            <MarketplaceItemCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Listings Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.propertyType || filters.riskLevel || filters.source !== "all"
                ? "Try adjusting your filters to see more results."
                : "There are currently no active listings available."}
            </p>
            {(filters.propertyType || filters.riskLevel || filters.source !== "all" || searchTerm) && (
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  onClick={() => setPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Marketplace Item Card Component
const MarketplaceItemCard = ({ item }: { item: any }) => {
  const isP2P = item.type === 'p2p';
  const propertyImage = item.property?.images?.[0] || "/placeholder-property.jpg";

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={isP2P ? `/token-marketplace/${item.listingId}` : `/buyers/tokens/${item._id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Property Image */}
        <div className="relative h-48 w-full">
          <Image
            src={propertyImage}
            alt={item.tokenName}
            fill
            className="object-cover"
          />
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={isP2P ? 'bg-purple-600' : 'bg-blue-600'}>
              {isP2P ? (
                <><Users className="w-3 h-3 mr-1" /> P2P</>
              ) : (
                <><Building className="w-3 h-3 mr-1" /> Official</>
              )}
            </Badge>
          </div>
          {/* Risk Level Badge */}
          {item.riskLevel && (
            <div className="absolute top-3 right-3">
              <Badge className={getRiskColor(item.riskLevel)}>
                {item.riskLevel.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Token Info */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
              {item.tokenName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <span className="font-mono font-semibold">{item.tokenSymbol}</span>
              {item.propertyType && (
                <>
                  <span className="mx-2">•</span>
                  <span>{item.propertyType}</span>
                </>
              )}
            </p>
          </div>

          {/* P2P Seller Info */}
          {isP2P && item.sellerName && (
            <div className="mb-3 text-sm text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>Seller: {item.sellerName}</span>
            </div>
          )}

          {/* Price & Availability */}
          <div className="mb-3 pb-3 border-b">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Price per token</span>
              <span className="font-bold text-lg">
                {item.currency} {item.tokenPrice?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available</span>
              <span className="font-semibold text-gray-900">
                {item.tokensAvailable?.toLocaleString()} tokens
              </span>
            </div>
          </div>

          {/* Expected Return */}
          {item.expectedReturn && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Expected Return</span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                {item.expectedReturn}
              </Badge>
            </div>
          )}

          {/* Funding Progress (Official only) */}
          {!isP2P && item.fundingProgress !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Funding Progress</span>
                <span className="font-semibold">{Math.round(item.fundingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(item.fundingProgress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <Button className="w-full mt-2" size="sm">
            {isP2P ? 'Buy Now' : 'View Details'}
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default TokenizedMarketplace;
