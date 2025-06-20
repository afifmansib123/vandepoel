// src/app/api/buyers/[cognitoId]/favorites/[propertyId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../utils/dbConnect';
import Tenant from '@/app/models/Tenant';
import SellerProperty from '@/app/models/SellerProperty';

async function getBuyerAndProperty(cognitoId: string, propertyIdStr: string) {
    const propertyIdNum = Number(propertyIdStr);
    if (isNaN(propertyIdNum)) {
        return { error: NextResponse.json({ message: 'Invalid Property ID format' }, { status: 400 }) };
    }

    const buyer = await Tenant.findOne({ cognitoId }).exec();
    if (!buyer) {
        return { error: NextResponse.json({ message: 'Buyer not found' }, { status: 404 }) };
    }

    const property = await SellerProperty.findOne({ id: propertyIdNum }).select('_id id').lean().exec();
    if (!property) {
        return { error: NextResponse.json({ message: 'Property not found' }, { status: 404 }) };
    }
    
    return { buyer, propertyId: propertyIdNum, propertyExists: true };
}

async function getPopulatedBuyer(buyer: any) {
    const populatedBuyer = buyer.toObject();
    if (populatedBuyer.favorites && populatedBuyer.favorites.length > 0) {
        const favoriteProperties = await SellerProperty.find({ 
            id: { $in: populatedBuyer.favorites as number[] } 
        }).lean().exec();
        populatedBuyer.favorites = favoriteProperties;
    } else {
        populatedBuyer.favorites = [];
    }
    return populatedBuyer;
}

// --- POST Handler (Add Favorite Property) ---
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cognitoId: string; propertyId: string }> }
) {
  await dbConnect();
  const { cognitoId, propertyId: propertyIdStr } = await params;

  const result = await getBuyerAndProperty(cognitoId, propertyIdStr);
  if (result.error) return result.error;
  const { buyer, propertyId } = result;

  try {
    // Use MongoDB's $addToSet to prevent duplicates at the database level
    const updateResult = await Tenant.findOneAndUpdate(
      { cognitoId },
      { $addToSet: { favorites: propertyId } }, // $addToSet only adds if not already present
      { new: true } // Return the updated document
    ).exec();

    if (!updateResult) {
      return NextResponse.json({ message: 'Failed to update favorites' }, { status: 500 });
    }

    // Get populated buyer for response
    const populatedBuyer = await getPopulatedBuyer(updateResult);
    return NextResponse.json(populatedBuyer, { status: 200 });

  } catch (error: any) {
    console.error(`Error adding favorite for buyer ${cognitoId}:`, error);
    return NextResponse.json({ message: `Error adding favorite: ${error.message}` }, { status: 500 });
  }
}

// --- DELETE Handler (Remove Favorite Property) ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cognitoId: string; propertyId: string }> }
) {
  await dbConnect();
  const { cognitoId, propertyId: propertyIdStr } = await params;

  const result = await getBuyerAndProperty(cognitoId, propertyIdStr);
  if (result.error) return result.error;
  const { buyer, propertyId } = result;

  try {
    // Use MongoDB's $pull to remove the property ID from favorites
    const updateResult = await Tenant.findOneAndUpdate(
      { cognitoId },
      { $pull: { favorites: propertyId } }, // $pull removes all instances of the value
      { new: true } // Return the updated document
    ).exec();

    if (!updateResult) {
      return NextResponse.json({ message: 'Failed to update favorites' }, { status: 500 });
    }

    // Get populated buyer for response
    const populatedBuyer = await getPopulatedBuyer(updateResult);
    return NextResponse.json(populatedBuyer, { status: 200 });

  } catch (error: any) {
    console.error(`Error removing favorite for buyer ${cognitoId}:`, error);
    return NextResponse.json({ message: `Error removing favorite: ${error.message}` }, { status: 500 });
  }
}