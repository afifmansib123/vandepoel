"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetTokenListingsQuery, useCancelTokenListingMutation, useUpdateTokenListingMutation } from "@/state/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tag, X, Edit, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const MyListingsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [editingListing, setEditingListing] = useState<any>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  const {
    data: listingsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTokenListingsQuery({
    myListings: true,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const [cancelListing] = useCancelTokenListingMutation();
  const [updateListing, { isLoading: isUpdating }] = useUpdateTokenListingMutation();

  const listings = listingsResponse?.data || [];

  const handleCancelListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to cancel this listing?")) return;

    try {
      await cancelListing(listingId).unwrap();
    } catch (error: any) {
      console.error('Failed to cancel listing:', error);
      alert(error?.data?.message || 'Failed to cancel listing');
    }
  };

  const handleUpdatePrice = async () => {
    if (!editingListing || newPrice <= 0) return;

    try {
      await updateListing({
        listingId: editingListing._id,
        pricePerToken: newPrice,
      }).unwrap();
      setEditingListing(null);
    } catch (error: any) {
      console.error('Failed to update listing:', error);
      alert(error?.data?.message || 'Failed to update listing');
    }
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="dashboard-container">
        <Header title="My Token Listings" subtitle="Manage your P2P token sales" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your listings. Please try again.
            <Button onClick={() => refetch()} variant="outline" className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeListings = listings.filter((l: any) => l.status === 'active');
  const soldListings = listings.filter((l: any) => l.status === 'sold');
  const cancelledListings = listings.filter((l: any) => l.status === 'cancelled');

  return (
    <div className="dashboard-container">
      {/* Header */}
      <Header title="My Token Listings" subtitle="Manage your P2P token sales" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold">{activeListings.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sold Listings</p>
              <p className="text-2xl font-bold">{soldListings.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold">{listings.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <Button
          variant={statusFilter === "active" ? "default" : "ghost"}
          onClick={() => setStatusFilter("active")}
          className="rounded-b-none"
        >
          Active ({activeListings.length})
        </Button>
        <Button
          variant={statusFilter === "sold" ? "default" : "ghost"}
          onClick={() => setStatusFilter("sold")}
          className="rounded-b-none"
        >
          Sold ({soldListings.length})
        </Button>
        <Button
          variant={statusFilter === "cancelled" ? "default" : "ghost"}
          onClick={() => setStatusFilter("cancelled")}
          className="rounded-b-none"
        >
          Cancelled ({cancelledListings.length})
        </Button>
        <Button
          variant={statusFilter === "all" ? "default" : "ghost"}
          onClick={() => setStatusFilter("all")}
          className="rounded-b-none"
        >
          All ({listings.length})
        </Button>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't created any token listings yet. Go to your portfolio to list tokens for sale.
          </p>
          <Link href="/buyers/portfolio">
            <Button>Go to Portfolio</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onCancel={handleCancelListing}
              onEdit={(l: any) => {
                setEditingListing(l);
                setNewPrice(l.pricePerToken);
              }}
            />
          ))}
        </div>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Listing Price</DialogTitle>
            <DialogDescription>
              Change the price per token for this listing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Price: {editingListing?.currency} {editingListing?.pricePerToken}</Label>
            </div>
            <div>
              <Label htmlFor="newPrice">New Price Per Token</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="newPrice"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                New Total Value: {editingListing?.currency}{" "}
                {(newPrice * editingListing?.tokensForSale)?.toLocaleString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrice} disabled={isUpdating || newPrice <= 0}>
              {isUpdating ? "Updating..." : "Update Price"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Listing Card Component
const ListingCard = ({ listing, onCancel, onEdit }: any) => {
  const propertyImage = listing.propertyId?.images?.[0] || "/placeholder-property.jpg";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const daysRemaining = listing.expiresAt
    ? Math.max(0, Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Card className="overflow-hidden">
      {/* Property Image */}
      <div className="relative h-40 w-full">
        <Image
          src={propertyImage}
          alt={listing.tokenName}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(listing.status)}>
            {listing.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {listing.tokenName}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {listing.tokenSymbol} • {listing.propertyType}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tokens for Sale</span>
            <span className="font-semibold">{listing.tokensForSale}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price per Token</span>
            <span className="font-semibold">
              {listing.currency} {listing.pricePerToken.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-600">Total Value</span>
            <span className="font-bold">
              {listing.currency} {listing.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {daysRemaining !== null && listing.status === 'active' && (
          <Alert className="mb-3">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
            </AlertDescription>
          </Alert>
        )}

        {listing.status === 'sold' && (
          <div className="mb-3 text-sm text-gray-600">
            <p>Sold to: {listing.buyerName || listing.buyerEmail}</p>
            <p className="text-xs text-gray-500">
              {new Date(listing.soldAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {listing.status === 'active' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(listing)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Price
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(listing._id)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        <Link href="/token-marketplace">
          <Button variant="link" className="w-full mt-2" size="sm">
            View in Marketplace
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default MyListingsPage;
