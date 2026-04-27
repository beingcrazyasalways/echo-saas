/**
 * AI Service for Document Processing
 * Handles AI-based document analysis and actions using Mistral AI
 */

const MISTRAL_API_KEY = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

/**
 * Process document with AI based on user action
 * @param {string} text - Extracted text from document
 * @param {string} action - User requested action (summarize, extract_tasks, convert_txt, convert_pdf)
 * @returns {Promise<Object>} Result with message and optional data
 */
export async function processDocumentWithAI(text, action) {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key not configured');
  }

  const prompt = buildActionPrompt(text, action);

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          {
            role: 'system',
            content: 'You are a document processing assistant. Analyze documents and provide structured responses in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    return parseAIResponse(aiResponse, action, text);
  } catch (error) {
    console.error('AI processing error:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

/**
 * Build prompt based on action type
 */
function buildActionPrompt(text, action) {
  const truncatedText = text.substring(0, 10000); // Limit text length

  switch (action) {
    case 'summarize':
      return `Summarize the following document in 3-5 bullet points:\n\n${truncatedText}\n\nProvide a concise summary.`;

    case 'extract_tasks':
      return `Extract actionable tasks from the following document. For each task, identify:\n- Task title\n- Priority (high/medium/low)\n- Deadline (if mentioned)\n\nDocument:\n${truncatedText}\n\nReturn in JSON format: {"tasks": [{"title": "...", "priority": "...", "deadline": "..."}]}`;

    case 'convert_txt':
      return `The user wants to convert this document to plain text. Just confirm the text is ready for download:\n\n${truncatedText.substring(0, 500)}...`;

    case 'convert_pdf':
      return `The user wants to convert this document to PDF. Just confirm the text is ready for PDF generation:\n\n${truncatedText.substring(0, 500)}...`;

    default:
      return `Analyze this document:\n\n${truncatedText}`;
  }
}

/**
 * Parse AI response based on action
 */
function parseAIResponse(response, action, originalText) {
  switch (action) {
    case 'summarize':
      return {
        message: response,
        type: 'summary'
      };

    case 'extract_tasks':
      try {
        // Try to parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            message: `I found ${parsed.tasks?.length || 0} tasks in your document.`,
            tasks: parsed.tasks || [],
            type: 'tasks'
          };
        }
        
        // Fallback: extract tasks manually
        const tasks = extractTasksManually(response);
        return {
          message: `I found ${tasks.length} tasks in your document.`,
          tasks,
          type: 'tasks'
        };
      } catch (error) {
        console.error('Task parsing error:', error);
        return {
          message: response,
          tasks: [],
          type: 'tasks'
        };
      }

    case 'convert_txt':
      return {
        message: 'Document converted to TXT. Downloading...',
        downloadUrl: createDownloadUrl(originalText, 'text/plain'),
        type: 'download'
      };

    case 'convert_pdf':
      return {
        message: 'Document converted to PDF. Downloading...',
        downloadUrl: createDownloadUrl(originalText, 'application/pdf'),
        type: 'download'
      };

    default:
      return {
        message: response,
        type: 'general'
      };
  }
}

/**
 * Extract tasks manually from text
 */
function extractTasksManually(text) {
  const tasks = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for task-like patterns
    if (trimmed.match(/^(to|task|todo|action|need|must|should)/i) || 
        trimmed.match(/^\d+\./) ||
        trimmed.match(/^[-*•]/)) {
      tasks.push({
        title: trimmed.replace(/^[\d\-*•]+\s*/, '').trim(),
        priority: 'medium',
        deadline: null
      });
    }
  }
  
  return tasks.slice(0, 10); // Limit to 10 tasks
}

/**
 * Create download URL from text content
 */
function createDownloadUrl(text, mimeType) {
  if (mimeType === 'application/pdf') {
    // Use jsPDF for PDF generation
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF();
    
    // Add text to PDF (simple wrapping)
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  }
  
  const blob = new Blob([text], { type: mimeType });
  return URL.createObjectURL(blob);
}
