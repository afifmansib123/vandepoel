import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { authenticateAndAuthorize } from '@/lib/authUtils';
import BankingService from '@/app/models/BankingService';

export async function POST(request: NextRequest) {

  await dbConnect();

  try {
    const body = await request.json();
    
    // Basic validation
    const { bankName, email } = body;
    if (!bankName || !email) {
      return NextResponse.json({ message: 'Bank Name and Email are required.' }, { status: 400 });
    }

    const newService = new BankingService(body);
    await newService.save();

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    console.error('Error creating banking service:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) {
        return NextResponse.json({ message: 'A service with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Server Error: ${error.message}` }, { status: 500 });
  }
}