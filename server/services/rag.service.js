/**
 * Enterprise RAG Service — Phase 9
 * Centralized Company Knowledge Base Retrieval.
 *
 * Flow for every query:
 *   1. Classify which MongoDB collections are relevant to the query.
 *   2. Fetch real records from those collections.
 *   3. Optionally layer vector similarity ranking on top.
 *   4. Return a structured context object for Gemini to synthesise.
 *
 * Priority: Company Data > Vector Search > Gemini knowledge alone.
 * Never answer from Gemini alone when company records exist.
 */

const Candidate  = require('../models/Candidate');
const CandidateUser = require('../models/CandidateUser');
const Job        = require('../models/Job');
const Application = require('../models/Application');
const Interview  = require('../models/Interview');
const Recruiter  = require('../models/Recruiter');
const Company    = require('../models/Company');
const Invitation = require('../models/Invitation');
const cacheService = require('./cache.service');
const { generateEmbedding, cosineSimilarity } = require('./embedding.service');

// ─────────────────────────────────────────────────────────────
// COLLECTION ROUTING — decide which MongoDB collections matter
// ─────────────────────────────────────────────────────────────
const ROUTING_MAP = [
  {
    key: 'candidates',
    triggers: [
      'candidate','developer','engineer','programmer','talent','applicant','profile',
      'shortlist','hire','who knows','which candidate','react developer','node developer',
      'python developer','mern developer','top candidate','ats score','resume','cv',
      'technical skill','tech skill','skill set','hard skill','soft skill',
      'years experience','experienced','fresher','junior','senior','lead'
    ]
  },
  {
    key: 'jobs',
    triggers: [
      'job','vacancy','opening','position','role','hiring','careers','employment',
      'jd','job description','which job','available job','active job','closed job',
      'salary','package','ctc','lpa','remote','onsite','location','department'
    ]
  },
  {
    key: 'applications',
    triggers: [
      'application','applied','application status','who applied','pending application',
      'shortlisted','under review','selected','rejected application','hired'
    ]
  },
  {
    key: 'interviews',
    triggers: [
      'interview','scheduled interview','pending interview','upcoming interview',
      'interview status','interview feedback','panel','cancelled interview',
      'interview date','interview time','interview mode','video call','in-person'
    ]
  },
  {
    key: 'companies',
    triggers: [
      'company','organisation','organization','which company','company detail',
      'company profile','client','partner company','list all compan','all companies',
      'our companies','show companies'
    ]
  },
  {
    key: 'recruiters',
    triggers: [
      'recruiter','hiring manager','who posted','posted by','hr team',
      'list recruiters','all recruiters','show recruiters'
    ]
  }
];

/**
 * Classify which collections are relevant for a given query text.
 */
function classifyCollections(text) {
  const lower = text.toLowerCase();
  const relevant = new Set();
  for (const route of ROUTING_MAP) {
    if (route.triggers.some(t => lower.includes(t))) {
      relevant.add(route.key);
    }
  }
  // Always fetch candidates when asking about skills
  if (lower.includes('skill') || lower.includes('know react') || lower.includes('know python')) {
    relevant.add('candidates');
  }
  return [...relevant];
}

// ─────────────────────────────────────────────────────────────
// INDIVIDUAL COLLECTION RETRIEVERS
// ─────────────────────────────────────────────────────────────

