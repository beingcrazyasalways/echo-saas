/**
 * Document Service
 * Handles text extraction from various document types
 */

/**
 * Extract text from a document file
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromDocument(file) {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // TXT files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await extractFromTextFile(file);
    }

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractFromPDF(file);
    }

    // Image files (OCR)
    if (fileType.startsWith('image/')) {
      return await extractFromImage(file);
    }

    // DOC/DOCX files
    if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return await extractFromWord(file);
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extract text from plain text file
 */
async function extractFromTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Extract text from PDF file
 * Note: Uses browser-compatible pdfjs-dist
 */
async function extractFromPDF(file) {
  try {
    // Dynamic import to avoid build issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('PDF extraction failed. Please try a different file.');
  }
}

/**
 * Extract text from image using OCR
 * Note: Requires Tesseract.js
 */
async function extractFromImage(file) {
  try {
    // Dynamic import to avoid build issues
    const Tesseract = (await import('tesseract.js')).default;
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m),
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('OCR failed. Make sure Tesseract.js is installed.');
  }
}

/**
 * Extract text from Word document
 * Note: Requires mammoth library
 */
async function extractFromWord(file) {
  try {
    // Dynamic import to avoid build issues
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Word extraction failed. Make sure mammoth is installed.');
  }
}

/**
 * Extract text from current webpage
 * @returns {string} Extracted text from page
 */
export function extractFromWebpage() {
  // Get main content areas
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '#content',
    'body'
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText || element.textContent;
    }
  }

  // Fallback to body
  return document.body.innerText || document.body.textContent;
}
