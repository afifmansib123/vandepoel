import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getUserFromToken } from "@/lib/auth";

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const S3_BUCKET_NAME = process.env.S3_SELLER_PROPERTY_BUCKET_NAME || process.env.S3_BUCKET_NAME!;

/**
 * POST /api/tokens/purchase-requests/[id]/upload-payment-proof
 * Upload payment proof file to S3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check S3 configuration
    if (!S3_BUCKET_NAME || !s3Client.config.region) {
      console.error("S3 environment variables missing or incomplete.");
      return NextResponse.json(
        { success: false, message: "Server configuration error for file uploads." },
        { status: 500 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('paymentProof') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images and PDFs only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Please upload an image (JPG, PNG, WEBP) or PDF." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Upload to S3
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const key = `token-purchase-requests/payment-proofs/${params.id}/${timestamp}-${sanitizedFileName}`;

    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    };

    const upload = new Upload({ client: s3Client, params: uploadParams });
    const result = await upload.done();

    // Get the uploaded file URL
    const fileUrl = (result as { Location?: string }).Location;

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: "Failed to upload file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: {
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error: any) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload payment proof" },
      { status: 500 }
    );
  }
}
