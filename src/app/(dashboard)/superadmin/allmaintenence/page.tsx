"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, AlertTriangle, Home, User, Wrench, Calendar, Info, Clock, Check, RefreshCcw, Loader2 } from "lucide-react";
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
  category: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

// --- Details Modal Component (with Update Buttons) ---
const RequestDetailsModal = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}: {
  request: MaintenanceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!request) return null;

  const handleUpdateStatus = async (newStatus: 'In Progress' | 'Completed') => {
    setIsUpdating(true);
    try {
        const response = await fetch(`/api/maintenance-requests/${request._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to update status.');
        }
        toast.success(`Request status updated to "${newStatus}"`);
        onSuccess(); // Call the refetch function from the parent
        onClose();
    } catch (err: any) {
        toast.error(`Error: ${err.message}`);
    } finally {
        setIsUpdating(false);
    }
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
              <div>
                <p className="text-sm font-medium text-gray-700">Tenant ID</p>
                <p className="text-gray-900 font-mono text-sm">{request.tenantId}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-gray-900 mt-1">{request.description}</p>
            </div>
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

        <DialogFooter className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
          {/* Action Buttons */}
          {request.status !== 'Completed' && (
            <div className="flex gap-2">
                {request.status === 'Pending' && (
                    <Button 
                      onClick={() => handleUpdateStatus('In Progress')} 
                      disabled={isUpdating} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        Mark In Progress
                    </Button>
                )}
                <Button 
                  onClick={() => handleUpdateStatus('Completed')} 
                  disabled={isUpdating} 
                  className="bg-green-600 hover:bg-green-700"
                >
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Mark as Completed
                </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page Component ---
const SuperadminMaintenancePage = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const fetchAllRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/maintenance-requests');
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
    fetchAllRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter((req) =>
      req.propertyId?.name?.toLowerCase().includes(query) ||
      req.category.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.urgency.toLowerCase().includes(query) ||
      req.status.toLowerCase().includes(query) ||
      req._id.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

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

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="dashboard-container">
        <Header title="All Maintenance Requests" subtitle="View and manage all maintenance requests across the platform." />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Requests</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAllRequests} variant="outline">
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
      <Header title="All Maintenance Requests" subtitle="View and manage all maintenance requests across the platform." />
      
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
                    <Search className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No maintenance requests found.</p>
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
        onSuccess={fetchAllRequests}
      />
    </div>
  );
};

export default SuperadminMaintenancePage;