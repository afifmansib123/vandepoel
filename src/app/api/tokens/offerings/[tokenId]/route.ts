import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../utils/dbConnect';
import PropertyToken from "@/app/models/PropertyToken"
import TokenInvestment from '@/app/models/TokenInvestment';

// GET /api/tokens/offerings/[tokenId] - Get single token offering details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    await dbConnect();

    const { tokenId } = await params;

    const tokenOffering = await PropertyToken.findById(tokenId)
      .populate('propertyId');

    if (!tokenOffering) {
      return NextResponse.json({
        success: false,
        message: 'Token offering not found'
      }, { status: 404 });
    }

    // Get total investors count
    const investorsCount = await TokenInvestment.countDocuments({
      tokenId: tokenOffering._id,
      status: 'active'
    });

    // Get funding progress percentage
    const fundingProgress = (tokenOffering.tokensSold / tokenOffering.totalTokens) * 100;

    return NextResponse.json({
      success: true,
      data: {
        ...tokenOffering.toObject(),
        investorsCount,
        fundingProgress: fundingProgress.toFixed(2)
      }
    });

  } catch (error: any) {
    console.error('GET /api/tokens/offerings/[tokenId] error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching token offering',
      error: error.message
    }, { status: 500 });
  }
}

// PATCH /api/tokens/offerings/[tokenId] - Update token offering status (Landlord/Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    await dbConnect();

    const { tokenId } = await params;
    const { status } = await req.json();

    // Validate status
    const validStatuses = ['draft', 'active', 'funded', 'closed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status value'
      }, { status: 400 });
    }

    const tokenOffering = await PropertyToken.findByIdAndUpdate(
      tokenId,
      { status },
      { new: true }
    );

    if (!tokenOffering) {
      return NextResponse.json({
        success: false,
        message: 'Token offering not found'
      }, { status: 404 });
    }

    console.log(`Token offering ${tokenId} status updated to: ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Token offering status updated',
      data: tokenOffering
    });

  } catch (error: any) {
    console.error('PATCH /api/tokens/offerings/[tokenId] error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error updating token offering',
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/tokens/offerings/[tokenId] - Update token offering status (alias for PATCH)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  return PATCH(req, { params });
}