async function retrieveCandidates(text, recruiterFilter) {
  const lower = text.toLowerCase();

  // Build keyword filter
  const orConditions = [];

  // Skill extraction
  const skillRegex = /(react|node\.?js|python|java|devops|cloud|flutter|ui\/ux|qa|pm|ai|ml|machine learning|data science|mern|angular|vue|typescript|docker|kubernetes|aws|gcp|azure|mongodb|postgresql|mysql|redis|spring boot|django|fastapi|express|graphql|golang|rust|php|laravel|tensorflow|pytorch|langchain|ci\/cd|git)/gi;
  const foundSkills = [...new Set((text.match(skillRegex) || []).map(s => s.toLowerCase()))];

  if (foundSkills.length > 0) {
    foundSkills.forEach(s => orConditions.push({ skills: { $regex: s, $options: 'i' } }));
  }

  // Experience filter
  const expMatch = lower.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?/);
  const expFilter = expMatch ? { experience: { $gte: parseInt(expMatch[1]) } } : {};

  // Fresher / senior keywords
  if (lower.includes('fresher') || lower.includes('entry level')) expFilter.experience = { $lte: 1 };
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('architect')) {
    expFilter.experience = { $gte: 5 };
  }

  // Location filter
  const locationMatch = lower.match(/(pune|mumbai|bangalore|bengaluru|hyderabad|delhi|chennai|remote|kolkata)/);

  let query = { ...expFilter };
  if (recruiterFilter) query.recruiter = recruiterFilter;
  if (locationMatch) query.location = { $regex: locationMatch[1], $options: 'i' };
  if (orConditions.length > 0) query.$or = orConditions;

  // If no specific conditions, do a broad fetch with top ATS scores
  let candidates = await Candidate.find(query).sort({ atsScore: -1 }).limit(15).lean();

  // Fallback: try CandidateUser if Candidate table is empty
  if (candidates.length === 0) {
    let uQuery = {};
    if (locationMatch) uQuery.location = { $regex: locationMatch[1], $options: 'i' };
    if (foundSkills.length > 0) {
      uQuery.$or = foundSkills.map(s => ({ skills: { $regex: s, $options: 'i' } }));
    }
    const users = await CandidateUser.find(uQuery).limit(15).lean();
    candidates = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      skills: u.skills || [],
      experience: u.totalExperience || 0,
      location: u.location || '',
      atsScore: u.atsScore || 75,
      summary: u.summary || '',
      resumeText: u.resumeText || '',
      currentRole: u.jobRole || u.headline || 'Software Engineer'
    }));
  }

  return { collection: 'candidates', count: candidates.length, records: candidates };
}

async function retrieveJobs(text, recruiterFilter) {
  const lower = text.toLowerCase();
  const query = {};
  if (recruiterFilter) query.recruiter = recruiterFilter;

  // Status filter
  if (lower.includes('active') || lower.includes('open') || lower.includes('available')) {
    query.status = 'Published';
  } else if (lower.includes('closed')) {
    query.status = 'Closed';
  }

  // Skill extraction
  const skillRegex = /(react|node\.?js|python|java|devops|mern|angular|vue|ai|ml|data science|cloud|docker|kubernetes|aws|mongodb|postgresql|mysql|redis)/gi;
  const foundSkills = [...new Set((text.match(skillRegex) || []).map(s => s.toLowerCase()))];
  if (foundSkills.length > 0) {
    query.$or = foundSkills.map(s => ({
      $or: [
        { requiredSkills: { $regex: s, $options: 'i' } },
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } }
      ]
    }));
  }

  // Location filter
  const locationMatch = lower.match(/(pune|mumbai|bangalore|bengaluru|hyderabad|delhi|chennai|remote)/);
  if (locationMatch) query.location = { $regex: locationMatch[1], $options: 'i' };

  const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(15).lean();
  return { collection: 'jobs', count: jobs.length, records: jobs };
}

async function retrieveApplications(text, userFilter) {
  const lower = text.toLowerCase();
  const query = {};

  // Status filters
  if (lower.includes('pending') || lower.includes('applied')) query.status = 'Applied';
  else if (lower.includes('shortlisted')) query.status = 'Shortlisted';
  else if (lower.includes('rejected')) query.status = 'Rejected';
  else if (lower.includes('hired') || lower.includes('selected')) query.status = { $in: ['Selected', 'Hired'] };
  else if (lower.includes('under review')) query.status = 'Under Review';
  else if (lower.includes('interview scheduled')) query.status = 'Interview Scheduled';

  // User filter (for candidate self-queries)
  if (userFilter?.candidateId) query.candidateId = userFilter.candidateId;
  if (userFilter?.email) query.candidateEmail = userFilter.email;
  if (userFilter?.recruiterId) query.recruiterId = userFilter.recruiterId;

  const applications = await Application.find(query)
    .populate('job', 'title company location')
    .populate('candidate', 'name email')
    .sort({ appliedAt: -1 })
    .limit(20)
    .lean();

  const formatted = applications.map(a => ({
    id: a._id,
    candidateName: a.candidateName || a.candidate?.name || 'Unknown',
    jobTitle: a.job?.title || 'Unknown Job',
    companyName: a.job?.company || 'Unknown Company',
    location: a.job?.location || '',
    status: a.status,
    appliedAt: a.appliedAt,
    aiMatchScore: a.aiMatchScore
  }));

  return { collection: 'applications', count: formatted.length, records: formatted };
}

