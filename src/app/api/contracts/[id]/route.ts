import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Contract from '@/app/models/Contract';
import mongoose from 'mongoose';

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
    // Only allow updating these specific fields to prevent unwanted changes
    const updateData: { duration?: string; status?: string } = {};
    if (body.duration) updateData.duration = body.duration;
    if (body.status) updateData.status = body.status;

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