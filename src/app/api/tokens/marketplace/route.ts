import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/utils/dbConnect";
import PropertyToken from '@/app/models/PropertyToken';
import TokenListing from '@/app/models/TokenListing';
import SellerProperty from '@/app/models/SellerProperty';

/**
 * GET /api/tokens/marketplace
 *
 * Public endpoint to get combined marketplace data:
 * - Official token offerings from PropertyToken
 * - P2P token listings from TokenListing
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 12)
 * - propertyType: string (optional filter)
 * - riskLevel: string (optional filter)
 * - source: 'official' | 'p2p' | 'all' (default: 'all')
 * - sortBy: 'newest' | 'price-low' | 'price-high' (default: 'newest')
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const propertyType = searchParams.get('propertyType');
    const riskLevel = searchParams.get('riskLevel');
    const source = searchParams.get('source') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const skip = (page - 1) * limit;

    // Build filter for PropertyToken (official offerings)
    const tokenFilter: any = { status: 'active' };
    if (propertyType) tokenFilter.propertyType = propertyType;
    if (riskLevel) tokenFilter.riskLevel = riskLevel;

    // Build filter for TokenListing (P2P listings)
    const listingFilter: any = { status: 'active' };
    if (propertyType) listingFilter.propertyType = propertyType;
    if (riskLevel) listingFilter.riskLevel = riskLevel;

    let officialOfferings: any[] = [];
    let p2pListings: any[] = [];

    // Fetch official token offerings
    if (source === 'official' || source === 'all') {
      officialOfferings = await PropertyToken.find(tokenFilter)
        .populate({
          path: 'propertyId',
          model: SellerProperty,
          select: 'propertyTitle location images propertyType status',
        })
        .lean();

      // Transform official offerings to marketplace format
      officialOfferings = officialOfferings.map((token: any) => ({
        _id: token._id,
        type: 'official',
        tokenName: token.tokenName,
        tokenSymbol: token.tokenSymbol,
        tokenPrice: token.tokenPrice,
        totalTokens: token.totalTokens,
        tokensAvailable: token.tokensAvailable,
        tokensSold: token.tokensSold,
        minPurchase: token.minPurchase,
        maxPurchase: token.maxPurchase,
        expectedReturn: token.expectedReturn,
        riskLevel: token.riskLevel,
        propertyType: token.propertyType,
        propertyValue: token.propertyValue,
        dividendFrequency: token.dividendFrequency,
        description: token.description,
        offeringStartDate: token.offeringStartDate,
        offeringEndDate: token.offeringEndDate,
        property: token.propertyId,
        currency: token.propertyId?.location?.country === 'Thailand' ? 'THB' : 'EUR',
        fundingProgress: (token.tokensSold / token.totalTokens) * 100,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt,
      }));
    }

    // Fetch P2P listings
    if (source === 'p2p' || source === 'all') {
      p2pListings = await TokenListing.find(listingFilter)
        .populate({
          path: 'propertyId',
          model: SellerProperty,
          select: 'propertyTitle location images propertyType status',
        })
        .populate({
          path: 'tokenOfferingId',
          model: PropertyToken,
          select: 'expectedReturn dividendFrequency propertyValue totalTokens',
        })
        .lean();

      // Transform P2P listings to marketplace format
      p2pListings = p2pListings.map((listing: any) => ({
        _id: listing._id,
        type: 'p2p',
        listingId: listing._id,
        tokenName: listing.tokenName,
        tokenSymbol: listing.tokenSymbol,
        tokenPrice: listing.pricePerToken,
        tokensAvailable: listing.tokensForSale,
        totalPrice: listing.totalPrice,
        currency: listing.currency,
        riskLevel: listing.riskLevel,
        propertyType: listing.propertyType,
        description: listing.description,
        property: listing.propertyId,
        sellerName: listing.sellerName,
        sellerId: listing.sellerId,
        listedAt: listing.listedAt,
        expiresAt: listing.expiresAt,
        // Include original token offering data
        expectedReturn: listing.tokenOfferingId?.expectedReturn,
        dividendFrequency: listing.tokenOfferingId?.dividendFrequency,
        propertyValue: listing.tokenOfferingId?.propertyValue,
        totalTokens: listing.tokenOfferingId?.totalTokens,
        tags: listing.tags,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      }));
    }

    // Combine both arrays
    let combinedMarketplace = [...officialOfferings, ...p2pListings];

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        combinedMarketplace.sort((a, b) => a.tokenPrice - b.tokenPrice);
        break;
      case 'price-high':
        combinedMarketplace.sort((a, b) => b.tokenPrice - a.tokenPrice);
        break;
      case 'newest':
      default:
        combinedMarketplace.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    // Calculate total count before pagination
    const total = combinedMarketplace.length;

    // Apply pagination
    combinedMarketplace = combinedMarketplace.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: combinedMarketplace,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        officialCount: officialOfferings.length,
        p2pCount: p2pListings.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching token marketplace:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch token marketplace',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
