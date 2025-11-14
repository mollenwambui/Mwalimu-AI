// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopType, TabStopPosition } from 'docx';
import { AnalysisResult, ExamAnalysisResult } from '@/lib/analyzeContent';
import fontkit from '@pdf-lib/fontkit';

interface DisabilityIdentificationResult {
  suggestedDisability: string;
  explanation: string;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { analysisResult, identificationResult, format, contentType } = await request.json();
    
    if (!format || !contentType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    let filename = '';
    let buffer: Buffer;
    let contentTypeHeader = '';
    
    if (contentType === 'analysis') {
      if (!analysisResult) {
        return NextResponse.json({ error: 'Missing analysisResult for analysis content' }, { status: 400 });
      }
      
      const result = analysisResult as AnalysisResult;
      filename = `accessibility-analysis.${format}`;
      
      if (format === 'pdf') {
        buffer = await generateAnalysisPDF(result);
        contentTypeHeader = 'application/pdf';
      } else {
        buffer = await generateAnalysisDocx(result);
        contentTypeHeader = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    } else if (contentType === 'exam') {
      if (!analysisResult) {
        return NextResponse.json({ error: 'Missing analysisResult for exam content' }, { status: 400 });
      }
      
      const result = analysisResult as ExamAnalysisResult;
      filename = `adapted-exam.${format}`;
      
      if (format === 'pdf') {
        buffer = await generateExamPDF(result);
        contentTypeHeader = 'application/pdf';
      } else {
        buffer = await generateExamDocx(result);
        contentTypeHeader = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    } else if (contentType === 'disability') {
      if (!identificationResult) {
        return NextResponse.json({ error: 'Missing identificationResult for disability content' }, { status: 400 });
      }
      
      const result = identificationResult as DisabilityIdentificationResult;
      filename = `disability-identification.${format}`;
      
      if (format === 'pdf') {
        buffer = await generateDisabilityPDF(result);
        contentTypeHeader = 'application/pdf';
      } else {
        buffer = await generateDisabilityDocx(result);
        contentTypeHeader = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    
    // Convert Buffer to Uint8Array for compatibility with NextResponse
    const uint8Array = new Uint8Array(buffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentTypeHeader,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading content:', error);
    return NextResponse.json({ error: 'Failed to download content' }, { status: 500 });
  }
}

// Helper function to sanitize text for WinAnsi encoding (fallback)
function sanitizeTextForPDF(text: string): string {
  // Replace non-ASCII characters with their closest ASCII equivalent or remove them
  return text
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[^\x00-\xFF]/g, ''); // Remove characters that can't be encoded in WinAnsi
}

// Helper to manage PDF pages and positioning
class PDFWriter {
  private pdfDoc: PDFDocument;
  private currentPage: PDFPage;
  private yPosition: number;
  private font: PDFFont;
  private boldFont: PDFFont;
  private fontSize: number = 12;
  private lineHeight: number;
  private margin: number = 50;
  private width: number;
  
  constructor(pdfDoc: PDFDocument, font: PDFFont, boldFont: PDFFont) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.boldFont = boldFont;
    this.currentPage = pdfDoc.addPage();
    this.width = this.currentPage.getSize().width;
    this.yPosition = this.currentPage.getSize().height - this.margin;
    this.lineHeight = this.fontSize * 1.5;
  }
  
  checkSpace(requiredSpace: number = 50) {
    if (this.yPosition < requiredSpace) {
      this.currentPage = this.pdfDoc.addPage();
      this.yPosition = this.currentPage.getSize().height - this.margin;
    }
  }
  
  writeText(text: string, options: {
    size?: number;
    bold?: boolean;
    color?: [number, number, number];
    indent?: number;
  } = {}) {
    this.checkSpace();
    
    const size = options.size || this.fontSize;
    const font = options.bold ? this.boldFont : this.font;
    const color = options.color || [0, 0, 0];
    const indent = options.indent || 0;
    
    // Sanitize text to ensure it can be encoded
    const sanitizedText = sanitizeTextForPDF(text);
    
    const lines = this.wrapText(sanitizedText, font, size, this.width - (this.margin * 2) - indent);
    
    for (const line of lines) {
      this.checkSpace();
      this.currentPage.drawText(line, {
        x: this.margin + indent,
        y: this.yPosition,
        size,
        font,
        color: rgb(color[0], color[1], color[2]),
      });
      this.yPosition -= this.lineHeight;
    }
  }
  
  addSpace(space: number = 10) {
    this.yPosition -= space;
  }
  
  private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      try {
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      } catch (error) {
        // If there's an encoding error, skip this word or handle it
        console.warn('Error encoding text:', word, error);
        continue;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

async function generateDisabilityPDF(result: DisabilityIdentificationResult): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit for custom font support
  pdfDoc.registerFontkit(fontkit);
  
  let font: PDFFont;
  let boldFont: PDFFont;
  
  try {
    // Try to load a Unicode-compatible font (Noto Sans)
    const fontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0IIpQlx3QUlC5A4PNr5TRA.woff';
    const boldFontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.woff';
    
    const [fontBytes, boldFontBytes] = await Promise.all([
      fetch(fontUrl).then(res => res.arrayBuffer()),
      fetch(boldFontUrl).then(res => res.arrayBuffer())
    ]);
    
    font = await pdfDoc.embedFont(fontBytes);
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } catch (error) {
    console.warn('Failed to load custom fonts, falling back to standard fonts:', error);
    // Fallback to standard fonts
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }
  
  const writer = new PDFWriter(pdfDoc, font, boldFont);
  
  // Title
  writer.writeText('Learning Challenges Identification Report', { size: 24, bold: true });
  writer.addSpace(20);
  
  // Suggested Disability
  writer.writeText('Potential Learning Challenge', { size: 16, bold: true });
  writer.addSpace(10);
  writer.writeText(result.suggestedDisability, { 
    size: 18, 
    bold: true, 
    color: [0.58, 0.29, 0.82] 
  });
  writer.addSpace(20);
  
  // Explanation
  writer.writeText('Explanation', { size: 16, bold: true });
  writer.addSpace(10);
  writer.writeText(result.explanation);
  writer.addSpace(20);
  
  // Recommendations
  if (result.recommendations.length > 0) {
    writer.checkSpace(100);
    writer.writeText('Recommendations', { size: 16, bold: true });
    writer.addSpace(10);
    
    for (const rec of result.recommendations) {
      writer.writeText(`• ${rec}`, { size: 11 });
      writer.addSpace(5);
    }
  }
  
  // Disclaimer
  writer.addSpace(30);
  writer.checkSpace(100);
  writer.writeText('Important Notice', { size: 14, bold: true, color: [0.72, 0.53, 0.04] });
  writer.addSpace(10);
  writer.writeText(
    'This is an AI-powered suggestion and not a medical diagnosis. Please consult with a qualified professional for a formal assessment.',
    { size: 10, color: [0.72, 0.53, 0.04] }
  );
  
  return Buffer.from(await pdfDoc.save());
}

async function generateDisabilityDocx(result: DisabilityIdentificationResult): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          text: "Learning Challenges Identification Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Suggested Disability Section
        new Paragraph({
          text: "Potential Learning Challenge",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: result.suggestedDisability,
              bold: true,
              size: 32,
              color: "9333EA",
            }),
          ],
          spacing: { after: 300 },
        }),
        
