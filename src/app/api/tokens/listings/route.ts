import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import TokenListing from '@/app/models/TokenListing';
import TokenInvestment from '@/app/models/TokenInvestment';
import PropertyToken from '@/app/models/PropertyToken';
import SellerProperty from '@/app/models/SellerProperty';
import { getCurrentUser } from '@/app/lib/auth';

/**
 * POST /api/tokens/listings
 *
 * Create a new P2P token listing
 * Buyer lists their owned tokens for sale
 *
 * Body:
 * - tokenInvestmentId: string
 * - tokensForSale: number
 * - pricePerToken: number
 * - description?: string
 * - expiresInDays?: number
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getCurrentUser();
    if (!user || user.userType !== 'buyer') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Only buyers can create listings.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      tokenInvestmentId,
      tokensForSale,
      pricePerToken,
      description,
      expiresInDays,
    } = body;

    // Validate required fields
    if (!tokenInvestmentId || !tokensForSale || !pricePerToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: tokenInvestmentId, tokensForSale, pricePerToken',
        },
        { status: 400 }
      );
    }

    if (tokensForSale < 1 || pricePerToken < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid values: tokensForSale must be >= 1, pricePerToken must be >= 0',
        },
        { status: 400 }
      );
    }

    // Get the token investment
    const investment = await TokenInvestment.findById(tokenInvestmentId)
      .populate('propertyId')
      .populate('tokenId');

    if (!investment) {
      return NextResponse.json(
        { success: false, message: 'Token investment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (investment.investorId !== user.cognitoId) {
      return NextResponse.json(
        { success: false, message: 'You do not own this token investment' },
        { status: 403 }
      );
    }

    // Verify token status is active
    if (investment.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot list tokens with status: ${investment.status}`,
        },
        { status: 400 }
      );
    }

    // Check available tokens (owned - already listed)
    const existingListings = await TokenListing.find({
      tokenInvestmentId,
      status: 'active',
    });

    const tokensAlreadyListed = existingListings.reduce(
      (sum, listing) => sum + listing.tokensForSale,
      0
    );

    const availableToList = investment.tokensOwned - tokensAlreadyListed;

    if (tokensForSale > availableToList) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient tokens. You own ${investment.tokensOwned} tokens, ${tokensAlreadyListed} already listed. Available: ${availableToList}`,
        },
        { status: 400 }
      );
    }

    // Get property and token offering details
    const property: any = investment.propertyId;
    const tokenOffering: any = investment.tokenId;

    // Determine currency from property location
    const currency = property?.location?.country === 'Thailand' ? 'THB' : 'EUR';

    // Calculate expiration date if provided
    let expiresAt;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create the listing
    const listing = new TokenListing({
      sellerId: user.cognitoId,
      sellerName: user.name || user.email,
      sellerEmail: user.email,
      tokenInvestmentId,
      propertyId: investment.propertyId,
      tokenOfferingId: investment.tokenId,
      tokensForSale,
      pricePerToken,
      totalPrice: tokensForSale * pricePerToken,
      currency,
      propertyName: property?.propertyTitle,
      tokenName: tokenOffering?.tokenName,
      tokenSymbol: tokenOffering?.tokenSymbol,
      propertyType: tokenOffering?.propertyType,
      riskLevel: tokenOffering?.riskLevel,
      description,
      expiresAt,
      status: 'active',
    });

    await listing.save();

    return NextResponse.json({
      success: true,
      message: 'Token listing created successfully',
      data: listing,
    });
  } catch (error: any) {
    console.error('Error creating token listing:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create token listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tokens/listings
 *
 * Get token listings
 * Query params:
 * - myListings: boolean (get only current user's listings)
 * - status: string (filter by status)
 * - page: number
 * - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const myListings = searchParams.get('myListings') === 'true';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    let filter: any = {};

    // If requesting own listings, require authentication
    if (myListings) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
      filter.sellerId = user.cognitoId;
    }

    if (status) {
      filter.status = status;
    }

    const [listings, total] = await Promise.all([
      TokenListing.find(filter)
        .populate({
          path: 'propertyId',
          model: SellerProperty,
          select: 'propertyTitle location images propertyType',
        })
        .populate({
          path: 'tokenOfferingId',
          model: PropertyToken,
          select: 'tokenName tokenSymbol expectedReturn dividendFrequency',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TokenListing.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching token listings:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch token listings',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
