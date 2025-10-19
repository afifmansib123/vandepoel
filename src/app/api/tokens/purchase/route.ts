import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import PropertyToken from '@/app/models//PropertyToken';
import TokenInvestment from '@/app/models/TokenInvestment';

// POST /api/tokens/purchase - Purchase tokens (Buyers only)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      tokenId,
      tokensQuantity,
      investorEmail,
      investorPhone,
      transactionId,
      paymentMethod,
      investorId // From your auth - should match buyer's cognitoId
    } = body;

    // Validate required fields
    if (!tokenId || !tokensQuantity || !investorId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Get token offering
    const tokenOffering = await PropertyToken.findById(tokenId);
    if (!tokenOffering) {
      return NextResponse.json({
        success: false,
        message: 'Token offering not found'
      }, { status: 404 });
    }

    // Check if offering is active
    if (tokenOffering.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: `Token offering is ${tokenOffering.status}. Only active offerings can be purchased.`
      }, { status: 400 });
    }

    // Check if tokens are available
    if (tokensQuantity > tokenOffering.tokensAvailable) {
      return NextResponse.json({
        success: false,
        message: `Only ${tokenOffering.tokensAvailable} tokens available. You requested ${tokensQuantity}.`
      }, { status: 400 });
    }

    // Check min purchase limit
    if (tokensQuantity < tokenOffering.minPurchase) {
      return NextResponse.json({
        success: false,
        message: `Minimum purchase is ${tokenOffering.minPurchase} tokens`
      }, { status: 400 });
    }

    // Check max purchase limit
    if (tokenOffering.maxPurchase && tokensQuantity > tokenOffering.maxPurchase) {
      return NextResponse.json({
        success: false,
        message: `Maximum purchase is ${tokenOffering.maxPurchase} tokens per transaction`
      }, { status: 400 });
    }

    // Calculate investment details
    const totalInvestment = tokensQuantity * tokenOffering.tokenPrice;
    const ownershipPercentage = (tokensQuantity / tokenOffering.totalTokens) * 100;

    // Generate unique transaction ID if not provided
    const finalTransactionId = transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if user already has an investment in this property
    const existingInvestment = await TokenInvestment.findOne({
      investorId,
      tokenId: tokenOffering._id,
      status: 'active'
    });

    if (existingInvestment) {
      // Update existing investment
      existingInvestment.tokensOwned += tokensQuantity;
      existingInvestment.totalInvestment += totalInvestment;
      existingInvestment.ownershipPercentage = (existingInvestment.tokensOwned / tokenOffering.totalTokens) * 100;
      await existingInvestment.save();

      console.log(`Updated investment for user ${investorId}: +${tokensQuantity} tokens`);

      // Update token offering
      tokenOffering.tokensSold += tokensQuantity;
      tokenOffering.tokensAvailable -= tokensQuantity;

      // Check if fully funded
      if (tokenOffering.tokensAvailable === 0) {
        tokenOffering.status = 'funded';
      }

      await tokenOffering.save();

      return NextResponse.json({
        success: true,
        message: 'Additional tokens purchased successfully',
        data: existingInvestment
      }, { status: 200 });
    } else {
      // Create new investment record
      const investment = new TokenInvestment({
        investorId,
        propertyId: tokenOffering.propertyId,
        tokenId: tokenOffering._id,
        tokensOwned: tokensQuantity,
        purchasePrice: tokenOffering.tokenPrice,
        totalInvestment,
        ownershipPercentage,
        transactionId: finalTransactionId,
        paymentMethod: paymentMethod || 'Not specified',
        paymentStatus: 'success', // Assuming payment is verified before this call
        investorEmail,
        investorPhone,
        status: 'active'
      });

      await investment.save();

      console.log(`New investment created for user ${investorId}: ${tokensQuantity} tokens`);

      // Update token offering
      tokenOffering.tokensSold += tokensQuantity;
      tokenOffering.tokensAvailable -= tokensQuantity;

      // Check if fully funded
      if (tokenOffering.tokensAvailable === 0) {
        tokenOffering.status = 'funded';
      }

      await tokenOffering.save();

      return NextResponse.json({
        success: true,
        message: 'Tokens purchased successfully',
        data: investment
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('POST /api/tokens/purchase error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error purchasing tokens',
      error: error.message
    }, { status: 500 });
  }
}