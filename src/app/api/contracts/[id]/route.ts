import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Contract from '@/app/models/Contract';
import mongoose from 'mongoose';
import { createNotification } from '@/lib/notifications';
import SellerProperty from '@/app/models/SellerProperty';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contracts/[id] - Get a single contract
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid contract ID format' }, { status: 400 });
    }
    
    const contract = await Contract.findById(id).populate('propertyId', 'name');
    if (!contract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Contract fetched', data: contract }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching contract:`, error);
    return NextResponse.json({ message: 'Error fetching contract', error: error.message }, { status: 500 });
  }
}

// PUT /api/contracts/[id] - Update a contract
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid contract ID format' }, { status: 400 });
    }

    const body = await req.json();
    const updateData: any = {};

    // Allow updating basic contract fields
    if (body.duration) updateData.duration = body.duration;
    if (body.status) updateData.status = body.status;
    if (body.landlordId) updateData.landlordId = body.landlordId;

    // Allow updating dates
    if (body.startDate) {
      const startDate = new Date(body.startDate);
      updateData.startDate = startDate;
    }
    if (body.endDate) {
      const endDate = new Date(body.endDate);
      updateData.endDate = endDate;
    }

    // Validate date logic if both are being updated
    if (updateData.startDate && updateData.endDate && updateData.startDate >= updateData.endDate) {
      return NextResponse.json({
        message: 'Contract end date must be after start date',
      }, { status: 400 });
    }

    // Allow updating financial terms
    if (body.monthlyRent !== undefined) {
      const rent = parseFloat(body.monthlyRent);
      if (rent <= 0) {
        return NextResponse.json({ message: 'Monthly rent must be greater than 0' }, { status: 400 });
      }
      updateData.monthlyRent = rent;
    }

    if (body.securityDeposit !== undefined) {
      const deposit = parseFloat(body.securityDeposit);
      if (deposit < 0) {
        return NextResponse.json({ message: 'Security deposit cannot be negative' }, { status: 400 });
      }
      updateData.securityDeposit = deposit;
    }

    if (body.currency) updateData.currency = body.currency;

    if (body.paymentDay !== undefined) {
      const day = parseInt(body.paymentDay);
      if (day < 1 || day > 31) {
        return NextResponse.json({ message: 'Payment day must be between 1 and 31' }, { status: 400 });
      }
      updateData.paymentDay = day;
    }

    // Allow updating terms and conditions
    if (body.terms) updateData.terms = body.terms;
    if (body.specialConditions !== undefined) updateData.specialConditions = body.specialConditions;

    // Allow updating document URL
    if (body.contractDocumentUrl !== undefined) updateData.contractDocumentUrl = body.contractDocumentUrl;

    // Allow updating termination details
    if (body.terminationReason !== undefined) updateData.terminationReason = body.terminationReason;
    if (body.terminatedBy !== undefined) updateData.terminatedBy = body.terminatedBy;
    if (body.terminatedAt !== undefined) updateData.terminatedAt = body.terminatedAt ? new Date(body.terminatedAt) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields to update provided' }, { status: 400 });
    }

    const updatedContract = await Contract.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedContract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contract updated successfully', data: updatedContract }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating contract:`, error);
    return NextResponse.json({ message: 'Error updating contract', error: error.message }, { status: 500 });
  }
}

