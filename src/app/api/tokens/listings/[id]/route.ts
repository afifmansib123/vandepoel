import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import TokenListing from '@/app/models/TokenListing';
import TokenInvestment from '@/app/models/TokenInvestment';
import PropertyToken from '@/app/models/PropertyToken';
import SellerProperty from '@/app/models/SellerProperty';
import { getUserFromToken } from '@/lib/auth';

/**
 * GET /api/tokens/listings/[id]
 * Get a specific token listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const listing = await TokenListing.findById(id)
      .populate('propertyId')
      .populate('tokenOfferingId')
      .populate('tokenInvestmentId');

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'Token listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: listing,
    });
  } catch (error: any) {
    console.error('Error fetching token listing:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch token listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tokens/listings/[id]
 * Cancel a token listing (seller only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listing = await TokenListing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'Token listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (listing.sellerId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only cancel your own listings' },
        { status: 403 }
      );
    }

    // Check if already sold or cancelled
    if (listing.status === 'sold') {
      return NextResponse.json(
        { success: false, message: 'Cannot cancel a sold listing' },
        { status: 400 }
      );
    }

    if (listing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Listing already cancelled' },
        { status: 400 }
      );
    }

    // Cancel the listing
    listing.status = 'cancelled';
    listing.cancelledAt = new Date();
    await listing.save();

    return NextResponse.json({
      success: true,
      message: 'Token listing cancelled successfully',
      data: listing,
    });
  } catch (error: any) {
    console.error('Error cancelling token listing:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to cancel token listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tokens/listings/[id]
 * Update listing price or description (seller only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pricePerToken, description } = body;

    const { id } = await params;
    const listing = await TokenListing.findById(id);

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'Token listing not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (listing.sellerId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own listings' },
        { status: 403 }
      );
    }

    // Can only update active listings
    if (listing.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot update listing with status: ${listing.status}`,
        },
        { status: 400 }
      );
    }

    // Update fields
    if (pricePerToken !== undefined) {
      if (pricePerToken < 0) {
        return NextResponse.json(
          { success: false, message: 'Price per token must be >= 0' },
          { status: 400 }
        );
      }
      listing.pricePerToken = pricePerToken;
      listing.totalPrice = listing.tokensForSale * pricePerToken;
    }

    if (description !== undefined) {
      listing.description = description;
    }

    await listing.save();

    return NextResponse.json({
      success: true,
      message: 'Token listing updated successfully',
      data: listing,
    });
  } catch (error: any) {
    console.error('Error updating token listing:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update token listing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
