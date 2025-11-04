import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import TokenListing from '@/app/models/TokenListing';
import TokenPurchaseRequest from '@/app/models/TokenPurchaseRequest';
import PropertyToken from '@/app/models/PropertyToken';
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
    const { tokensToPurchase, paymentMethod = 'P2P Transfer' } = body;

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

    // --- Execute the transfer ---

    // 1. Update seller's purchase request (reduce tokens)
    sellerPurchaseRequest.tokensRequested -= tokensQty;

    // If seller has no more tokens, mark as completed/transferred
    if (sellerPurchaseRequest.tokensRequested === 0) {
      sellerPurchaseRequest.status = 'completed';
    }

    await sellerPurchaseRequest.save({ session });

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
      // Create new purchase request for P2P purchase
      buyerPurchaseRequest = new TokenPurchaseRequest({
        buyerId: user.userId,
        buyerName: buyerProfile?.name || buyerProfile?.email || 'Unknown',
        buyerEmail: buyerProfile?.email || '',
        propertyId: listing.propertyId,
        tokenOfferingId: listing.tokenOfferingId,
        tokensRequested: tokensQty,
        pricePerToken: listing.pricePerToken,
        totalAmount: totalPurchaseAmount,
        currency: listing.currency,
        requestType: 'p2p_purchase',
        status: 'tokens_assigned',
        tokensAssignedAt: new Date(),
        approvedAt: new Date(),
        paymentConfirmedAt: new Date(),
      });
      await buyerPurchaseRequest.save({ session });
    }

    // 3. Update listing status
    if (tokensQty === listing.tokensForSale) {
      // All tokens sold, mark listing as sold
      listing.status = 'sold';
      listing.soldAt = new Date();
      listing.buyerId = user.userId;
      listing.buyerName = buyerProfile?.name || buyerProfile?.email || 'Unknown';
      listing.buyerEmail = buyerProfile?.email || '';
    } else {
      // Partial purchase, reduce available tokens
      listing.tokensForSale -= tokensQty;
      listing.totalPrice = listing.tokensForSale * listing.pricePerToken;
    }

    await listing.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send notification to seller (outside transaction)
    try {
      await createNotification({
        userId: listing.sellerId,
        type: 'system',
        title: 'Token Sold!',
        message: `${buyerProfile?.name || buyerProfile?.email || 'A buyer'} purchased ${tokensQty} ${listing.tokenSymbol} tokens from your listing for ${totalPurchaseAmount} ${listing.currency}`,
        relatedUrl: '/buyers/portfolio',
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens purchased successfully',
      data: {
        listing,
        buyerPurchaseRequest,
        tokensPurchased: tokensQty,
        totalAmount: totalPurchaseAmount,
        currency: listing.currency,
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
