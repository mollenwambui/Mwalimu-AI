// app/api/upload/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, rm } from "fs/promises";
import fs from "fs";
import path from "path";
import { extractTextFromFile } from "@/lib/extractText";
import { analyzeContent } from "@/lib/analyzeContent";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const disability = formData.get("disability") as string;
    const educationLevel = formData.get("educationLevel") as string;
    const subject = formData.get("subject") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Ensure uploads folder exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save the uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Extract text from the file
    const extractedText = await extractTextFromFile(filepath, file.name);

    // Analyze the content
    const analysis = analyzeContent(extractedText, disability);

    // Optional: Delete the uploaded file after processing
    await rm(filepath);

    return NextResponse.json({
      success: true,
      analysis,
      fileName: file.name,
      fileSize: file.size,
      disability,
      educationLevel,
      subject,
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
