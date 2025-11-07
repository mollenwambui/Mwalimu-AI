// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/analyzeContent';

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    
    // Log environment variable status
    console.log("Mistral API Key status:", {
      hasKey: !!process.env.MISTRAL_API_KEY,
      keyPrefix: process.env.MISTRAL_API_KEY ? process.env.MISTRAL_API_KEY.substring(0, 7) + "..." : "none"
    });
    
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const disability = formData.get('disability') as string;
    const educationLevel = formData.get('educationLevel') as string;
    const subject = formData.get("subject") as string;

    console.log("Form data:", { 
      disability, 
      educationLevel, 
      subject, 
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!file) {
      console.error("No file uploaded");
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file type and handle accordingly
    const fileName = file.name.toLowerCase();
    let fileContent: string;
    
    if (fileName.endsWith('.pdf')) {
      console.log("Processing PDF file");
      try {
        // Import pdf-parse dynamically to avoid issues with server-side rendering
        const pdfParse = (await import('pdf-parse')).default;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Extract text from the PDF
        const data = await pdfParse(buffer);
        fileContent = data.text;
        
        if (!fileContent || fileContent.trim().length === 0) {
          return NextResponse.json({ 
            error: 'Could not extract text from PDF. The PDF may be scanned or image-based.' 
          }, { status: 400 });
        }
        
        console.log("Extracted text content length:", fileContent.length);
        console.log("First 100 chars:", fileContent.substring(0, 100));
      } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ 
          error: 'Failed to process PDF. Please upload a plain text file (.txt) instead.' 
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.docx')) {
      console.log("Processing DOCX file");
      try {
        // Import mammoth dynamically to avoid issues with server-side rendering
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        
        // Create a buffer from the array buffer
        const buffer = Buffer.from(arrayBuffer);
        
        // Extract text from the DOCX using the correct format
        const result = await mammoth.extractRawText({ buffer: buffer });
        fileContent = result.value;
        
        if (!fileContent || fileContent.trim().length === 0) {
          return NextResponse.json({ 
            error: 'Could not extract text from DOCX file.' 
          }, { status: 400 });
        }
        
        console.log("Extracted text content length:", fileContent.length);
        console.log("First 100 chars:", fileContent.substring(0, 100));
      } catch (error) {
        console.error('Error processing DOCX:', error);
        return NextResponse.json({ 
          error: 'Failed to process DOCX file. Please upload a plain text file (.txt) instead.' 
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.txt') || file.type === 'text/plain') {
      console.log("Processing text file");
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fileContent = buffer.toString('utf8');
        console.log("File content length:", fileContent.length);
        console.log("First 100 chars:", fileContent.substring(0, 100));
        
        // Check if the content appears to be text
        if (!isLikelyText(fileContent)) {
          return NextResponse.json({ 
            error: 'The uploaded file does not appear to contain readable text. Please upload a plain text file (.txt).' 
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error reading file content:', error);
        return NextResponse.json({ error: 'Failed to read file content' }, { status: 500 });
      }
    } else {
      console.log("Unsupported file type");
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload a plain text file (.txt), PDF, or DOCX file.' 
      }, { status: 400 });
    }

    // Check if Mistral API key is available
    const apiKey = process.env.MISTRAL_API_KEY;
    console.log("Mistral API key available:", !!apiKey);
    
    if (!apiKey) {
      console.error("Mistral API key not found in environment variables");
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    // Analyze content using AI
    console.log("Starting content analysis...");
    const analysis = await analyzeContent(fileContent, disability);
    console.log("Analysis completed:", { 
      summary: analysis.summary, 
      score: analysis.overallScore,
      linesCount: analysis.lines.length 
    });

    return NextResponse.json({ 
      analysis,
      metadata: {
        disability,
        educationLevel,
        subject,
        fileName: file.name,
        fileType: file.type
      }
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Improved function to check if content appears to be text
function isLikelyText(content: string): boolean {
  // Check for high ratio of printable ASCII characters
  let printableCount = 0;
  let totalChars = Math.min(content.length, 1000);
  
  for (let i = 0; i < totalChars; i++) {
    const charCode = content.charCodeAt(i);
    if (charCode >= 32 && charCode <= 126 || charCode === 10 || charCode === 13) {
      printableCount++;
    }
  }
  
  const ratio = printableCount / totalChars;
  console.log(`Text detection ratio: ${ratio} (${printableCount}/${totalChars})`);
  
  // At least 70% printable characters and no long sequences of null bytes
  return ratio > 0.7 && !content.includes('\x00\x00\x00');
}