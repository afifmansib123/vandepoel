import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Contract from '@/app/models/Contract';

// POST /api/contracts - Create a new contract
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Extract IDs from the nested structure
    const propertyId = body.property?._id;
    const tenantId = body.tenantId;
    const managerId = body.managerId;
    const duration = body.duration;

    // Fixed validation logic - check if required fields are missing
    if (!tenantId || !managerId || !propertyId) {
      return NextResponse.json({ 
        message: 'Missing required fields for contract creation',
        required: ['property._id', 'tenantId', 'managerId'],
        received: { propertyId, tenantId, managerId, duration },
        originalBody: body
      }, { status: 400 });
    }

    const newContract = await Contract.create({ propertyId, tenantId, managerId, duration });
    return NextResponse.json({ message: 'Contract created successfully', data: newContract }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating contract:", error);
    return NextResponse.json({ message: 'Error creating contract', error: error.message }, { status: 500 });
  }
}

// GET /api/contracts - Get all contracts (can be filtered by query params)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = req.nextUrl;
    const filter: any = {};
    if (searchParams.has('tenantId')) {
      filter.tenantId = searchParams.get('tenantId');
    }
    if (searchParams.has('managerId')) {
      filter.managerId = searchParams.get('managerId');
    }
    
    const contracts = await Contract.find(filter).populate('propertyId', 'name photoUrls');
    return NextResponse.json({ message: 'Contracts fetched successfully', data: contracts }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ message: 'Error fetching contracts', error: error.message }, { status: 500 });
  }
}