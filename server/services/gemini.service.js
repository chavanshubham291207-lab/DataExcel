const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Production-ready Gemini LLM Service using official @google/generative-ai SDK.
 * Model fallback order:
 * 1. gemini-2.5-flash
 * 2. gemini-2.0-flash
 * 3. gemini-1.5-flash
 */

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY || '';

/**
 * Sends a prompt to Gemini LLM model and returns the generated text response.
 * Uses a strict timeout of 12000ms per model via Promise.race to prevent hanging.
 * @param {string} prompt - The input prompt string for Gemini
 * @returns {Promise<string|null>} The generated response text or null if error
 */
async function askGemini(prompt) {
  try {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      console.warn('[Gemini.Service] Empty or invalid prompt provided.');
      return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('[Gemini.Service] GEMINI_API_KEY is not configured in .env.');
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('SENDING TO GEMINI:', prompt.slice(0, 150));

    // Production model fallback sequence
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // 12-second timeout helper using Promise.race
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 12000));
        
        const generatePromise = (async () => {
          try {
            const result = await model.generateContent(prompt.trim());
            const response = await result.response;
            return response.text();
          } catch (e) {
            return null;
          }
        })();

        const text = await Promise.race([generatePromise, timeoutPromise]);

        if (text && text.trim()) {
          console.log('GEMINI RESPONSE:', text.slice(0, 150));
          return text;
        }
      } catch (err) {
        console.warn(`[Gemini.Service] Notice for model ${modelName}:`, err.message?.slice(0, 120));
      }
    }

    console.warn('[Gemini.Service] All Gemini models returned null or rate limited. Returning null.');
    return null;

  } catch (error) {
    console.error('[Gemini.Service] Error executing askGemini:', error.message || error);
    return null;
  }
}

module.exports = {
  askGemini
};
