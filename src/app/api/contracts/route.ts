import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Contract from '@/app/models/Contract';
import { createNotification } from '@/lib/notifications';
import SellerProperty from '@/app/models/SellerProperty';

// POST /api/contracts - Create a new contract
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Extract IDs from the nested structure
    const propertyId = body.property?._id || body.propertyId;
    const tenantId = body.tenantId;
    const managerId = body.managerId;
    const landlordId = body.landlordId; // Optional

    // Required fields validation
    if (!tenantId || !managerId || !propertyId) {
      return NextResponse.json({
        message: 'Missing required fields for contract creation',
        required: ['propertyId', 'tenantId', 'managerId'],
        received: { propertyId, tenantId, managerId },
      }, { status: 400 });
    }

    // Validate contract dates
    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    const duration = body.duration || '1_year';

    if (!startDate || !endDate) {
      return NextResponse.json({
        message: 'Contract start and end dates are required',
      }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({
        message: 'Contract end date must be after start date',
      }, { status: 400 });
    }

    // Validate financial terms
    const monthlyRent = parseFloat(body.monthlyRent);
    const securityDeposit = parseFloat(body.securityDeposit);
    const currency = body.currency || 'EUR';
    const paymentDay = parseInt(body.paymentDay) || 1;

    if (!monthlyRent || monthlyRent <= 0) {
      return NextResponse.json({
        message: 'Valid monthly rent amount is required',
      }, { status: 400 });
    }

    if (!securityDeposit || securityDeposit < 0) {
      return NextResponse.json({
        message: 'Valid security deposit amount is required',
      }, { status: 400 });
    }

    if (paymentDay < 1 || paymentDay > 31) {
      return NextResponse.json({
        message: 'Payment day must be between 1 and 31',
      }, { status: 400 });
    }

    // Validate terms
    if (!body.terms || body.terms.trim().length === 0) {
      return NextResponse.json({
        message: 'Contract terms and conditions are required',
      }, { status: 400 });
    }

    // Create contract data
    const contractData: any = {
      propertyId,
      tenantId,
      managerId,
      landlordId,
      startDate,
      endDate,
      duration,
      monthlyRent,
      securityDeposit,
      currency,
      paymentDay,
      terms: body.terms,
      specialConditions: body.specialConditions,
      status: body.status || 'draft',
      contractDocumentUrl: body.contractDocumentUrl,
    };

    // Add commission data if provided
    if (body.managerCommissionRate !== undefined) {
      contractData.managerCommissionRate = parseFloat(body.managerCommissionRate);
    }
    if (body.managerCommissionAmount !== undefined) {
      contractData.managerCommissionAmount = parseFloat(body.managerCommissionAmount);
    }
    if (body.managerCommissionType) {
      contractData.managerCommissionType = body.managerCommissionType;
    }
    if (body.managerCommissionNotes) {
      contractData.managerCommissionNotes = body.managerCommissionNotes;
    }

    // Handle signature data if provided
    if (body.tenantSigned) {
      contractData.tenantSigned = true;
      contractData.tenantSignedAt = new Date();
      contractData.tenantSignature = body.tenantSignature;
    }

    if (body.managerSigned) {
      contractData.managerSigned = true;
      contractData.managerSignedAt = new Date();
      contractData.managerSignature = body.managerSignature;
    }

    if (body.landlordSigned) {
      contractData.landlordSigned = true;
      contractData.landlordSignedAt = new Date();
      contractData.landlordSignature = body.landlordSignature;
    }

    const newContract = await Contract.create(contractData);

    // Get property details for notification
    const property = await SellerProperty.findById(propertyId);
    const propertyName = property?.name || 'the property';

    // Send notification to tenant
    await createNotification({
      userId: tenantId,
      type: 'contract',
      title: 'New Rental Contract Available',
      message: `A rental contract has been created for ${propertyName}. Please review and sign the contract.`,
      relatedId: newContract._id.toString(),
      relatedUrl: '/tenants/contracts',
      priority: 'high',
    });

    // Send notification to landlord if present
    if (landlordId) {
      await createNotification({
        userId: landlordId,
        type: 'contract',
        title: 'Contract Created for Your Property',
        message: `A rental contract has been created for ${propertyName}.`,
        relatedId: newContract._id.toString(),
        relatedUrl: '/landlords/properties',
        priority: 'medium',
      });
    }

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

    // Filter by user roles
    if (searchParams.has('tenantId')) {
      filter.tenantId = searchParams.get('tenantId');
    }
    if (searchParams.has('managerId')) {
      filter.managerId = searchParams.get('managerId');
    }
    if (searchParams.has('landlordId')) {
      filter.landlordId = searchParams.get('landlordId');
    }

    // Filter by status
    if (searchParams.has('status')) {
      filter.status = searchParams.get('status');
    }

    // Filter by property
    if (searchParams.has('propertyId')) {
      filter.propertyId = searchParams.get('propertyId');
    }

    const contracts = await Contract.find(filter)
      .populate('propertyId', 'name photoUrls location')
      .sort({ createdAt: -1 });

    return NextResponse.json({ message: 'Contracts fetched successfully', data: contracts }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ message: 'Error fetching contracts', error: error.message }, { status: 500 });
  }
}