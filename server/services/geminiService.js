const { askGemini } = require('./gemini.service');

/**
 * Calls Google Gemini API with prompt and system instructions.
 * Delegates to askGemini using official @google/generative-ai SDK.
 */
async function generateGeminiContent(prompt, systemInstruction = '') {
  const fullPrompt = systemInstruction
    ? `[SYSTEM INSTRUCTION]\n${systemInstruction}\n[END SYSTEM INSTRUCTION]\n\nUser Query: ${prompt}`
    : prompt;

  return await askGemini(fullPrompt);
}

module.exports = {
  generateGeminiContent,
  askGemini
};
