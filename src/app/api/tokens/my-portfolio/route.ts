import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import TokenPurchaseRequest from '@/app/models/TokenPurchaseRequest';

// GET /api/tokens/my-portfolio - Get investor's portfolio (Buyers only)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get investorId from query params (in production, get from auth session)
    const searchParams = req.nextUrl.searchParams;
    const investorId = searchParams.get('investorId');

    if (!investorId) {
      return NextResponse.json({
        success: false,
        message: 'Investor ID required'
      }, { status: 400 });
    }

    // Get all completed purchase requests where tokens have been assigned
    const investments = await TokenPurchaseRequest.find({
      buyerId: investorId,
      status: { $in: ['tokens_assigned', 'completed'] }
    })
    .populate('propertyId') // Populate property details
    .populate('tokenOfferingId')    // Populate token offering details
    .sort({ tokensAssignedAt: -1 });

    // Calculate portfolio statistics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalDividends = 0; // Dividends not implemented yet in new system
    const totalProperties = investments.length;
    const totalTokens = investments.reduce((sum, inv) => sum + inv.tokensRequested, 0);

    // Calculate current value (investment + dividends)
    const currentValue = totalInvested + totalDividends;

    // Group investments by property for easier display
    const investmentsByProperty = investments.reduce((acc: any, inv: any) => {
      const propertyId = inv.propertyId?._id?.toString() || 'unknown';
      if (!acc[propertyId]) {
        acc[propertyId] = {
          property: inv.propertyId,
          tokenOffering: inv.tokenOfferingId,
          totalTokens: 0,
          totalInvested: 0,
          totalDividends: 0,
          ownershipPercentage: 0,
          investments: []
        };
      }

      const tokenOffering = inv.tokenOfferingId;
      const ownershipPerc = tokenOffering?.totalTokens
        ? (inv.tokensRequested / tokenOffering.totalTokens) * 100
        : 0;

      acc[propertyId].totalTokens += inv.tokensRequested;
      acc[propertyId].totalInvested += inv.totalAmount;
      acc[propertyId].totalDividends += 0; // No dividends yet
      acc[propertyId].ownershipPercentage += ownershipPerc;
      acc[propertyId].investments.push(inv);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        investments,
        investmentsByProperty: Object.values(investmentsByProperty),
        statistics: {
          totalInvested,
          totalDividends,
          currentValue,
          totalProperties,
          totalTokens,
          averageReturn: totalInvested > 0 ? ((totalDividends / totalInvested) * 100).toFixed(2) : '0.00'
        }
      }
    });

  } catch (error: any) {
    console.error('GET /api/tokens/my-portfolio error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching investor portfolio',
      error: error.message
    }, { status: 500 });
  }
}