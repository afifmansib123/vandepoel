import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import TokenListing from '@/app/models/TokenListing';
import TokenInvestment from '@/app/models/TokenInvestment';
import PropertyToken from '@/app/models/PropertyToken';
import { getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';
import { sendNotification } from '@/app/lib/notifications';

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
  { params }: { params: { id: string } }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user || user.userRole?.toLowerCase() !== 'buyer') {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Only buyers can purchase tokens.' },
        { status: 401 }
      );
    }

    // Get buyer profile for name and email
    const Buyer = (await import('@/app/models/Buyer')).default;
    const buyerProfile = await Buyer.findOne({ cognitoId: user.userId });

    const body = await request.json();
    const { tokensToPurchase, paymentMethod = 'P2P Transfer' } = body;

    // Get the listing
    const listing = await TokenListing.findById(params.id).session(session);

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

    // Get seller's token investment
    const sellerInvestment = await TokenInvestment.findById(
      listing.tokenInvestmentId
    ).session(session);

    if (!sellerInvestment) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, message: 'Seller token investment not found' },
        { status: 404 }
      );
    }

    // Verify seller still owns enough tokens
    if (sellerInvestment.tokensOwned < tokensQty) {
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

    // 1. Update seller's investment (reduce tokens)
    sellerInvestment.tokensOwned -= tokensQty;
    sellerInvestment.ownershipPercentage =
      (sellerInvestment.tokensOwned / tokenOffering.totalTokens) * 100;

    // If seller has no more tokens, mark as sold
    if (sellerInvestment.tokensOwned === 0) {
      sellerInvestment.status = 'sold';
    }

    await sellerInvestment.save({ session });

    // 2. Create or update buyer's investment
    let buyerInvestment = await TokenInvestment.findOne({
      investorId: user.userId,
      tokenId: listing.tokenOfferingId,
      status: 'active',
    }).session(session);

    if (buyerInvestment) {
      // Update existing investment
      buyerInvestment.tokensOwned += tokensQty;
      buyerInvestment.totalInvestment += totalPurchaseAmount;
      buyerInvestment.ownershipPercentage =
        (buyerInvestment.tokensOwned / tokenOffering.totalTokens) * 100;
      await buyerInvestment.save({ session });
    } else {
      // Create new investment
      buyerInvestment = new TokenInvestment({
        investorId: user.userId,
        investorEmail: buyerProfile?.email || '',
        propertyId: listing.propertyId,
        tokenId: listing.tokenOfferingId,
        tokensOwned: tokensQty,
        purchasePrice: listing.pricePerToken,
        totalInvestment: totalPurchaseAmount,
        ownershipPercentage: (tokensQty / tokenOffering.totalTokens) * 100,
        paymentMethod,
        paymentStatus: 'success',
        status: 'active',
        purchaseDate: new Date(),
      });
      await buyerInvestment.save({ session });
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
      await sendNotification({
        userId: listing.sellerId,
        title: 'Token Sold!',
        message: `${buyerProfile?.name || buyerProfile?.email || 'A buyer'} purchased ${tokensQty} ${listing.tokenSymbol} tokens from your listing for ${totalPurchaseAmount} ${listing.currency}`,
        type: 'token_sale',
        link: '/buyers/portfolio',
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
        buyerInvestment,
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
