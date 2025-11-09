import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || (type !== "terms" && type !== "privacy")) {
      return NextResponse.json(
        { success: false, message: "Invalid document type" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the file path
    const documentsDir = path.join(process.cwd(), "public", "documents");
    const fileName = `${type}.pdf`;
    const filePath = path.join(documentsDir, fileName);

    // Ensure the documents directory exists
    try {
      await mkdir(documentsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write the file
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      fileName: fileName,
      path: `/documents/${fileName}`,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      documents: {
        terms: "/documents/terms.pdf",
        privacy: "/documents/privacy.pdf",
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
