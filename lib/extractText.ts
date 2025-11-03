import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export async function extractTextFromFile(filePath: string, originalName: string): Promise<string> {
  const extension = path.extname(originalName).toLowerCase();
  
  try {
    switch (extension) {
      case '.pdf':
        return await extractTextFromPdf(filePath);
      case '.docx':
        return await extractTextFromDocx(filePath);
      case '.doc':
        return await extractTextFromDoc(filePath);
      case '.txt':
        return await extractTextFromTxt(filePath);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // Read file as Buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Dynamic import only - no static import
    let pdfParse: any;
    try {
      const pdfParseModule = await import('pdf-parse');
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (importError) {
      console.error('Failed to import pdf-parse:', importError);
      throw new Error('PDF parsing library not available. Please install pdf-parse: npm install pdf-parse');
    }
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    // Check if result has text property
    if (!data || typeof data !== 'object' || !data.text) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('getDocument')) {
        throw new Error('Failed to parse PDF file. The file might be corrupted or password-protected.');
      } else if (error.message.includes('ENOMEM')) {
        throw new Error('The PDF file is too large to process. Please try a smaller file.');
      } else if (error.message.includes('not available')) {
        throw new Error('PDF parsing library not installed correctly. Please run: npm install pdf-parse');
      }
    }
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value) {
      throw new Error('No text could be extracted from the DOCX file');
    }
    
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractTextFromDoc(filePath: string): Promise<string> {
  throw new Error('DOC files are not supported yet. Please convert to DOCX or PDF.');
}

async function extractTextFromTxt(filePath: string): Promise<string> {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    
    if (!text) {
      throw new Error('TXT file is empty');
    }
    
    return text;
  } catch (error) {
    console.error('TXT extraction error:', error);
    throw new Error(`Failed to extract text from TXT file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}