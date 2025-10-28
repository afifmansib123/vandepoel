"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetTokenPurchaseRequestsQuery, useUpdateTokenPurchaseRequestMutation } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  FileText,
  AlertCircle,
  Coins,
  Building,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LandlordTokenRequests = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const landlordId = authUser?.cognitoInfo?.userId;

  const { data: requestsResponse, isLoading, refetch } = useGetTokenPurchaseRequestsQuery(
    { page: 1, limit: 50, role: "seller" },
    { skip: !landlordId }
  );

  const [updateRequest] = useUpdateTokenPurchaseRequestMutation();

  // State for approve/reject dialogs
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

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
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const handleApprove = async () => {
    if (!approveDialog.requestId) return;

    try {
      await updateRequest({
        requestId: approveDialog.requestId,
        action: "approve",
        paymentInstructions: paymentInstructions,
      }).unwrap();
      setApproveDialog({ open: false, requestId: null });
      setPaymentInstructions("");
      refetch();
    } catch (error) {
      console.error("Failed to approve request:", error);
      toast.error("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.requestId || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await updateRequest({
        requestId: rejectDialog.requestId,
        action: "reject",
        rejectionReason: rejectionReason,
      }).unwrap();
      setRejectDialog({ open: false, requestId: null });
      setRejectionReason("");
      refetch();
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast.error("Failed to reject request. Please try again.");
    }
  };

  const handleConfirmPayment = async (requestId: string) => {
    if (!confirm("Confirm that you have received payment from the buyer?")) return;

    try {
      await updateRequest({
        requestId,
        action: "confirmPayment",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      toast.error("Failed to confirm payment. Please try again.");
    }
  };

  const handleAssignTokens = async (requestId: string) => {
    if (!confirm("Assign tokens to the buyer? This will update your token offering.")) return;

    try {
      await updateRequest({
        requestId,
        action: "assignTokens",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to assign tokens:", error);
      toast.error("Failed to assign tokens. Please try again.");
    }
  };

  const handleComplete = async (requestId: string) => {
    if (!confirm("Mark this request as completed?")) return;

    try {
      await updateRequest({
        requestId,
        action: "complete",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to complete request:", error);
      toast.error("Failed to complete request. Please try again.");
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
        title="Token Purchase Requests"
        subtitle="Manage incoming investment requests for your tokenized properties"
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
            When buyers submit investment requests, they'll appear here
          </p>
          <Link href="/landlords/token-offerings">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Coins className="w-4 h-4 mr-2" />
              View My Token Offerings
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
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{offering?.tokenName || property?.name}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {getStatusText(request.status)}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Request #{request.requestId} • Received {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Buyer Information - PROMINENT */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Buyer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-600">Name</p>
                          <p className="font-semibold">{request.buyerName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-600">Email</p>
                          <p className="font-semibold">{request.buyerEmail}</p>
                        </div>
                      </div>
                      {request.buyerPhone && (
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600">Phone</p>
                            <p className="font-semibold">{request.buyerPhone}</p>
                          </div>
                        </div>
                      )}
                      {request.buyerAddress && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600">Address</p>
                            <p className="font-semibold">{request.buyerAddress}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Investment Details */}
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

                  {/* Investment Purpose & Message */}
                  {(request.investmentPurpose || request.message) && (
                    <div className="space-y-4 mb-6">
                      {request.investmentPurpose && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Investment Purpose
                          </p>
                          <p className="text-sm text-gray-900">{request.investmentPurpose}</p>
                        </div>
                      )}
                      {request.message && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Buyer's Message
                          </p>
                          <p className="text-sm text-gray-900">{request.message}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status-specific Actions */}
                  {request.status === "pending" && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-900">Action Required</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Review the buyer's information and decide whether to approve or reject this request.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setApproveDialog({ open: true, requestId: request._id })}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button
                          onClick={() => setRejectDialog({ open: true, requestId: request._id })}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Request
                        </Button>
                      </div>
                    </div>
                  )}

                  {request.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900">Request Approved</p>
                          <p className="text-sm text-green-700 mt-1">
                            Waiting for buyer to make payment. Payment instructions have been sent.
                          </p>
                          {request.sellerPaymentInstructions && (
                            <div className="mt-3 bg-white p-3 rounded border border-green-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Your Payment Instructions:</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">{request.sellerPaymentInstructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === "payment_pending" && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">Payment Proof Received</p>
                          <p className="text-sm text-blue-700 mt-1">
                            The buyer has uploaded payment proof. Please verify the payment before confirming.
                          </p>
                          {request.paymentProof && (
                            <div className="mt-3 bg-white p-3 rounded border border-blue-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Payment Proof:</p>
                              <a href={request.paymentProof} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                View Payment Proof →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleConfirmPayment(request._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Payment Received
                      </Button>
                    </div>
                  )}

                  {request.status === "payment_confirmed" && (
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-purple-900">Payment Confirmed</p>
                          <p className="text-sm text-purple-700 mt-1">
                            Now assign the tokens to the buyer. This will update your token offering.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignTokens(request._id)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Assign {request.tokensRequested} Tokens to Buyer
                      </Button>
                    </div>
                  )}

                  {request.status === "tokens_assigned" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">Tokens Assigned!</p>
                          <p className="text-sm text-green-700 mt-1">
                            {request.tokensRequested} tokens have been assigned to {request.buyerName}.
                          </p>
                          {request.tokensAssignedAt && (
                            <p className="text-xs text-green-600 mt-2">
                              Assigned on {new Date(request.tokensAssignedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleComplete(request._id)}
                        variant="outline"
                        className="w-full"
                      >
                        Mark as Completed
                      </Button>
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

                  {/* View Offering Link */}
                  <div className="mt-6">
                    <Link href={`/landlords/token-offerings`}>
                      <Button variant="outline" size="sm">
                        <Building className="w-4 h-4 mr-2" />
                        View Token Offering
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, requestId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Provide payment instructions for the buyer. They will receive this information via email.
            </p>
            <div>
              <Label htmlFor="paymentInstructions">Payment Instructions *</Label>
              <Textarea
                id="paymentInstructions"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Bank Name: &#10;Account Number: &#10;SWIFT/BIC: &#10;Reference: Request #xxx"
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setApproveDialog({ open: false, requestId: null })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!paymentInstructions.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Approve & Send Instructions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, requestId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this request. The buyer will be notified.
            </p>
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why you're rejecting this request..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, requestId: null })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandlordTokenRequests;
