import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import SuperAdmin from '@/app/models/SuperAdmin';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { cognitoId, name, email } = body;

    if (!cognitoId || !name || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingAdmin = await SuperAdmin.findOne({ cognitoId }).lean().exec();
    if (existingAdmin) {
      return NextResponse.json({ message: 'Super Admin with this Cognito ID already exists' }, { status: 409 });
    }

    const newAdmin = new SuperAdmin({ cognitoId, name, email });
    const savedAdmin = await newAdmin.save();

    return NextResponse.json(savedAdmin.toObject(), { status: 201 });

  } catch (error: any) {
    console.error('Error creating super admin:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Duplicate key error.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Error: ${error.message}` }, { status: 500 });
  }
}
