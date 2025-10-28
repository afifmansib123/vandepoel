import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import TokenPurchaseRequest from "@/app/models/TokenPurchaseRequest";
import PropertyToken from "@/app/models/PropertyToken";
import Property from "@/app/models/Property";
import { getUserFromToken } from "@/lib/auth";
import { createNotification, TokenNotificationMessages } from "@/lib/notifications";
import SellerProperty from "@/app/models/SellerProperty";

/**
 * GET /api/tokens/purchase-requests/[id]
 * Get specific purchase request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const purchaseRequest = await TokenPurchaseRequest.findById(params.id)
      .populate({
        path: "propertyId",
        select: "title location price images propertyType sellerCognitoId",
      })
      .populate({
        path: "tokenOfferingId",
        select: "tokenName tokenSymbol tokenPrice totalTokens tokensSold",
      });

    if (!purchaseRequest) {
      return NextResponse.json(
        { success: false, message: "Purchase request not found" },
        { status: 404 }
      );
    }

    // Check authorization - buyer or seller can view
    const property = purchaseRequest.propertyId as any;
    const isBuyer = purchaseRequest.buyerId === user.userId;
    const isSeller = property?.sellerCognitoId === user.userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to view this request" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseRequest,
    });
  } catch (error: any) {
    console.error("Error fetching purchase request:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tokens/purchase-requests/[id]
 * Update purchase request status and details
 *
 * Actions:
 * - approve: Seller approves request
 * - reject: Seller rejects request
 * - confirmPayment: Seller confirms payment received
 * - uploadPaymentProof: Buyer uploads payment proof
 * - assignTokens: Seller assigns tokens to buyer
 * - cancel: Buyer or seller cancels request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, paymentProof, rejectionReason, paymentInstructions } = body;

    const purchaseRequest = await TokenPurchaseRequest.findById(params.id).populate("propertyId");
    if (!purchaseRequest) {
      return NextResponse.json(
        { success: false, message: "Purchase request not found" },
        { status: 404 }
      );
    }

    const property = purchaseRequest.propertyId as any;
    const isBuyer = purchaseRequest.buyerId === user.userId;
    const isSeller = property?.sellerCognitoId === user.userId;

    // Handle different actions
    switch (action) {
      case "approve":
        // Only seller can approve
        if (!isSeller) {
          return NextResponse.json(
            { success: false, message: "Only seller can approve requests" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "pending") {
          return NextResponse.json(
            { success: false, message: "Can only approve pending requests" },
            { status: 400 }
          );
        }

        purchaseRequest.status = "approved";
        purchaseRequest.approvedAt = new Date();
        purchaseRequest.approvedBy = user.userId;

        if (paymentInstructions) {
          purchaseRequest.sellerPaymentInstructions = paymentInstructions;
        }

        await purchaseRequest.save();

        // Send notification to buyer
        const approveMsg = TokenNotificationMessages.REQUEST_APPROVED(property.name || 'the property');
        await createNotification({
          userId: purchaseRequest.buyerId,
          type: 'token_request',
          title: approveMsg.title,
          message: approveMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: `/buyers/token-requests`,
          priority: 'high',
        });

        return NextResponse.json({
          success: true,
          message: "Purchase request approved",
          data: purchaseRequest,
        });

      case "reject":
        // Only seller can reject
        if (!isSeller) {
          return NextResponse.json(
            { success: false, message: "Only seller can reject requests" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "pending") {
          return NextResponse.json(
            { success: false, message: "Can only reject pending requests" },
            { status: 400 }
          );
        }

        purchaseRequest.status = "rejected";
        purchaseRequest.rejectedAt = new Date();
        purchaseRequest.rejectedBy = user.userId;
        purchaseRequest.rejectionReason = rejectionReason;

        await purchaseRequest.save();

        // Send notification to buyer
        const rejectMsg = TokenNotificationMessages.REQUEST_REJECTED(property.name || 'the property', rejectionReason);
        await createNotification({
          userId: purchaseRequest.buyerId,
          type: 'token_request',
          title: rejectMsg.title,
          message: rejectMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: `/buyers/token-requests`,
          priority: 'medium',
        });

        return NextResponse.json({
          success: true,
          message: "Purchase request rejected",
          data: purchaseRequest,
        });

      case "uploadPaymentProof":
        // Only buyer can upload payment proof
        if (!isBuyer) {
          return NextResponse.json(
            { success: false, message: "Only buyer can upload payment proof" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "approved") {
          return NextResponse.json(
            { success: false, message: "Request must be approved before payment" },
            { status: 400 }
          );
        }

        if (!paymentProof) {
          return NextResponse.json(
            { success: false, message: "Payment proof URL is required" },
            { status: 400 }
          );
        }

        purchaseRequest.paymentProof = paymentProof;
        purchaseRequest.status = "payment_pending";
        purchaseRequest.paymentSubmittedAt = new Date();

        await purchaseRequest.save();

        // Send notification to seller
        const paymentProofMsg = TokenNotificationMessages.PAYMENT_PROOF_SUBMITTED(
          purchaseRequest.buyerName,
          property.name || 'the property'
        );
        await createNotification({
          userId: purchaseRequest.sellerId,
          type: 'payment',
          title: paymentProofMsg.title,
          message: paymentProofMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: `/landlords/token-requests`,
          priority: 'high',
        });

        return NextResponse.json({
          success: true,
          message: "Payment proof uploaded",
          data: purchaseRequest,
        });

      case "confirmPayment":
        // Only seller can confirm payment
        if (!isSeller) {
          return NextResponse.json(
            { success: false, message: "Only seller can confirm payment" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "payment_pending") {
          return NextResponse.json(
            { success: false, message: "No payment pending for this request" },
            { status: 400 }
          );
        }

        purchaseRequest.status = "payment_confirmed";
        purchaseRequest.paymentConfirmedAt = new Date();
        purchaseRequest.paymentConfirmedBy = user.userId;

        await purchaseRequest.save();

        // Send notification to buyer
        const paymentConfirmedMsg = TokenNotificationMessages.PAYMENT_CONFIRMED(property.name || 'the property');
        await createNotification({
          userId: purchaseRequest.buyerId,
          type: 'payment',
          title: paymentConfirmedMsg.title,
          message: paymentConfirmedMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: `/buyers/token-requests`,
          priority: 'high',
        });

        return NextResponse.json({
          success: true,
          message: "Payment confirmed",
          data: purchaseRequest,
        });

      case "assignTokens":
        // Only seller can assign tokens
        if (!isSeller) {
          return NextResponse.json(
            { success: false, message: "Only seller can assign tokens" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "payment_confirmed") {
          return NextResponse.json(
            { success: false, message: "Payment must be confirmed before assigning tokens" },
            { status: 400 }
          );
        }

        // Update token offering - increment tokensSold
        const tokenOffering = await PropertyToken.findById(purchaseRequest.tokenOfferingId);
        if (!tokenOffering) {
          return NextResponse.json(
            { success: false, message: "Token offering not found" },
            { status: 404 }
          );
        }

        // Check if tokens are still available
        const availableTokens = tokenOffering.totalTokens - tokenOffering.tokensSold;
        if (purchaseRequest.tokensRequested > availableTokens) {
          return NextResponse.json(
            { success: false, message: "Not enough tokens available" },
            { status: 400 }
          );
        }

        // Increment tokensSold
        tokenOffering.tokensSold += purchaseRequest.tokensRequested;
        tokenOffering.investorCount += 1;

        // Check if fully funded
        if (tokenOffering.tokensSold >= tokenOffering.totalTokens) {
          tokenOffering.status = "funded";
        }

        await tokenOffering.save();

        // Update request status
        purchaseRequest.status = "tokens_assigned";
        purchaseRequest.tokensAssignedAt = new Date();

        await purchaseRequest.save();

        // Send notification to buyer
        const tokensAssignedMsg = TokenNotificationMessages.TOKENS_ASSIGNED(
          purchaseRequest.tokensRequested,
          property.name || 'the property'
        );
        await createNotification({
          userId: purchaseRequest.buyerId,
          type: 'token_request',
          title: tokensAssignedMsg.title,
          message: tokensAssignedMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: `/buyers/portfolio`,
          priority: 'high',
        });

        return NextResponse.json({
          success: true,
          message: "Tokens assigned successfully",
          data: purchaseRequest,
        });

      case "complete":
        // Mark as completed (final step)
        if (!isSeller) {
          return NextResponse.json(
            { success: false, message: "Only seller can complete request" },
            { status: 403 }
          );
        }

        if (purchaseRequest.status !== "tokens_assigned") {
          return NextResponse.json(
            { success: false, message: "Tokens must be assigned before completing" },
            { status: 400 }
          );
        }

        purchaseRequest.status = "completed";
        purchaseRequest.completedAt = new Date();

        await purchaseRequest.save();

        return NextResponse.json({
          success: true,
          message: "Purchase request completed",
          data: purchaseRequest,
        });

      case "cancel":
        // Buyer or seller can cancel before payment
        if (!isBuyer && !isSeller) {
          return NextResponse.json(
            { success: false, message: "Unauthorized to cancel this request" },
            { status: 403 }
          );
        }

        // Cannot cancel if payment already confirmed
        if (["payment_confirmed", "tokens_assigned", "completed"].includes(purchaseRequest.status)) {
          return NextResponse.json(
            { success: false, message: "Cannot cancel at this stage" },
            { status: 400 }
          );
        }

        purchaseRequest.status = "cancelled";
        purchaseRequest.cancelledAt = new Date();
        purchaseRequest.cancelledBy = user.userId;

        await purchaseRequest.save();

        // Send notification to other party (buyer or seller)
        const otherPartyId = isBuyer ? purchaseRequest.sellerId : purchaseRequest.buyerId;
        const cancelMsg = TokenNotificationMessages.REQUEST_CANCELLED(property.name || 'the property');
        await createNotification({
          userId: otherPartyId,
          type: 'token_request',
          title: cancelMsg.title,
          message: cancelMsg.message,
          relatedId: purchaseRequest._id.toString(),
          relatedUrl: isBuyer ? `/landlords/token-requests` : `/buyers/token-requests`,
          priority: 'medium',
        });

        return NextResponse.json({
          success: true,
          message: "Purchase request cancelled",
          data: purchaseRequest,
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error updating purchase request:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update request" },
      { status: 500 }
    );
  }
}
