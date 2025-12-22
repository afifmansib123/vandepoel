// src/app/api/buyers/[cognitoId]/favorites/[propertyId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../utils/dbConnect';
import Buyer from "@/app/models/Buyer"
import SellerProperty from '@/app/models/SellerProperty';

async function getBuyerAndProperty(cognitoId: string, propertyIdStr: string) {
    const propertyIdNum = Number(propertyIdStr);
    if (isNaN(propertyIdNum)) { 
        return { error: NextResponse.json({ message: 'Invalid Property ID format' }, { status: 400 }) };
    }

    const buyer = await Buyer.findOne({ cognitoId }).exec();
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cognitoId: string; propertyId: string }> }
) {
  await dbConnect();

  const { cognitoId, propertyId: propertyIdStr } = await params;

  const result = await getBuyerAndProperty(cognitoId, propertyIdStr);
  if (result.error) return result.error;
  const { propertyId } = result;

  try {
    const updatedBuyer = await Buyer.findOneAndUpdate(
      { cognitoId },
      { $addToSet: { favorites: propertyId } },
      { new: true } // Return the updated document
    ).lean().exec(); // Use .lean() for a plain JS object

    if (!updatedBuyer) {
      return NextResponse.json({ message: 'Failed to update favorites' }, { status: 500 });
    }
    
    // Return the updated buyer directly. 'favorites' will be an array of numbers.
    return NextResponse.json(updatedBuyer, { status: 200 });

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
  const { propertyId } = result;

  try {
    const updatedBuyer = await Buyer.findOneAndUpdate(
      { cognitoId },
      { $pull: { favorites: propertyId } },
      { new: true } // Return the updated document
    ).lean().exec(); // Use .lean() for a plain JS object

    if (!updatedBuyer) {
      return NextResponse.json({ message: 'Failed to update favorites' }, { status: 500 });
    }

    // Return the updated buyer directly. 'favorites' will be an array of numbers.
    return NextResponse.json(updatedBuyer, { status: 200 });

  } catch (error: any) {
    console.error(`Error removing favorite for buyer ${cognitoId}:`, error);
    return NextResponse.json({ message: `Error removing favorite: ${error.message}` }, { status: 500 });
  }
}