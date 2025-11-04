import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import TokenListing from '@/app/models/TokenListing';
import TokenPurchaseRequest from '@/app/models/TokenPurchaseRequest';
import PropertyToken from '@/app/models/PropertyToken';
import SellerProperty from '@/app/models/SellerProperty';
import { getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';
import { createNotification } from '@/lib/notifications';

/**
 * POST /api/tokens/listings/[id]/purchase
 *
 * Purchase tokens from a P2P listing
 * Transfers token ownership from seller to buyer
 *
 * Body:
 * - tokensToPurchase: number (optional, defaults to all available)
 * - paymentMethod: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    // Get buyer profile for name and email
    const Buyer = (await import('@/app/models/Buyer')).default;
    const buyerProfile = await Buyer.findOne({ cognitoId: user.userId });

    const body = await request.json();
    const { tokensToPurchase, proposedPaymentMethod = 'P2P Transfer' } = body;

    // Get the listing
    const { id } = await params;
    const listing = await TokenListing.findById(id).session(session);

    if (!listing) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Token listing not found' },
        { status: 404 }
      );
    }

    // Verify listing is active
    if (listing.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          success: false,
          message: `Cannot purchase from listing with status: ${listing.status}`,
        },
        { status: 400 }
      );
    }

    // Check if trying to buy own listing
    if (listing.sellerId === user.userId) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Cannot purchase your own listing' },
        { status: 400 }
      );
    }

    // Determine how many tokens to purchase
    const tokensQty = tokensToPurchase || listing.tokensForSale;

    if (tokensQty > listing.tokensForSale) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          success: false,
          message: `Only ${listing.tokensForSale} tokens available in this listing`,
        },
        { status: 400 }
      );
    }

    if (tokensQty < 1) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Must purchase at least 1 token' },
        { status: 400 }
      );
    }

    // Calculate purchase amount
    const totalPurchaseAmount = tokensQty * listing.pricePerToken;

    // Get seller's token purchase request
    const sellerPurchaseRequest = await TokenPurchaseRequest.findById(
      listing.tokenInvestmentId
    ).session(session);

    if (!sellerPurchaseRequest) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Seller token purchase request not found' },
        { status: 404 }
      );
    }

    // Verify seller still owns enough tokens
    if (sellerPurchaseRequest.tokensRequested < tokensQty) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          success: false,
          message: 'Seller no longer owns enough tokens',
        },
        { status: 400 }
      );
    }

    // Get token offering details
    const tokenOffering = await PropertyToken.findById(
      listing.tokenOfferingId
    ).session(session);

    if (!tokenOffering) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Token offering not found' },
        { status: 404 }
      );
    }

    // Get property details for sellerId
    const property = await SellerProperty.findById(
      listing.propertyId
    ).session(session);

    if (!property) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }

    // --- Reserve the listing for this buyer ---
    // Note: Tokens will be transferred later when seller confirms payment and assigns tokens

    // Check if seller is a landlord or buyer (for notification routing)
    const Landlord = (await import('@/app/models/Landlord')).default;
    const sellerProfile = await Landlord.findOne({ cognitoId: property.sellerCognitoId });
    const isSellerLandlord = !!sellerProfile;
    const sellerDashboardUrl = isSellerLandlord ? '/landlords/token-requests' : '/buyers/token-requests';

    // 2. Create or update buyer's purchase request
    let buyerPurchaseRequest = await TokenPurchaseRequest.findOne({
      buyerId: user.userId,
      propertyId: listing.propertyId,
      tokenOfferingId: listing.tokenOfferingId,
      status: { $in: ['tokens_assigned', 'completed'] },
    }).session(session);

    if (buyerPurchaseRequest) {
      // Update existing purchase request
      buyerPurchaseRequest.tokensRequested += tokensQty;
      buyerPurchaseRequest.totalAmount += totalPurchaseAmount;
      await buyerPurchaseRequest.save({ session });
    } else {
      // Generate requestId manually (pre-save hook doesn't work well with transactions)
      const latestRequest = await TokenPurchaseRequest.findOne()
        .sort({ requestId: -1 })
        .session(session);
      const requestId = latestRequest ? latestRequest.requestId + 1 : 1000;

      // Create new purchase request for P2P purchase
      // Status is 'approved' since the listing itself represents seller approval
      // Buyer will need to upload payment proof and seller will confirm payment
      buyerPurchaseRequest = new TokenPurchaseRequest({
        requestId,
        buyerId: user.userId,
        buyerName: buyerProfile?.name || buyerProfile?.email || 'Unknown',
        buyerEmail: buyerProfile?.email || '',
        sellerId: property.sellerCognitoId,
        sellerName: sellerProfile?.name || property.managedBy || '',
        sellerEmail: sellerProfile?.email || '',
        propertyId: listing.propertyId,
        tokenOfferingId: listing.tokenOfferingId,
        tokensRequested: tokensQty,
        pricePerToken: listing.pricePerToken,
        totalAmount: totalPurchaseAmount,
        currency: listing.currency,
        proposedPaymentMethod: proposedPaymentMethod,
        message: `P2P purchase from listing ${listing._id}. Seller request: ${listing.tokenInvestmentId}`,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: property.sellerCognitoId,
        sellerPaymentInstructions: 'Please upload proof of payment after completing the transfer.',
      });
      await buyerPurchaseRequest.save({ session });
    }

    // 3. Update listing status - reserve it for this buyer
    // Mark as sold to prevent other buyers from purchasing
    // Tokens will actually transfer when payment is confirmed
    listing.status = 'sold';
    listing.soldAt = new Date();
    listing.buyerId = user.userId;
    listing.buyerName = buyerProfile?.name || buyerProfile?.email || 'Unknown';
    listing.buyerEmail = buyerProfile?.email || '';

    await listing.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send notifications (outside transaction)
    try {
      // Notify seller about purchase request
      await createNotification({
        userId: listing.sellerId,
        type: 'token_request',
        title: 'P2P Token Purchase Request',
        message: `${buyerProfile?.name || buyerProfile?.email || 'A buyer'} wants to purchase ${tokensQty} ${listing.tokenSymbol} tokens from your listing for ${totalPurchaseAmount} ${listing.currency}. Waiting for payment proof.`,
        relatedId: buyerPurchaseRequest._id.toString(),
        relatedUrl: sellerDashboardUrl,
        priority: 'high',
      });

      // Notify buyer about next steps
      await createNotification({
        userId: user.userId,
        type: 'token_request',
        title: 'Purchase Request Approved',
        message: `Your purchase request for ${tokensQty} ${listing.tokenSymbol} tokens has been approved. Please upload proof of payment to complete the transaction.`,
        relatedId: buyerPurchaseRequest._id.toString(),
        relatedUrl: '/buyers/token-requests',
        priority: 'high',
      });
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase request created successfully. Please upload proof of payment to complete the transaction.',
      data: {
        purchaseRequest: buyerPurchaseRequest,
        tokensPurchased: tokensQty,
        totalAmount: totalPurchaseAmount,
        currency: listing.currency,
        nextStep: 'Upload payment proof in your token requests dashboard',
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error purchasing tokens from listing:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to purchase tokens',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
