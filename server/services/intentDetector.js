/**
 * Intent Detector Service
 * Classifies user text into database queries, action commands, or general AI advice.
 */

const KNOWN_SKILLS = [
  'react', 'node', 'nodejs', 'node.js', 'python', 'java', 'full stack', 'fullstack',
  'frontend', 'backend', 'devops', 'aws', 'azure', 'docker', 'kubernetes', 'flutter',
  'android', 'ai', 'ml', 'machine learning', 'data science', 'ui/ux', 'ui ux', 'qa', 'security'
];

const KNOWN_CITIES = ['pune', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'delhi', 'noida', 'gurgaon', 'remote'];

function detectIntent(message) {
  const msgLower = message.toLowerCase().trim();

  // 1. Action Intent: Send Application / Invite Candidates (NO email, create MongoDB records)
  if (
    msgLower.includes('send application') ||
    msgLower.includes('send invitation') ||
    msgLower.includes('invite top') ||
    msgLower.includes('invite candidate') ||
    msgLower.includes('send invite') ||
    msgLower.includes('invite these')
  ) {
    const limitMatch = msgLower.match(/\b(\d+)\b/);
    const count = limitMatch ? parseInt(limitMatch[1], 10) : 5;
    return {
      type: 'ACTION_INVITE_CANDIDATES',
      count
    };
  }

  // 2. Action Intent: Shortlist Candidates
  if (msgLower.includes('shortlist') || msgLower.includes('shortlist candidate')) {
    return { type: 'ACTION_SHORTLIST' };
  }

  // 3. Action Intent: Reject Candidates
  if (msgLower.includes('reject candidate') || msgLower.includes('reject these')) {
    return { type: 'ACTION_REJECT' };
  }

  // 4. TOP ATS Candidates Intent
  if (
    msgLower.includes('top ats') ||
    msgLower.includes('best ats') ||
    msgLower.includes('highest ats') ||
    msgLower.includes('top 5 ats') ||
    msgLower.includes('top 10 ats')
  ) {
    const limitMatch = msgLower.match(/\b(\d+)\b/);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 5;
    return {
      type: 'TOP_ATS_CANDIDATES',
      limit
    };
  }

  // 5. Candidate Search Intent (e.g. "Find React Developers", "Show candidates with Python")
  const isCandidateQuery =
    msgLower.includes('candidate') ||
    msgLower.includes('developer') ||
    msgLower.includes('engineer') ||
    msgLower.includes('find ') ||
    msgLower.includes('search ') ||
    msgLower.includes('who knows') ||
    msgLower.includes('who has');

  const detectedSkill = KNOWN_SKILLS.find(s => msgLower.includes(s));
  const detectedCity = KNOWN_CITIES.find(c => msgLower.includes(c));

  if (isCandidateQuery && !msgLower.includes('job') && !msgLower.includes('vacancy') && !msgLower.includes('opening')) {
    return {
      type: 'SEARCH_CANDIDATES',
      skill: detectedSkill ? formatSkill(detectedSkill) : null,
      city: detectedCity ? formatCity(detectedCity) : null
    };
  }

  // 6. Job Search Intent (e.g. "Show jobs in Pune", "Frontend jobs in Bangalore", "Recommend jobs")
  const isJobQuery =
    msgLower.includes('job') ||
    msgLower.includes('vacancy') ||
    msgLower.includes('openings') ||
    msgLower.includes('hiring') ||
    msgLower.includes('show jobs') ||
    msgLower.includes('find jobs');

  if (isJobQuery) {
    return {
      type: 'SEARCH_JOBS',
      skill: detectedSkill ? formatSkill(detectedSkill) : null,
      city: detectedCity ? formatCity(detectedCity) : null
    };
  }

  // 7. Fallback Candidate Search check if skill is directly mentioned with "find" or "show"
  if ((msgLower.startsWith('find ') || msgLower.startsWith('show ')) && detectedSkill) {
    return {
      type: 'SEARCH_CANDIDATES',
      skill: formatSkill(detectedSkill),
      city: detectedCity ? formatCity(detectedCity) : null
    };
  }

  // 8. Default General AI Conversation
  return {
    type: 'GENERAL_AI'
  };
}

function formatSkill(skill) {
  if (skill === 'node' || skill === 'nodejs' || skill === 'node.js') return 'Node.js';
  if (skill === 'react') return 'React';
  if (skill === 'python') return 'Python';
  if (skill === 'java') return 'Java';
  if (skill === 'fullstack' || skill === 'full stack') return 'Full Stack';
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

function formatCity(city) {
  if (city === 'bengaluru') return 'Bangalore';
  if (city === 'remote') return 'Remote';
  return city.charAt(0).toUpperCase() + city.slice(1);
}

module.exports = { detectIntent };