        // Explanation Section
        new Paragraph({
          text: "Explanation",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: result.explanation,
          spacing: { after: 300 },
        }),
        
        // Recommendations Section
        ...(result.recommendations.length > 0 ? [
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 200 },
          }),
          ...result.recommendations.map(rec => 
            new Paragraph({
              text: rec,
              bullet: {
                level: 0,
              },
              spacing: { after: 120 },
            })
          ),
        ] : []),
        
        // Disclaimer
        new Paragraph({
          text: "Important Notice",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This is an AI-powered suggestion and not a medical diagnosis. Please consult with a qualified professional for a formal assessment.",
              italics: true,
              color: "B45309",
            }),
          ],
          spacing: { after: 200 },
        }),
      ],
    }],
  });
  
  return Buffer.from(await Packer.toBuffer(doc));
}

async function generateAnalysisPDF(result: AnalysisResult): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit for custom font support
  pdfDoc.registerFontkit(fontkit);
  
  let font: PDFFont;
  let boldFont: PDFFont;
  
  try {
    // Try to load a Unicode-compatible font (Noto Sans)
    const fontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0IIpQlx3QUlC5A4PNr5TRA.woff';
    const boldFontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.woff';
    
    const [fontBytes, boldFontBytes] = await Promise.all([
      fetch(fontUrl).then(res => res.arrayBuffer()),
      fetch(boldFontUrl).then(res => res.arrayBuffer())
    ]);
    
    font = await pdfDoc.embedFont(fontBytes);
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } catch (error) {
    console.warn('Failed to load custom fonts, falling back to standard fonts:', error);
    // Fallback to standard fonts
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }
  
  const writer = new PDFWriter(pdfDoc, font, boldFont);
  
  // Title
  writer.writeText('Accessibility Analysis Report', { size: 24, bold: true });
  writer.addSpace(20);
  
  // Summary
  writer.writeText('Summary', { size: 16, bold: true });
  writer.addSpace(10);
  writer.writeText(result.summary);
  writer.addSpace(20);
  
  // Score
  writer.writeText(`Accessibility Score: ${result.overallScore}/100`, { 
    size: 14, 
    bold: true, 
    color: [0.31, 0.27, 0.90] 
  });
  writer.addSpace(20);
  
  // Line-by-line analysis
  writer.writeText('Line-by-Line Analysis', { size: 16, bold: true });
  writer.addSpace(15);
  
  for (const line of result.lines) {
    writer.writeText(`Line ${line.lineNumber}:`, { size: 14, bold: true });
    writer.addSpace(5);
    
    writer.writeText('Original:', { size: 11, bold: true, color: [0.86, 0.15, 0.15], indent: 20 });
    writer.writeText(line.originalLine, { size: 11, indent: 20 });
    writer.addSpace(5);
    
    if (line.suggestedChange) {
      writer.writeText('Suggested:', { size: 11, bold: true, color: [0.13, 0.77, 0.37], indent: 20 });
      writer.writeText(line.suggestedChange, { size: 11, indent: 20 });
      writer.addSpace(5);
    }
    
    if (line.reason) {
      writer.writeText(`Why: ${line.reason}`, { size: 10, color: [0.39, 0.45, 0.55], indent: 20 });
      writer.addSpace(5);
    }
    
    if (line.strategy) {
      writer.writeText(`Strategy: ${line.strategy}`, { size: 10, color: [0.39, 0.45, 0.55], indent: 20 });
    }
    
    writer.addSpace(15);
  }
  
  // Recommendations
  if (result.recommendations.length > 0) {
    writer.checkSpace(100);
    writer.writeText('Recommendations', { size: 16, bold: true });
    writer.addSpace(10);
    
    for (const rec of result.recommendations) {
      writer.writeText(`• ${rec}`, { size: 11 });
      writer.addSpace(5);
    }
  }
  
  return Buffer.from(await pdfDoc.save());
}

