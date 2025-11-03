import mammoth from 'mammoth';

// No fs or path needed for buffers

export async function extractTextFromFileBuffer(fileBuffer: Buffer, originalName: string): Promise<string> {
  const extension = originalName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return extractTextFromPdfBuffer(fileBuffer);
    case 'docx':
      return extractTextFromDocxBuffer(fileBuffer);
    case 'txt':
      return fileBuffer.toString('utf8');
    case 'doc':
      throw new Error('DOC files are not supported. Convert to DOCX or PDF.');
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

// PDF
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  let pdfParse: any;
  try {
    const pdfParseModule = await import('pdf-parse');
    pdfParse = pdfParseModule.default || pdfParseModule;
  } catch (err) {
    throw new Error('PDF parsing library not available. Run: npm install pdf-parse');
  }

  const data = await pdfParse(buffer);

  if (!data?.text) {
    throw new Error('No text could be extracted from the PDF');
  }

  return data.text;
}

// DOCX
async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });

  if (!result.value) {
    throw new Error('No text could be extracted from the DOCX file');
  }

  return result.value;
}
