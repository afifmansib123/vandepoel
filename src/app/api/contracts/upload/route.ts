import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// POST /api/contracts/upload - Upload contract PDF to S3
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('uploadType') as string; // 'initial' or 'signed'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ message: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.S3_SELLER_PROPERTY_BUCKET_NAME || process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      return NextResponse.json({ message: 'S3 bucket not configured' }, { status: 500 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Path = `contracts/${uploadType}/${timestamp}-${sanitizedFilename}`;

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: s3Path,
        Body: buffer,
        ContentType: file.type,
      },
    });

    const result = await upload.done();
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Path}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading contract:', error);
    return NextResponse.json({
      message: 'Error uploading file',
      error: error.message,
    }, { status: 500 });
  }
}
