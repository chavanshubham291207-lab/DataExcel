const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const CandidateUser = require('../models/CandidateUser');
const ChatHistory = require('../models/ChatHistory');
const { generateGeminiContent } = require('./geminiService');
const { buildRecruiterPrompt, buildCandidatePrompt, RECRUITER_SYSTEM_PROMPT, CANDIDATE_SYSTEM_PROMPT } = require('./promptService');
const { rankCandidatesPool } = require('./rankingEngine');
const { recommendJobsForCandidate } = require('./jobRecommendationEngine');
const { calculateATSScore } = require('./atsEngine');
const { generateCareerAdvice } = require('./careerAdvisor');
const { generateInterviewQuestions } = require('./interviewGenerator');
const { detectIntent } = require('./intentDetector');
const { searchCandidatesDB, searchJobsDB, getTopATSCandidatesDB } = require('./dbSearchEngine');
const { sendRecruitmentInvitations, shortlistCandidates, rejectCandidates } = require('./actionExecutionEngine');

/**
 * Intelligent Agent Router
 * Manages conversation context memory, executes action commands directly in MongoDB, and routes DB vs Gemini queries.
 */
async function processAgentChat({ user, role, message, activeJobId = null, userModel }) {
  const intent = detectIntent(message);

  // Retrieve last conversation context from MongoDB ChatHistory for session memory
  let lastCandidates = [];
  try {
    const historyDoc = await ChatHistory.findOne({ userId: user._id }).sort({ updatedAt: -1 });
    if (historyDoc && historyDoc.messages && historyDoc.messages.length > 0) {
      // Look backward for last candidate search results in metadata
      for (let i = historyDoc.messages.length - 1; i >= 0; i--) {
        const meta = historyDoc.messages[i].metadata;
        if (meta && meta.records && Array.isArray(meta.records) && meta.records.length > 0) {
          lastCandidates = meta.records;
          break;
        }
      }
    }
  } catch (err) {
    console.error('[AgentRouter] Error fetching conversation context:', err.message);
  }

  // 1. Action Intent: Send Recruitment Invitations (NO Email, MongoDB In-App Records)
  if (intent.type === 'ACTION_INVITE_CANDIDATES') {
    const targetCandidates = lastCandidates.length > 0
      ? lastCandidates.slice(0, intent.count || 5)
      : await CandidateUser.find({}).sort({ atsScore: -1 }).limit(intent.count || 5).lean();

    const actionResult = await sendRecruitmentInvitations({
      recruiter: user,
      candidatesList: targetCandidates,
      jobId: activeJobId
    });

    return {
      reply: actionResult.reply,
      intent: 'action_invite_candidates',
      metadata: { count: actionResult.count }
    };
  }

  // 2. Action Intent: Shortlist Candidates
  if (intent.type === 'ACTION_SHORTLIST') {
    const targetCandidates = lastCandidates.length > 0 ? lastCandidates : await Candidate.find({}).limit(5).lean();
    const actionResult = await shortlistCandidates({ recruiter: user, candidatesList: targetCandidates });
    return {
      reply: actionResult.reply,
      intent: 'action_shortlist',
      metadata: {}
    };
  }

  // 3. Action Intent: Reject Candidates
  if (intent.type === 'ACTION_REJECT') {
    const targetCandidates = lastCandidates.length > 0 ? lastCandidates : await Candidate.find({}).limit(5).lean();
    const actionResult = await rejectCandidates({ recruiter: user, candidatesList: targetCandidates });
    return {
      reply: actionResult.reply,
      intent: 'action_reject',
      metadata: {}
    };
  }

  // 4. Database Search: Candidates
  if (intent.type === 'SEARCH_CANDIDATES') {
    const dbResult = await searchCandidatesDB({ skill: intent.skill, city: intent.city });
    return {
      reply: dbResult.reply,
      intent: 'db_candidate_search',
      metadata: { count: dbResult.count, skill: intent.skill, city: intent.city, records: dbResult.records }
    };
  }

  // 5. Database Search: Jobs
  if (intent.type === 'SEARCH_JOBS') {
    const dbResult = await searchJobsDB({ skill: intent.skill, city: intent.city });
    return {
      reply: dbResult.reply,
      intent: 'db_job_search',
      metadata: { count: dbResult.count, skill: intent.skill, city: intent.city, records: dbResult.records }
    };
  }

  // 6. Database Search: Top ATS Candidates
  if (intent.type === 'TOP_ATS_CANDIDATES') {
    const dbResult = await getTopATSCandidatesDB({ limit: intent.limit });
    return {
      reply: dbResult.reply,
      intent: 'db_top_ats_candidates',
      metadata: { count: dbResult.count, records: dbResult.records }
    };
  }

  // 7. Role-driven Processing for Gemini AI Queries
  const msgLower = message.toLowerCase();
  if (role === 'recruiter') {
    return await handleRecruiterAgent({ user, message, msgLower, activeJobId });
  } else {
    return await handleCandidateAgent({ user, message, msgLower });
  }
}

