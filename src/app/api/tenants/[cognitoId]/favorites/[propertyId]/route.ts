// src/app/api/tenants/[cognitoId]/favorites/[propertyId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../utils/dbConnect';
import Tenant from '@/app/models/Tenant'; // CORRECT: Use the Tenant model
import SellerProperty from '@/app/models/SellerProperty';

interface HandlerContext {
  params: {
    cognitoId: string;
    propertyId: string;
  };
}

// Helper to get the tenant and validate the property
async function getTenantAndValidate(cognitoId: string, propertyIdStr: string) {
    const propertyIdNum = Number(propertyIdStr);
    if (isNaN(propertyIdNum)) {
        return { error: NextResponse.json({ message: 'Invalid Property ID format' }, { status: 400 }) };
    }

    // CORRECT: Find a document in the 'tenants' collection
    const tenant = await Tenant.findOne({ cognitoId }).exec();
    if (!tenant) {
        return { error: NextResponse.json({ message: 'Tenant not found' }, { status: 404 }) };
    }

    // Optional but good: Check if property exists
    const propertyExists = await SellerProperty.exists({ id: propertyIdNum });
    if (!propertyExists) {
        return { error: NextResponse.json({ message: 'Property not found' }, { status: 404 }) };
    }
    
    return { tenant, propertyId: propertyIdNum };
}

// --- POST Handler (Add Favorite Property) ---
export async function POST(request: NextRequest, { params }: HandlerContext) {
  await dbConnect();
  const { cognitoId, propertyId: propertyIdStr } = params;

  const result = await getTenantAndValidate(cognitoId, propertyIdStr);
  if (result.error) return result.error;
  const { propertyId } = result;

  try {
    // CORRECT: Update the document in the 'tenants' collection
    const updatedTenant = await Tenant.findOneAndUpdate(
      { cognitoId },
      { $addToSet: { favorites: propertyId } },
      { new: true }
    ).lean().exec(); // Use .lean() for a plain object

    if (!updatedTenant) {
      return NextResponse.json({ message: 'Failed to update tenant favorites' }, { status: 500 });
    }

    return NextResponse.json(updatedTenant, { status: 200 });

  } catch (error: any) {
    console.error(`Error adding favorite for tenant ${cognitoId}:`, error);
    return NextResponse.json({ message: `Error adding favorite: ${error.message}` }, { status: 500 });
  }
}

// --- DELETE Handler (Remove Favorite Property) ---
export async function DELETE(request: NextRequest, { params }: HandlerContext) {
  await dbConnect();
  const { cognitoId, propertyId: propertyIdStr } = params;

  const result = await getTenantAndValidate(cognitoId, propertyIdStr);
  if (result.error) return result.error;
  const { propertyId } = result;

  try {
    // CORRECT: Update the document in the 'tenants' collection
    const updatedTenant = await Tenant.findOneAndUpdate(
      { cognitoId },
      { $pull: { favorites: propertyId } },
      { new: true }
    ).lean().exec(); // Use .lean() for a plain object

    if (!updatedTenant) {
      return NextResponse.json({ message: 'Failed to update tenant favorites' }, { status: 500 });
    }

    return NextResponse.json(updatedTenant, { status: 200 });

  } catch (error: any) {
    console.error(`Error removing favorite for tenant ${cognitoId}:`, error);
    return NextResponse.json({ message: `Error removing favorite: ${error.message}` }, { status: 500 });
  }
}