async function generateAnalysisDocx(result: AnalysisResult): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          text: "Accessibility Analysis Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Summary Section
        new Paragraph({
          text: "Summary",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: result.summary,
          spacing: { after: 240 },
        }),
        
        // Score
        new Paragraph({
          children: [
            new TextRun({
              text: `Accessibility Score: ${result.overallScore}/100`,
              bold: true,
              size: 28,
              color: "4F46E5",
            }),
          ],
          spacing: { after: 300 },
        }),
        
        // Line-by-Line Analysis Section
        new Paragraph({
          text: "Line-by-Line Analysis",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 200 },
        }),
        
        // All lines
        ...result.lines.flatMap(line => [
          new Paragraph({
            children: [
              new TextRun({
                text: `Line ${line.lineNumber}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
            border: {
              bottom: {
                color: "CCCCCC",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Original: ",
                bold: true,
                color: "DC2626",
              }),
              new TextRun({
                text: line.originalLine,
              }),
            ],
            indent: { left: 360 },
            spacing: { after: 120 },
          }),
          
          ...(line.suggestedChange ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Suggested: ",
                  bold: true,
                  color: "16A34A",
                }),
                new TextRun({
                  text: line.suggestedChange,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 120 },
            }),
          ] : []),
          
          ...(line.reason ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Why: ",
                  bold: true,
                  italics: true,
                }),
                new TextRun({
                  text: line.reason,
                  italics: true,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 120 },
            }),
          ] : []),
          
          ...(line.strategy ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Strategy: ",
                  bold: true,
                  italics: true,
                }),
                new TextRun({
                  text: line.strategy,
                  italics: true,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 240 },
            }),
          ] : []),
        ]),
        
        // Recommendations Section
        ...(result.recommendations.length > 0 ? [
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...result.recommendations.map(rec => 
            new Paragraph({
              text: rec,
              bullet: {
                level: 0,
              },
              spacing: { after: 120 },
            })
          ),
        ] : []),
      ],
    }],
  });
  
  return Buffer.from(await Packer.toBuffer(doc));
}

async function generateExamPDF(result: ExamAnalysisResult): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit for custom font support
  pdfDoc.registerFontkit(fontkit);
  
  let font: PDFFont;
  let boldFont: PDFFont;
  
  try {
    // Try to load a Unicode-compatible font (Noto Sans)
    const fontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0IIpQlx3QUlC5A4PNr5TRA.woff';
    const boldFontUrl = 'https://fonts.gstatic.com/s/notosans/v30/o-0NIpQlx3QUlC5A4PNjXhFVZNyB.woff';
    
    const [fontBytes, boldFontBytes] = await Promise.all([
      fetch(fontUrl).then(res => res.arrayBuffer()),
      fetch(boldFontUrl).then(res => res.arrayBuffer())
    ]);
    
    font = await pdfDoc.embedFont(fontBytes);
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } catch (error) {
    console.warn('Failed to load custom fonts, falling back to standard fonts:', error);
    // Fallback to standard fonts
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }
  
  const writer = new PDFWriter(pdfDoc, font, boldFont);
  
  // Title
  writer.writeText('Adapted Exam', { size: 24, bold: true });
  writer.addSpace(20);
  
  // Summary
  writer.writeText('Summary', { size: 16, bold: true });
  writer.addSpace(10);
  writer.writeText(result.summary);
  writer.addSpace(20);
  
  // Changes made
  writer.writeText(`Changes Made: ${result.changesMade}`, { 
    size: 14, 
    bold: true, 
    color: [0.02, 0.59, 0.41] 
  });
  writer.addSpace(20);
  
  // Adapted exam
  writer.writeText('Adapted Exam', { size: 16, bold: true });
  writer.addSpace(10);
  writer.writeText(result.adaptedExam);
  writer.addSpace(20);
  
  // Suggested images
  if (result.suggestedImages && result.suggestedImages.length > 0) {
    writer.checkSpace(100);
    writer.writeText('Suggested Visual Aids', { size: 16, bold: true });
    writer.addSpace(10);
    
    for (const image of result.suggestedImages) {
      writer.writeText(image.description, { size: 12, bold: true, indent: 20 });
      writer.addSpace(5);
      writer.writeText(`Alt Text: ${image.altText}`, { size: 10, color: [0.39, 0.45, 0.55], indent: 20 });
      writer.addSpace(3);
      writer.writeText(
        `Placement: ${image.placement}${image.questionNumber ? ` | Question: ${image.questionNumber}` : ''}`,
        { size: 10, color: [0.39, 0.45, 0.55], indent: 20 }
      );
      writer.addSpace(10);
    }
  }
  
  // Recommendations
  if (result.recommendations.length > 0) {
    writer.checkSpace(100);
    writer.writeText('Recommendations', { size: 16, bold: true });
    writer.addSpace(10);
    
    for (const rec of result.recommendations) {
      writer.writeText(`• ${rec}`, { size: 11 });
      writer.addSpace(5);
    }
  }
  
  return Buffer.from(await pdfDoc.save());
}

async function generateExamDocx(result: ExamAnalysisResult): Promise<Buffer> {
  // Parse the adapted exam content to format it better
  const examLines = result.adaptedExam.split('\n').filter(line => line.trim());
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          text: "Adapted Exam",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Summary
        new Paragraph({
          text: "Summary",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: result.summary,
          spacing: { after: 240 },
        }),
        
        // Changes Made
        new Paragraph({
          children: [
            new TextRun({
              text: `Changes Made: ${result.changesMade}`,
              bold: true,
              size: 28,
              color: "059669",
            }),
          ],
          spacing: { after: 300 },
        }),
        
        // Adapted Exam Content
        new Paragraph({
          text: "Adapted Exam",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 200 },
        }),
        
        // Format each line of the exam
        ...examLines.map(line => {
          // Check if it's a heading/title (no number at start)
          if (line.match(/^[A-Z]/i) && !line.match(/^\d/)) {
            return new Paragraph({
              text: line,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 },
            });
          }
          
          // Regular question or content
          return new Paragraph({
            text: line,
            spacing: { after: 160 },
            indent: { left: line.startsWith(' ') ? 360 : 0 },
          });
        }),
        
        // Visual Aids
        ...(result.suggestedImages && result.suggestedImages.length > 0 ? [
          new Paragraph({
            text: "Suggested Visual Aids",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...result.suggestedImages.flatMap(image => [
            new Paragraph({
              text: image.description,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Alt Text: ",
                  bold: true,
                }),
                new TextRun({
                  text: image.altText,
                  italics: true,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Placement: ",
                  bold: true,
                }),
                new TextRun({
                  text: `${image.placement}${image.questionNumber ? ` | Question: ${image.questionNumber}` : ''}`,
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
          ]),
        ] : []),
        
        // Recommendations
        ...(result.recommendations.length > 0 ? [
          new Paragraph({
            text: "Recommendations",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...result.recommendations.map(rec => 
            new Paragraph({
              text: rec,
              bullet: {
                level: 0,
              },
              spacing: { after: 120 },
            })
          ),
        ] : []),
      ],
    }],
  });
  
  return Buffer.from(await Packer.toBuffer(doc));
}