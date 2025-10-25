"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import TokenOfferingCard from "@/components/TokenOfferingCard";
import { useGetTokenOfferingsQuery } from "@/state/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, TrendingUp, DollarSign, Shield } from "lucide-react";

const TokenMarketplace = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    propertyType: "",
    riskLevel: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: offeringsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTokenOfferingsQuery({
    page,
    limit: 12,
    ...filters,
  });

  const offerings = offeringsResponse?.data || [];
  const pagination = offeringsResponse?.pagination;

  // Filter by search term locally
  const filteredOfferings = offerings.filter((offering: any) =>
    offering.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offering.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
    setPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilters({ propertyType: "", riskLevel: "" });
    setSearchTerm("");
    setPage(1);
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="dashboard-container">
        <Header
          title="Token Marketplace"
          subtitle="Invest in fractional real estate ownership"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Token Offerings
            </h3>
            <p className="text-red-700 mb-4">
              We encountered an issue while fetching token offerings. Please try again.
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
    <div className="dashboard-container">
      {/* Header */}
      <Header
        title="Token Marketplace"
        subtitle="Invest in fractional real estate ownership through tokenized properties"
      />

      {/* Info Banner */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Low Entry Barrier</h4>
            <p className="text-sm text-blue-700">Start investing from as low as $100</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900 mb-1">Passive Income</h4>
            <p className="text-sm text-green-700">Earn dividends regularly from rental income</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <div className="bg-purple-500 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">Secure Investment</h4>
            <p className="text-sm text-purple-700">All properties are verified and insured</p>
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
              placeholder="Search by token name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={filters.propertyType || "all"} onValueChange={(value) => handleFilterChange("propertyType", value)}>
            <SelectTrigger className="w-[180px]">
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

          {(filters.propertyType || filters.riskLevel || searchTerm) && (
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          <span className="font-semibold">{filteredOfferings.length}</span> token offering
          {filteredOfferings.length !== 1 ? "s" : ""} available
        </p>
        {pagination && (
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
        )}
      </div>

      {/* Token Offerings Grid */}
      {filteredOfferings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOfferings.map((offering: any) => (
            <TokenOfferingCard
              key={offering._id}
              offering={offering}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Token Offerings Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.propertyType || filters.riskLevel
                ? "Try adjusting your filters to see more results."
                : "There are currently no active token offerings available."}
            </p>
            {(filters.propertyType || filters.riskLevel || searchTerm) && (
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

export default TokenMarketplace;