// PATCH /api/contracts/[id] - Handle contract signatures
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid contract ID format' }, { status: 400 });
    }

    const body = await req.json();
    const { action, role, signature } = body;

    if (action !== 'sign') {
      return NextResponse.json({ message: 'Invalid action. Only "sign" is supported.' }, { status: 400 });
    }

    if (!role || !['tenant', 'manager', 'landlord'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role. Must be tenant, manager, or landlord.' }, { status: 400 });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }

    // Apply signature based on role
    const updateData: any = {};
    if (role === 'tenant') {
      if (contract.tenantSigned) {
        return NextResponse.json({ message: 'Tenant has already signed this contract' }, { status: 400 });
      }
      updateData.tenantSigned = true;
      updateData.tenantSignedAt = new Date();
      updateData.tenantSignature = signature || `${role}_signature_${Date.now()}`;
    } else if (role === 'manager') {
      if (contract.managerSigned) {
        return NextResponse.json({ message: 'Manager has already signed this contract' }, { status: 400 });
      }
      updateData.managerSigned = true;
      updateData.managerSignedAt = new Date();
      updateData.managerSignature = signature || `${role}_signature_${Date.now()}`;
    } else if (role === 'landlord') {
      if (contract.landlordSigned) {
        return NextResponse.json({ message: 'Landlord has already signed this contract' }, { status: 400 });
      }
      updateData.landlordSigned = true;
      updateData.landlordSignedAt = new Date();
      updateData.landlordSignature = signature || `${role}_signature_${Date.now()}`;
    }

    // Update contract status based on signatures
    // If all required parties have signed, activate the contract
    const tenantWillBeSigned = updateData.tenantSigned || contract.tenantSigned;
    const managerWillBeSigned = updateData.managerSigned || contract.managerSigned;
    const landlordWillBeSigned = updateData.landlordSigned || contract.landlordSigned;

    // If landlord exists, all three must sign. Otherwise, just tenant and manager.
    const allSigned = contract.landlordId
      ? tenantWillBeSigned && managerWillBeSigned && landlordWillBeSigned
      : tenantWillBeSigned && managerWillBeSigned;

    if (allSigned && contract.status === 'pending_signatures') {
      updateData.status = 'active';
    } else if (!allSigned && contract.status === 'draft') {
      updateData.status = 'pending_signatures';
    }

    const updatedContract = await Contract.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // Get property details for notification
    const property = await SellerProperty.findById(contract.propertyId);
    const propertyName = property?.name || 'the property';

    // Send notifications about signature
    if (role === 'tenant') {
      // Notify manager that tenant signed
      await createNotification({
        userId: contract.managerId,
        type: 'contract',
        title: 'Tenant Signed Contract',
        message: `The tenant has signed the rental contract for ${propertyName}.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/managers/contracts',
        priority: 'medium',
      });

      // Notify landlord if present
      if (contract.landlordId) {
        await createNotification({
          userId: contract.landlordId,
          type: 'contract',
          title: 'Tenant Signed Contract',
          message: `The tenant has signed the rental contract for ${propertyName}.`,
          relatedId: updatedContract._id.toString(),
          relatedUrl: '/landlords/properties',
          priority: 'medium',
        });
      }
    } else if (role === 'manager') {
      // Notify tenant that manager signed
      await createNotification({
        userId: contract.tenantId,
        type: 'contract',
        title: 'Manager Signed Contract',
        message: `The property manager has signed your rental contract for ${propertyName}.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/tenants/contracts',
        priority: 'medium',
      });

      // Notify landlord if present
      if (contract.landlordId) {
        await createNotification({
          userId: contract.landlordId,
          type: 'contract',
          title: 'Manager Signed Contract',
          message: `The property manager has signed the rental contract for ${propertyName}.`,
          relatedId: updatedContract._id.toString(),
          relatedUrl: '/landlords/properties',
          priority: 'medium',
        });
      }
    } else if (role === 'landlord') {
      // Notify tenant that landlord signed
      await createNotification({
        userId: contract.tenantId,
        type: 'contract',
        title: 'Landlord Signed Contract',
        message: `The landlord has signed your rental contract for ${propertyName}.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/tenants/contracts',
        priority: 'medium',
      });

      // Notify manager that landlord signed
      await createNotification({
        userId: contract.managerId,
        type: 'contract',
        title: 'Landlord Signed Contract',
        message: `The landlord has signed the rental contract for ${propertyName}.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/managers/contracts',
        priority: 'medium',
      });
    }

    // If all parties have signed, notify everyone that contract is active
    if (allSigned && updatedContract.status === 'active') {
      await createNotification({
        userId: contract.tenantId,
        type: 'contract',
        title: 'Contract Fully Executed',
        message: `Your rental contract for ${propertyName} is now active! All parties have signed.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/tenants/contracts',
        priority: 'high',
      });

      await createNotification({
        userId: contract.managerId,
        type: 'contract',
        title: 'Contract Fully Executed',
        message: `The rental contract for ${propertyName} is now active! All parties have signed.`,
        relatedId: updatedContract._id.toString(),
        relatedUrl: '/managers/contracts',
        priority: 'high',
      });

      if (contract.landlordId) {
        await createNotification({
          userId: contract.landlordId,
          type: 'contract',
          title: 'Contract Fully Executed',
          message: `The rental contract for ${propertyName} is now active! All parties have signed.`,
          relatedId: updatedContract._id.toString(),
          relatedUrl: '/landlords/properties',
          priority: 'high',
        });
      }
    }

    return NextResponse.json({
      message: `Contract signed by ${role} successfully`,
      data: updatedContract,
      allSigned,
    }, { status: 200 });
  } catch (error: any) {
    console.error(`Error signing contract:`, error);
    return NextResponse.json({ message: 'Error signing contract', error: error.message }, { status: 500 });
  }
}

// DELETE /api/contracts/[id] - Delete a contract
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid contract ID format' }, { status: 400 });
    }

    const deletedContract = await Contract.findByIdAndDelete(id);
    if (!deletedContract) {
      return NextResponse.json({ message: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contract deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting contract:`, error);
    return NextResponse.json({ message: 'Error deleting contract', error: error.message }, { status: 500 });
  }
}