async function retrieveInterviews(text, userFilter) {
  const lower = text.toLowerCase();
  const query = {};

  // Status filters
  if (lower.includes('pending') || lower.includes('upcoming') || lower.includes('scheduled')) {
    query.status = 'Scheduled';
  } else if (lower.includes('cancelled')) {
    query.status = 'Cancelled';
  } else if (lower.includes('completed') || lower.includes('done')) {
    query.status = 'Completed';
  } else if (lower.includes('rescheduled')) {
    query.status = 'Rescheduled';
  }

  if (userFilter?.recruiterId) query.recruiterId = userFilter.recruiterId;
  if (userFilter?.email) query.candidateEmail = userFilter.email;
  if (userFilter?.candidateName) query.candidateName = { $regex: userFilter.candidateName, $options: 'i' };

  const interviews = await Interview.find(query)
    .sort({ interviewDate: 1 })
    .limit(20)
    .lean();

  return { collection: 'interviews', count: interviews.length, records: interviews };
}

async function retrieveCompanies(text) {
  const companies = await Company.find({}).limit(10).lean();
  return { collection: 'companies', count: companies.length, records: companies };
}

async function retrieveRecruiters(text) {
  const recruiters = await Recruiter.find({}).select('name email company designation').limit(10).lean();
  return { collection: 'recruiters', count: recruiters.length, records: recruiters };
}

// ─────────────────────────────────────────────────────────────
// CONTEXT FORMATTER — converts raw records into prompt-ready text
// ─────────────────────────────────────────────────────────────

function formatCandidateContext(records) {
  if (!records || records.length === 0) return 'No candidate records found.';
  return records.map((c, i) =>
    `[${i + 1}] ${c.name || 'Unknown'} | Role: ${c.currentRole || 'Engineer'} | Skills: ${(c.skills || []).join(', ') || 'N/A'} | Experience: ${c.experience || 0} yrs | ATS: ${c.atsScore || 0}% | Location: ${c.location || 'N/A'}${c.summary ? ` | Summary: ${c.summary.slice(0, 100)}` : ''}`
  ).join('\n');
}

function formatJobContext(records) {
  if (!records || records.length === 0) return 'No job records found.';
  return records.map((j, i) =>
    `[${i + 1}] ${j.title} @ ${j.company} | Location: ${j.location} | Type: ${j.employmentType} | Experience: ${j.experience} | Skills: ${(j.requiredSkills || []).join(', ') || 'N/A'} | Salary: ${j.salaryRange || j.salary || 'Competitive'} | Status: ${j.status}`
  ).join('\n');
}

function formatApplicationContext(records) {
  if (!records || records.length === 0) return 'No application records found.';
  return records.map((a, i) =>
    `[${i + 1}] ${a.candidateName} → ${a.jobTitle} @ ${a.companyName} | Status: ${a.status} | Applied: ${a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : 'N/A'} | AI Score: ${a.aiMatchScore || 0}%`
  ).join('\n');
}

function formatInterviewContext(records) {
  if (!records || records.length === 0) return 'No interview records found.';
  return records.map((iv, i) =>
    `[${i + 1}] ${iv.candidateName || 'Candidate'} | Date: ${iv.interviewDate || 'TBD'} | Time: ${iv.startTime || ''}-${iv.endTime || ''} | Mode: ${iv.mode} | Status: ${iv.status} | Decision: ${iv.finalDecision || 'Pending'}`
  ).join('\n');
}

function formatCompanyContext(records) {
  if (!records || records.length === 0) return 'No company records found.';
  return records.map((c, i) => `[${i + 1}] ${c.name} | Industry: ${c.industry || 'N/A'} | Location: ${c.location || 'N/A'}`).join('\n');
}

