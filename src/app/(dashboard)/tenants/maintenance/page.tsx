"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery } from "@/state/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Wrench, Calendar, Info, Clock, Check, RefreshCcw, AlertTriangle, Home, Eye } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// --- Type Definitions ---
interface PopulatedProperty {
  _id: string;
  name: string;
  photoUrls?: string[];
}

interface MaintenanceRequest {
  _id: string;
  propertyId: PopulatedProperty;
  tenantId: string;
  managerId: string;
  landlordId?: string;
  category: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Details Modal Component ---
const RequestDetailsModal = ({
  request,
  isOpen,
  onClose,
}: {
  request: MaintenanceRequest | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!request) return null;

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      Low: { color: "bg-green-100 text-green-800", icon: <Info className="h-3 w-3" /> },
      Medium: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      High: { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.Low;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {urgency}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> },
      "In Progress": { color: "bg-blue-100 text-blue-800", icon: <RefreshCcw className="h-3 w-3" /> },
      Completed: { color: "bg-green-100 text-green-800", icon: <Check className="h-3 w-3" /> },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl font-bold text-gray-900">Maintenance Request Details</DialogTitle>
          <p className="text-sm text-gray-500">Request ID: {request._id}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Property Information */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Property Name</p>
                <p className="text-gray-900">{request.propertyId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Property ID</p>
                <p className="text-gray-900 font-mono text-sm">{request.propertyId?._id || 'N/A'}</p>
              </div>
            </div>
            {request.propertyId?.photoUrls && request.propertyId.photoUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Property Photos</p>
                <div className="flex gap-2 overflow-x-auto">
                  {request.propertyId.photoUrls.slice(0, 3).map((url, index) => (
                    <div key={index} className="flex-shrink-0">
                      <Image
                        src={url}
                        alt={`Property photo ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Request Information */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Request Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Category</p>
                <p className="text-gray-900">{request.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Urgency</p>
                {getUrgencyBadge(request.urgency)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                {getStatusBadge(request.status)}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-gray-900 mt-1">{request.description}</p>
            </div>

            {/* Images if available */}
            {request.imageUrls && request.imageUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Attached Images</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {request.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`Issue photo ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Information */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Created At</p>
                <p className="text-gray-900">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Updated</p>
                <p className="text-gray-900">{new Date(request.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page Component ---
const TenantMaintenancePage = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const tenantId = authUser?.cognitoInfo?.userId;

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "Pending" | "In Progress" | "Completed">("all");

  const fetchRequests = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/maintenance-requests?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance requests.');
      const data = await response.json();
      setRequests(data.data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tenantId]);

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((req) =>
        req.propertyId?.name?.toLowerCase().includes(query) ||
        req.category.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.urgency.toLowerCase().includes(query) ||
        req.status.toLowerCase().includes(query) ||
        req._id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [requests, searchQuery, filterStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> },
      "In Progress": { color: "bg-blue-100 text-blue-800", icon: <RefreshCcw className="h-3 w-3" /> },
      Completed: { color: "bg-green-100 text-green-800", icon: <Check className="h-3 w-3" /> },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      Low: { color: "bg-green-100 text-green-800", icon: <Info className="h-3 w-3" /> },
      Medium: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      High: { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.Low;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {urgency}
      </Badge>
    );
  };

  const statusCounts = {
    all: requests.length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    "In Progress": requests.filter(r => r.status === 'In Progress').length,
    Completed: requests.filter(r => r.status === 'Completed').length,
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="dashboard-container">
        <Header title="My Maintenance Requests" subtitle="Track your submitted maintenance requests." />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Requests</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchRequests} variant="outline">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header title="My Maintenance Requests" subtitle="Track your submitted maintenance requests and their status." />

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              filterStatus === status
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {status === "all" ? "All Requests" : status}
            <span className={`text-xs px-2 py-0.5 rounded-full ${filterStatus === status ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}`}>
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by property, category, description, urgency, status, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <TableRow key={req._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{req.propertyId?.name || 'Unknown Property'}</p>
                      <p className="text-sm text-gray-500 font-mono">{req.propertyId?._id || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400" />
                      {req.category}
                    </div>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(req.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(req.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRequest(req)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  <div className="flex flex-col items-center justify-center">
                    <Wrench className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      {searchQuery || filterStatus !== "all"
                        ? "No maintenance requests found matching your criteria."
                        : "No maintenance requests yet. Submit one from your property page!"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
};

export default TenantMaintenancePage;
