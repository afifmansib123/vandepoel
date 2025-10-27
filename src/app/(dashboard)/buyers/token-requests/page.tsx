"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetTokenPurchaseRequestsQuery, useUpdateTokenPurchaseRequestMutation } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const BuyerTokenRequests = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const buyerId = authUser?.cognitoInfo?.userId;

  const { data: requestsResponse, isLoading, refetch } = useGetTokenPurchaseRequestsQuery(
    { page: 1, limit: 50, role: "buyer" },
    { skip: !buyerId }
  );

  const [updateRequest] = useUpdateTokenPurchaseRequestMutation();
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const requests = requestsResponse?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "payment_pending":
        return "bg-blue-100 text-blue-700";
      case "payment_confirmed":
        return "bg-purple-100 text-purple-700";
      case "tokens_assigned":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
        return "bg-gray-400 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
      case "payment_confirmed":
      case "tokens_assigned":
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "payment_pending":
        return <Upload className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, requestId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload an image (JPG, PNG, WEBP) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    handleUploadPaymentProof(requestId, file);
  };

  const handleUploadPaymentProof = async (requestId: string, file: File) => {
    if (!file) return;

    setUploadingFor(requestId);
    setUploadProgress("Uploading payment proof...");

    try {
      // First, upload file to S3
      const formData = new FormData();
      formData.append('paymentProof', file);

      const uploadResponse = await fetch(`/api/tokens/purchase-requests/${requestId}/upload-payment-proof`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || "Failed to upload file");
      }

      const uploadResult = await uploadResponse.json();
      const paymentProofUrl = uploadResult.data.url;

      setUploadProgress("Saving payment proof...");

      // Then, update the request with the URL
      await updateRequest({
        requestId,
        action: "uploadPaymentProof",
        paymentProof: paymentProofUrl,
      }).unwrap();

      setUploadProgress("");
      setSelectedFile(null);
      refetch();
      alert("Payment proof uploaded successfully!");
    } catch (error: any) {
      console.error("Failed to upload payment proof:", error);
      alert(error.message || "Failed to upload payment proof. Please try again.");
    } finally {
      setUploadingFor(null);
      setUploadProgress("");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      await updateRequest({
        requestId,
        action: "cancel",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  if (isLoading) return <Loading />;

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved" || r.status === "payment_pending").length,
    completed: requests.filter((r: any) => r.status === "completed" || r.status === "tokens_assigned").length,
  };

  return (
    <div className="dashboard-container">
      <Header
        title="My Token Purchase Requests"
        subtitle="Track your investment requests and payment status"
      />

      {/* Summary Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
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
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-blue-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Purchase Requests Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Browse the token marketplace and submit your first investment request
          </p>
          <Link href="/buyers/tokens">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Building className="w-4 h-4 mr-2" />
              Browse Token Offerings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request: any) => {
            const offering = request.tokenOfferingId;
            const property = request.propertyId;

            return (
              <Card key={request._id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{offering?.tokenName || property?.title}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {getStatusText(request.status)}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Request #{request.requestId} • Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tokens Requested</p>
                      <p className="text-xl font-bold">{request.tokensRequested.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(request.totalAmount, request.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="text-lg font-semibold">{request.proposedPaymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Currency</p>
                      <p className="text-lg font-semibold">{request.currency}</p>
                    </div>
                  </div>

                  {/* Status-specific content */}
                  {request.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">Request Approved!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Your request has been approved. Please proceed with payment.
                          </p>
                          {request.sellerPaymentInstructions && (
                            <div className="mt-3 bg-white p-3 rounded border border-green-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Payment Instructions:</p>
                              <p className="text-sm text-gray-900">{request.sellerPaymentInstructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <input
                          type="file"
                          id={`paymentProof-${request._id}`}
                          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                          onChange={(e) => handleFileSelect(e, request._id)}
                          className="hidden"
                          disabled={uploadingFor === request._id}
                        />
                        <label htmlFor={`paymentProof-${request._id}`}>
                          <Button
                            as="span"
                            disabled={uploadingFor === request._id}
                            className="bg-green-600 hover:bg-green-700 cursor-pointer"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingFor === request._id
                              ? (uploadProgress || "Uploading...")
                              : "Upload Payment Proof (Image/PDF)"}
                          </Button>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          Supported formats: JPG, PNG, WEBP, PDF (Max 10MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {request.status === "payment_pending" && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">Awaiting Payment Confirmation</p>
                          <p className="text-sm text-blue-700 mt-1">
                            The property owner is reviewing your payment proof.
                          </p>
                          {request.paymentSubmittedAt && (
                            <p className="text-xs text-blue-600 mt-2">
                              Submitted on {new Date(request.paymentSubmittedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === "payment_confirmed" && (
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-purple-900">Payment Confirmed!</p>
                          <p className="text-sm text-purple-700 mt-1">
                            Your payment has been confirmed. Tokens will be assigned shortly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === "tokens_assigned" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900">Tokens Assigned!</p>
                          <p className="text-sm text-green-700 mt-1">
                            {request.tokensAssigned} tokens have been assigned to your account.
                          </p>
                          {request.tokensAssignedAt && (
                            <p className="text-xs text-green-600 mt-2">
                              Assigned on {new Date(request.tokensAssignedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Request Rejected</p>
                          {request.rejectionReason && (
                            <p className="text-sm text-red-700 mt-1">
                              Reason: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional details */}
                  {request.message && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Your Message:</p>
                      <p className="text-sm text-gray-900">{request.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <Link href={`/buyers/tokens/${offering?._id}`}>
                      <Button variant="outline" size="sm">
                        View Offering
                      </Button>
                    </Link>
                    {request.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request._id)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Cancel Request
                      </Button>
                    )}
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

export default BuyerTokenRequests;
