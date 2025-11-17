const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhance text using Gemini Flash 1.5
exports.enhanceText = asyncHandler(async (req, res) => {
  const { text, context } = req.body;

  if (!text || text.trim().length === 0) {
    throw new AppError('Text is required for enhancement', 400);
  }

  if (text.length > 5000) {
    throw new AppError('Text is too long. Maximum 5000 characters allowed.', 400);
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Determine the prompt based on context
    let prompt;
    
    switch (context) {
      case 'observation':
        prompt = `You are a professional technical report writer for energy performance contracting service reports. 
        
Rewrite the following technician's field observation in a clear, professional, and concise format suitable for a client report. 
        
Guidelines:
- Use proper technical terminology
- Maintain factual accuracy - do not add information not present in the original text
- Format in complete, grammatically correct sentences
- Keep it objective and professional
- Be concise but comprehensive

Original Observation:
${text}

Enhanced Professional Observation:`;
        break;

      case 'action_taken':
        prompt = `You are a professional technical report writer for energy performance contracting service reports.

Rewrite the following technician's description of actions taken in a clear, professional, and structured format suitable for a client report.

Guidelines:
- Present actions in a logical sequence
- Use proper technical terminology
- Maintain factual accuracy - do not add information not present in the original text
- Format in complete, grammatically correct sentences
- Be professional and clear

Original Action Description:
${text}

Enhanced Professional Action Report:`;
        break;

      case 'recommendation':
        prompt = `You are a professional technical report writer for energy performance contracting service reports.

Rewrite the following technician's recommendation in a clear, professional, and actionable format suitable for a client report.

Guidelines:
- Make recommendations clear and actionable
- Use professional language
- Prioritize important recommendations
- Maintain factual accuracy - do not add information not present in the original text
- Be specific about suggested actions

Original Recommendation:
${text}

Enhanced Professional Recommendation:`;
        break;

      default:
        // Generic enhancement
        prompt = `You are a professional technical report writer for energy performance contracting service reports.

Rewrite the following technical service note in a professional, clear, and concise format suitable for a client report.

Guidelines:
- Use proper technical terminology
- Maintain factual accuracy - do not add information not present in the original text
- Format in complete, grammatically correct sentences
- Keep it objective and professional

Original Text:
${text}

Enhanced Professional Text:`;
    }

    // Generate enhanced text
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text();

    if (!enhancedText || enhancedText.trim().length === 0) {
      throw new AppError('Failed to generate enhanced text. Please try again.', 500);
    }

    logger.info(`Text enhanced successfully for user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Text enhanced successfully',
      data: {
        original: text,
        enhanced: enhancedText.trim(),
        context: context || 'general',
      },
    });
  } catch (error) {
    logger.error('Gemini API error:', error);

    if (error.message.includes('API key')) {
      throw new AppError('AI service configuration error. Please contact support.', 500);
    }

    if (error.message.includes('quota')) {
      throw new AppError('AI service temporarily unavailable. Please try again later.', 503);
    }

    throw new AppError('Failed to enhance text. Please try again.', 500);
  }
});

// Batch enhance multiple texts
exports.batchEnhance = asyncHandler(async (req, res) => {
  const { texts } = req.body;

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    throw new AppError('An array of text objects is required', 400);
  }

  if (texts.length > 10) {
    throw new AppError('Maximum 10 texts can be enhanced at once', 400);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const results = [];

  try {
    for (const item of texts) {
      if (!item.text || item.text.trim().length === 0) {
        results.push({
          original: item.text || '',
          enhanced: '',
          error: 'Empty text',
        });
        continue;
      }

      const prompt = `You are a professional technical report writer. Rewrite the following text in a professional format suitable for a client report. Do not add information not present in the original text.

Original Text: ${item.text}

Enhanced Text:`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const enhancedText = response.text();

        results.push({
          original: item.text,
          enhanced: enhancedText.trim(),
          context: item.context || 'general',
        });
      } catch (error) {
        results.push({
          original: item.text,
          enhanced: '',
          error: 'Enhancement failed',
        });
      }
    }

    logger.info(`Batch text enhancement completed for user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Batch enhancement completed',
      data: { results },
    });
  } catch (error) {
    logger.error('Batch enhancement error:', error);
    throw new AppError('Batch enhancement failed. Please try again.', 500);
  }
});

// Generate work order summary
exports.generateSummary = asyncHandler(async (req, res) => {
  const { workOrderData } = req.body;

  if (!workOrderData) {
    throw new AppError('Work order data is required', 400);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional technical report writer. Generate a concise executive summary for the following service work order.

Work Order Details:
Title: ${workOrderData.title}
Site: ${workOrderData.site_name}
Asset(s): ${workOrderData.assets?.join(', ') || 'N/A'}
Observations: ${workOrderData.observations || 'N/A'}
Actions Taken: ${workOrderData.actions || 'N/A'}
Recommendations: ${workOrderData.recommendations || 'N/A'}

Generate a brief, professional executive summary (2-3 paragraphs) highlighting the key issue, actions taken, and outcome:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      data: { summary: summary.trim() },
    });
  } catch (error) {
    logger.error('Summary generation error:', error);
    throw new AppError('Failed to generate summary. Please try again.', 500);
  }
});

