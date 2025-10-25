import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import PropertyToken from '@/app/models/PropertyToken';
import SellerProperty from '@/app/models/SellerProperty';

// GET /api/tokens/offerings - Get all active token offerings (or all if includeAll=true)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const propertyType = searchParams.get('propertyType');
    const riskLevel = searchParams.get('riskLevel');
    const includeAll = searchParams.get('includeAll') === 'true'; // New parameter to include all statuses

    const filter: any = {};

    // Only filter by active status if includeAll is not true
    if (!includeAll) {
      filter.status = 'active';
    }

    if (propertyType) filter.propertyType = propertyType;
    if (riskLevel) filter.riskLevel = riskLevel;

    const tokenOfferings = await PropertyToken.find(filter)
      .populate('propertyId')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await PropertyToken.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: tokenOfferings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('GET /api/tokens/offerings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching token offerings',
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/tokens/offerings - Create a new token offering (Admin/Owner)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      propertyId,
      tokenName,
      tokenSymbol,
      totalTokens,
      tokenPrice,
      minPurchase,
      maxPurchase,
      propertyValue,
      expectedReturn,
      dividendFrequency,
      offeringStartDate,
      offeringEndDate,
      description,
      riskLevel,
      propertyType
    } = body;

    // Validate propertyId
    if (!propertyId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Property ID is required' 
      }, { status: 400 });
    }

    // Check if property exists
    const property = await SellerProperty.findById(propertyId);
    if (!property) {
      return NextResponse.json({ 
        success: false, 
        message: 'Property not found' 
      }, { status: 404 });
    }

    // Check if property already has a token offering
    const existingToken = await PropertyToken.findOne({ propertyId });
    if (existingToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token offering already exists for this property' 
      }, { status: 400 });
    }

    // Create token offering
    const tokenOffering = new PropertyToken({
      propertyId,
      tokenName,
      tokenSymbol,
      totalTokens,
      tokenPrice,
      tokensSold: 0,
      tokensAvailable: totalTokens,
      minPurchase,
      maxPurchase,
      propertyValue,
      expectedReturn,
      dividendFrequency,
      offeringStartDate,
      offeringEndDate,
      description,
      riskLevel,
      propertyType,
      status: 'draft'
    });

    await tokenOffering.save();

    // Update property to mark it as tokenized
    property.isTokenized = true;
    property.tokenOffering = tokenOffering._id;
    property.investmentType = 'tokenized';
    await property.save();

    console.log(`Token offering created for property ${propertyId}`);

    return NextResponse.json({
      success: true,
      message: 'Token offering created successfully',
      data: tokenOffering
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/tokens/offerings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creating token offering',
      error: error.message
    }, { status: 500 });
  }
}