const { generateGeminiContent } = require('./geminiService');

/**
 * Calculates candidate match score against job requisition.
 */
function calculateCandidateMatch(candidate, job) {
  const candSkills = (candidate.skills || []).map(s => String(s).toLowerCase());
  const jobSkillsRaw = job.requiredSkills || job.skills || [];
  const jobSkills = (Array.isArray(jobSkillsRaw) ? jobSkillsRaw : String(jobSkillsRaw).split(','))
    .map(s => String(s).trim().toLowerCase())
    .filter(Boolean);

  let matchedSkills = [];
  let missingSkills = [];

  if (jobSkills.length > 0) {
    matchedSkills = jobSkills.filter(js => candSkills.some(cs => cs.includes(js) || js.includes(cs)));
    missingSkills = jobSkills.filter(js => !matchedSkills.includes(js));
  } else {
    matchedSkills = candSkills.slice(0, 5);
  }

  const skillScore = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 85;

  const reqExp = parseInt(String(job.experience || '0').match(/\d+/) || 0, 10);
  const candExp = candidate.totalExperience || candidate.experience || 0;
  const expScore = candExp >= reqExp ? 100 : reqExp > 0 ? (candExp / reqExp) * 100 : 80;

  const atsScore = candidate.atsScore || 75;

  const finalScore = Math.round(
    (skillScore * 0.5) + (expScore * 0.3) + (atsScore * 0.2)
  );

  return {
    candidateId: candidate._id || candidate.id,
    name: candidate.name || 'Candidate',
    email: candidate.email || '',
    headline: candidate.headline || candidate.jobRole || 'Software Professional',
    matchScore: Math.max(Math.min(finalScore, 99), 35),
    skillScore: Math.round(skillScore),
    expScore: Math.round(expScore),
    atsScore,
    matchedSkills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    experienceYears: candExp,
    requiredExperience: reqExp
  };
}

/**
 * Ranks candidate pool against job requisition.
 */
async function rankCandidatesPool(job, candidates) {
  if (!candidates || candidates.length === 0) {
    return { success: false, error: 'No candidates provided for ranking.' };
  }

  const rankedList = candidates
    .map(cand => calculateCandidateMatch(cand, job))
    .sort((a, b) => b.matchScore - a.matchScore);

  const top10 = rankedList.slice(0, 10);
  const topMatch = top10[0];

  // Try Gemini for comparative selection explanation
  const prompt = `Explain why the top candidate "${topMatch.name}" (Match Score: ${topMatch.matchScore}%) was selected over others for Job: "${job.title || 'Requisition'}".
Top Candidate Details: ${JSON.stringify(topMatch)}
2nd Candidate Details: ${JSON.stringify(top10[1] || 'None')}

Provide a concise, 3-bullet recruiter justification summary.`;

  const explanation = await generateGeminiContent(prompt, 'You are an executive hiring agent.') ||
    `**Top Candidate Selection Justification:**\n- **Highest Skill Alignment:** ${topMatch.name} covers ${topMatch.matchedSkills.length} core required skills (${topMatch.matchedSkills.join(', ') || 'N/A'}).\n- **Experience Match:** Holds ${topMatch.experienceYears} years of industry experience against required ${topMatch.requiredExperience} years.\n- **ATS & Profile Quality:** Verified ATS readiness score of ${topMatch.atsScore}/100.`;

  return {
    success: true,
    jobTitle: job.title || 'Requisition',
    totalAnalyzed: candidates.length,
    rankedCandidates: top10,
    topRecommendation: topMatch,
    justificationMarkdown: explanation
  };
}

module.exports = { calculateCandidateMatch, rankCandidatesPool };
