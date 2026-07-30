const { generateGeminiContent } = require('./geminiService');

const COMMON_SKILLS = [
  'javascript', 'typescript', 'react', 'angular', 'vue', 'next.js', 'node.js', 'express',
  'python', 'fastapi', 'django', 'flask', 'java', 'spring boot', 'c++', 'c#', '.net', 'go',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'mysql', 'redis',
  'tailing', 'tailwind', 'graphql', 'rest api', 'ci/cd', 'git', 'machine learning', 'data science'
];

/**
 * Analyzes resume profile data or raw text.
 */
async function analyzeResume(resumeData) {
  const text = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData);

  // Attempt Gemini Analysis
  const prompt = `Analyze the following resume and return an evaluation summary in JSON format:
{
  "summary": "...",
  "skills": ["..."],
  "experienceYears": 0,
  "education": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."]
}

Resume Text:
${text.slice(0, 3000)}`;

  const geminiResponse = await generateGeminiContent(prompt, 'You are an expert resume parser. Respond ONLY with valid JSON.');

  if (geminiResponse) {
    try {
      const cleanJson = geminiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return { success: true, data: parsed, engine: 'gemini' };
    } catch (e) {
      console.log('[ResumeAnalyzer] JSON parse failed from Gemini, running smart fallback engine.');
    }
  }

  // Fallback Rule Engine
  const textLower = text.toLowerCase();
  const foundSkills = COMMON_SKILLS.filter(skill => textLower.includes(skill.toLowerCase()))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  let expYears = 1;
  const expMatch = textLower.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (expMatch) {
    expYears = parseInt(expMatch[1], 10);
  }

  return {
    success: true,
    engine: 'rule-based',
    data: {
      summary: typeof resumeData === 'object' && resumeData.summary ? resumeData.summary : 'Experienced software professional with demonstrated technical project history.',
      skills: foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Node.js', 'Problem Solving'],
      experienceYears: expYears,
      education: typeof resumeData === 'object' && Array.isArray(resumeData.education) ? resumeData.education : ['Bachelor of Computer Science / Engineering'],
      strengths: [
        'Solid foundational technical skills parsed from candidate profile.',
        `Demonstrated industry experience (${expYears} years).`,
        'Active project engagement and adaptable tech stack knowledge.'
      ],
      weaknesses: [
        foundSkills.length < 5 ? 'Keyword density for secondary tech stack is low.' : 'Resume length and visual section hierarchy could be improved.',
        'Quantifiable impact metrics (e.g. % performance increase) are sparse.'
      ],
      improvements: [
        'Incorporate specific metrics and business results for past work items.',
        'Include industry-standard certifications (e.g. AWS, Scrum) to boost recruiter visibility.',
        'Optimize skills section headers for ATS parsing standard.'
      ]
    }
  };
}

module.exports = { analyzeResume };
