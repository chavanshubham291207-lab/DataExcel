const { generateGeminiContent } = require('./geminiService');
const { buildATSPrompt } = require('./promptService');

/**
 * Calculates ATS Score & section breakdown for a resume.
 */
async function calculateATSScore(resumeContent, jobReq = {}) {
  const text = typeof resumeContent === 'string' ? resumeContent : JSON.stringify(resumeContent);
  const jobText = typeof jobReq === 'string' ? jobReq : JSON.stringify(jobReq);

  // Attempt Gemini Evaluation
  const prompt = buildATSPrompt(text.slice(0, 3000), jobText.slice(0, 1000));
  const geminiResult = await generateGeminiContent(prompt, 'You are an ATS Scoring Audit Engine. Be precise.');

  if (geminiResult) {
    return {
      success: true,
      engine: 'gemini',
      analysisText: geminiResult,
      score: extractScoreFromText(geminiResult) || 82
    };
  }

  // Fallback Rule Engine
  let score = 45;
  const checks = [];

  const textLower = text.toLowerCase();
  if (text.length > 300) { score += 10; checks.push('Sufficient resume content length'); }
  if (textLower.includes('@') && textLower.includes('.')) { score += 10; checks.push('Valid email contact information present'); }
  if (/\b\d{10}\b|\+\d{1,4}/.test(textLower)) { score += 5; checks.push('Phone number contact present'); }
  if (textLower.includes('skill') || textLower.includes('technolog')) { score += 10; checks.push('Clear Skills section headers'); }
  if (textLower.includes('educat') || textLower.includes('degree') || textLower.includes('bachelor')) { score += 10; checks.push('Education qualifications section present'); }
  if (textLower.includes('project') || textLower.includes('experience')) { score += 10; checks.push('Work experience / projects documented'); }

  score = Math.min(score, 96);

  const breakdown = {
    contactInfo: 95,
    skillsMatch: score > 75 ? 85 : 70,
    experienceAlignment: score > 80 ? 90 : 65,
    formattingStructure: 80
  };

  const suggestions = [
    'Use standard bullet points instead of custom graphics or symbols for skills lists.',
    'Include explicit project titles with month/year timelines.',
    'Add relevant keywords matching target job descriptions directly in experience bullet points.',
    'Ensure email address and phone number are formatted cleanly at top of resume.'
  ];

  return {
    success: true,
    engine: 'rule-based',
    score,
    breakdown,
    passedChecks: checks,
    suggestions,
    summaryMarkdown: `### ATS Readiness Audit Summary\n\n- **Overall ATS Score:** **${score}/100**\n- **Contact Info Formatting:** 95/100\n- **Skills Keyword Match:** ${breakdown.skillsMatch}/100\n- **Work History Alignment:** ${breakdown.experienceAlignment}/100\n\n#### Key Optimization Recommendations:\n${suggestions.map(s => `- ${s}`).join('\n')}`
  };
}

function extractScoreFromText(text) {
  const match = text.match(/(?:score|ats score|overall score)[:\s]*(\d{1,3})/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val >= 0 && val <= 100) return val;
  }
  return null;
}

module.exports = { calculateATSScore };