/**
 * Recruiter AI Agent Engine
 */
async function handleRecruiterAgent({ user, message, msgLower, activeJobId }) {
  let activeJob = null;
  if (activeJobId) {
    activeJob = await Job.findById(activeJobId);
  }

  let candidatePool = await CandidateUser.find({}).limit(20).lean();
  if (candidatePool.length === 0) {
    candidatePool = await Candidate.find({}).limit(20).lean();
  }

  if (msgLower.includes('interview') || msgLower.includes('question') || msgLower.includes('assess')) {
    const jobTitle = activeJob ? activeJob.title : 'Software Developer';
    const topCand = candidatePool[0] || {};
    const questions = await generateInterviewQuestions(jobTitle, topCand);

    return {
      reply: questions.contentMarkdown,
      intent: 'interview_generation',
      metadata: { jobTitle }
    };
  }

  const prompt = buildRecruiterPrompt(message, candidatePool, activeJob);
  const geminiResponse = await generateGeminiContent(prompt, RECRUITER_SYSTEM_PROMPT);

  if (geminiResponse) {
    return {
      reply: geminiResponse,
      intent: 'recruiter_query',
      metadata: { engine: 'gemini' }
    };
  }

  return {
    reply: `### 🤖 Recruiter AI Agent Assistant\n\nI am connected to your MongoDB pipeline and ready to execute recruitment actions.\n\nTry these action commands:\n1. **Find Candidates:** *"Find React Developers"* or *"Top 5 ATS candidates"*\n2. **Send Applications (No Email):** *"Send application to these top 5 candidates"*\n3. **Shortlist / Reject:** *"Shortlist candidates"* or *"Reject candidates"*\n4. **Generate Interview Assessment:** *"Generate interview questions for Senior Engineer"*`,
    intent: 'recruiter_fallback',
    metadata: { engine: 'rule-based' }
  };
}

/**
 * Candidate AI Agent Engine
 */
async function handleCandidateAgent({ user, message, msgLower }) {
  const openJobs = await Job.find({ status: 'Published' }).limit(10).lean();

  const candidateProfile = {
    name: user.name || 'Candidate',
    email: user.email || '',
    skills: user.skills || ['JavaScript', 'React', 'Node.js'],
    totalExperience: user.totalExperience || 2,
    education: user.education || [],
    workExperience: user.workExperience || [],
    atsScore: user.atsScore || 78,
    resumePath: user.resumePath || ''
  };

  if (msgLower.includes('roadmap') || msgLower.includes('course') || msgLower.includes('learn') || msgLower.includes('career advice')) {
    const advice = await generateCareerAdvice(candidateProfile, message);
    return {
      reply: advice.adviceMarkdown,
      intent: 'career_roadmap',
      metadata: {}
    };
  }

  const prompt = buildCandidatePrompt(message, candidateProfile, openJobs);
  const geminiResponse = await generateGeminiContent(prompt, CANDIDATE_SYSTEM_PROMPT);

  if (geminiResponse) {
    return {
      reply: geminiResponse,
      intent: 'candidate_query',
      metadata: { engine: 'gemini' }
    };
  }

  return {
    reply: `### 🌟 Candidate AI Career Assistant\n\nHello **${candidateProfile.name}**! I am your personal AI Career Agent.\n\nHere is how I can assist you:\n1. **My Invitations:** Check the **My Invitations** tab on your sidebar to accept/reject recruiter invitations.\n2. **Database Job Search:** Ask *"Frontend jobs in Pune"* or *"Node.js jobs in Remote"*.\n3. **Career Roadmap & Courses:** Ask *"Give me a learning roadmap for Senior Full Stack Developer"*.\n4. **Interview Prep:** Ask *"Prepare me for a React interview"*`,
    intent: 'candidate_fallback',
    metadata: { engine: 'rule-based' }
  };
}

module.exports = { processAgentChat };
