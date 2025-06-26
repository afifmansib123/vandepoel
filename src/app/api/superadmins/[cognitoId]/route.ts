import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import SuperAdmin from '@/app/models/SuperAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { cognitoId: string } }
) {
  await dbConnect();
  const { cognitoId } = params;

  if (!cognitoId) {
    return NextResponse.json({ message: 'Cognito ID is required' }, { status: 400 });
  }

  try {
    const admin = await SuperAdmin.findOne({ cognitoId: cognitoId }).lean().exec();

    if (!admin) {
      return NextResponse.json({ message: 'Super Admin not found' }, { status: 404 });
    }

    return NextResponse.json(admin, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: `Error retrieving admin: ${error.message}` }, { status: 500 });
  }
}