function formatRecruiterContext(records) {
  if (!records || records.length === 0) return 'No recruiter records found.';
  return records.map((r, i) => `[${i + 1}] ${r.name} | ${r.designation || 'Recruiter'} @ ${r.company || 'N/A'} | ${r.email}`).join('\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN RAG RETRIEVAL FUNCTION
// ─────────────────────────────────────────────────────────────

/**
 * Main entry point — retrieves all relevant company knowledge for a query.
 *
 * @param {string}  query        - Raw user query text
 * @param {Object}  [userFilter] - { recruiterId?, candidateId?, email? }
 * @param {string}  [cacheKey]   - Optional custom cache key prefix
 * @returns {Promise<{ hasData: boolean, context: string, raw: Object }>}
 */
async function retrieveCompanyKnowledge(query, userFilter = {}, cacheKey = null) {
  const key = cacheKey || `rag:${query.toLowerCase().trim().slice(0, 80)}`;
  const cached = await cacheService.get(key);
  if (cached) {
    console.log('[RAG] Cache Hit');
    return cached;
  }

  console.log('[RAG] Classifying collections for query:', query.slice(0, 80));
  const collections = classifyCollections(query);
  console.log('[RAG] Relevant collections:', collections);

  const results = {};
  const contextParts = [];
  let totalRecords = 0;

  // Run all relevant retrievers in parallel
  const tasks = [];
  if (collections.includes('candidates')) {
    tasks.push(
      retrieveCandidates(query, userFilter.recruiterId)
        .then(r => { results.candidates = r; })
    );
  }
  if (collections.includes('jobs')) {
    tasks.push(
      retrieveJobs(query, userFilter.recruiterId)
        .then(r => { results.jobs = r; })
    );
  }
  if (collections.includes('applications')) {
    tasks.push(
      retrieveApplications(query, userFilter)
        .then(r => { results.applications = r; })
    );
  }
  if (collections.includes('interviews')) {
    tasks.push(
      retrieveInterviews(query, userFilter)
        .then(r => { results.interviews = r; })
    );
  }
  if (collections.includes('companies')) {
    tasks.push(
      retrieveCompanies(query)
        .then(r => { results.companies = r; })
    );
  }
  if (collections.includes('recruiters')) {
    tasks.push(
      retrieveRecruiters(query)
        .then(r => { results.recruiters = r; })
    );
  }

  await Promise.all(tasks);

  // Build context string for Gemini
  if (results.candidates?.count > 0) {
    totalRecords += results.candidates.count;
    contextParts.push(`== CANDIDATE DATABASE (${results.candidates.count} records) ==\n${formatCandidateContext(results.candidates.records)}`);
  }
  if (results.jobs?.count > 0) {
    totalRecords += results.jobs.count;
    contextParts.push(`== JOB OPENINGS DATABASE (${results.jobs.count} records) ==\n${formatJobContext(results.jobs.records)}`);
  }
  if (results.applications?.count > 0) {
    totalRecords += results.applications.count;
    contextParts.push(`== APPLICATION DATABASE (${results.applications.count} records) ==\n${formatApplicationContext(results.applications.records)}`);
  }
  if (results.interviews?.count > 0) {
    totalRecords += results.interviews.count;
    contextParts.push(`== INTERVIEW DATABASE (${results.interviews.count} records) ==\n${formatInterviewContext(results.interviews.records)}`);
  }
  if (results.companies?.count > 0) {
    totalRecords += results.companies.count;
    contextParts.push(`== COMPANY DATABASE (${results.companies.count} records) ==\n${formatCompanyContext(results.companies.records)}`);
  }
  if (results.recruiters?.count > 0) {
    totalRecords += results.recruiters.count;
    contextParts.push(`== RECRUITER DATABASE (${results.recruiters.count} records) ==\n${formatRecruiterContext(results.recruiters.records)}`);
  }

  const hasData = totalRecords > 0;
  const context = hasData ? contextParts.join('\n\n') : '';

  console.log(`[RAG] Retrieved ${totalRecords} total records from ${collections.length} collection(s).`);

  const output = { hasData, context, raw: results, collections, totalRecords };
  await cacheService.set(key, output, 300); // 5-min TTL

  return output;
}

/**
 * Build the full Gemini prompt with RAG context injected.
 * Always prioritizes company data over Gemini general knowledge.
 */
function buildRAGPrompt(systemPrompt, query, ragContext, conversationHistory = []) {
  let prompt = systemPrompt + '\n\n';

  if (conversationHistory.length > 0) {
    prompt += '=== Conversation History ===\n';
    conversationHistory.forEach(m => {
      prompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
    });
    prompt += '============================\n\n';
  }

  prompt += `User Question: ${query}\n\n`;

  if (ragContext && ragContext.hasData) {
    prompt += `=== COMPANY KNOWLEDGE BASE (retrieved from live database) ===\n`;
    prompt += ragContext.context;
    prompt += `\n============================================================\n\n`;
    prompt += `INSTRUCTION: Answer the user's question using ONLY the company knowledge base data above. `;
    prompt += `Do NOT introduce yourself. Do NOT say "I am VoiceGenie". `;
    prompt += `Answer directly and specifically based on the retrieved records. `;
    prompt += `If asked about skills, list the actual skills from candidate records. `;
    prompt += `If asked about jobs, list the actual job titles and details. `;
    prompt += `If asked about interviews, list the actual interview records. `;
    prompt += `Format the answer in a clear, readable way with relevant details.`;
  } else {
    prompt += `INSTRUCTION: No company records found for this query. Answer from your general knowledge. `;
    prompt += `Do NOT introduce yourself. Answer the question directly and concisely.`;
  }

  return prompt;
}

/**
 * Generate a rich text fallback from RAG data when Gemini is unavailable.
 * Always returns an answer based on real DB records.
 */
function buildRAGFallback(query, ragContext) {
  if (!ragContext || !ragContext.hasData) return null;

  const lower = query.toLowerCase();
  const { raw } = ragContext;
  const parts = [];

  // Candidates
  if (raw.candidates?.count > 0) {
    const cands = raw.candidates.records;

    // Skill query — extract unique skills from all candidates
    if (lower.includes('skill') || lower.includes('know') || lower.includes('technical')) {
      const allSkills = new Set();
      cands.forEach(c => (c.skills || []).forEach(s => allSkills.add(s)));
      if (allSkills.size > 0) {
        const uniqueSkills = [...allSkills].sort();
        parts.push(`**Technical Skills Found Across ${cands.length} Candidate Profiles:**\n\n${uniqueSkills.map(s => `- ${s}`).join('\n')}`);
      }
    } else {
      // List candidates
      parts.push(`**${cands.length} Candidate(s) Found:**\n\n${cands.map((c, i) =>
        `${i + 1}. **${c.name}** | ${c.currentRole || 'Engineer'} | ${c.experience || 0} yrs | ATS: ${c.atsScore || 0}% | Skills: ${(c.skills || []).slice(0, 5).join(', ')}`
      ).join('\n')}`);
    }
  }

  // Jobs
  if (raw.jobs?.count > 0) {
    const jobs = raw.jobs.records;
    parts.push(`**${jobs.length} Job Opening(s) Found:**\n\n${jobs.map((j, i) =>
      `${i + 1}. **${j.title}** @ ${j.company} | ${j.location} | ${j.experience} | ${j.salaryRange || 'Competitive'} | Status: ${j.status}`
    ).join('\n')}`);
  }

  // Applications
  if (raw.applications?.count > 0) {
    const apps = raw.applications.records;
    parts.push(`**${apps.length} Application(s) Found:**\n\n${apps.map((a, i) =>
      `${i + 1}. **${a.candidateName}** → ${a.jobTitle} @ ${a.companyName} | Status: **${a.status}**`
    ).join('\n')}`);
  }

  // Interviews
  if (raw.interviews?.count > 0) {
    const ivs = raw.interviews.records;
    parts.push(`**${ivs.length} Interview(s) Found:**\n\n${ivs.map((iv, i) =>
      `${i + 1}. **${iv.candidateName || 'Candidate'}** | Date: ${iv.interviewDate || 'TBD'} | ${iv.startTime || ''}–${iv.endTime || ''} | Mode: ${iv.mode} | Status: **${iv.status}**`
    ).join('\n')}`);
  }

  // Companies
  if (raw.companies?.count > 0) {
    const companies = raw.companies.records;
    parts.push(`**${companies.length} Company Record(s):**\n\n${companies.map((c, i) =>
      `${i + 1}. **${c.name}** | Industry: ${c.industry || 'N/A'} | Location: ${c.location || 'N/A'}`
    ).join('\n')}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

module.exports = {
  retrieveCompanyKnowledge,
  buildRAGPrompt,
  buildRAGFallback,
  classifyCollections
};
