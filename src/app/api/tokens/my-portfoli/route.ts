import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import TokenInvestment from '@/app/models/TokenInvestment';

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

    // Get all active investments for this investor
    const investments = await TokenInvestment.find({
      investorId,
      status: 'active'
    })
    .populate('propertyId') // Populate property details
    .populate('tokenId')    // Populate token offering details
    .sort({ purchaseDate: -1 });

    // Calculate portfolio statistics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvestment, 0);
    const totalDividends = investments.reduce((sum, inv) => sum + inv.totalDividendsEarned, 0);
    const totalProperties = investments.length;
    const totalTokens = investments.reduce((sum, inv) => sum + inv.tokensOwned, 0);

    // Calculate current value (investment + dividends)
    const currentValue = totalInvested + totalDividends;

    // Group investments by property for easier display
    const investmentsByProperty = investments.reduce((acc: any, inv: any) => {
      const propertyId = inv.propertyId?._id?.toString() || 'unknown';
      if (!acc[propertyId]) {
        acc[propertyId] = {
          property: inv.propertyId,
          tokenOffering: inv.tokenId,
          totalTokens: 0,
          totalInvested: 0,
          totalDividends: 0,
          ownershipPercentage: 0,
          investments: []
        };
      }
      acc[propertyId].totalTokens += inv.tokensOwned;
      acc[propertyId].totalInvested += inv.totalInvestment;
      acc[propertyId].totalDividends += inv.totalDividendsEarned;
      acc[propertyId].ownershipPercentage += inv.ownershipPercentage;
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