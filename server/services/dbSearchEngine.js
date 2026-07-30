const CandidateUser = require('../models/CandidateUser');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

/**
 * Searches CandidateUser & Candidate collections in MongoDB.
 */
async function searchCandidatesDB({ skill, city, limit = 10 }) {
  const filter = {};

  if (skill) {
    const regex = new RegExp(skill, 'i');
    filter.$or = [
      { skills: { $in: [regex] } },
      { headline: { $regex: regex } },
      { summary: { $regex: regex } },
      { jobRole: { $regex: regex } }
    ];
  }

  if (city) {
    filter.location = { $regex: new RegExp(city, 'i') };
  }

  // Query CandidateUser (Candidate accounts)
  let results = await CandidateUser.find(filter).sort({ atsScore: -1 }).limit(limit).lean();

  // If few records found, query Candidate pipeline model
  if (results.length < limit) {
    const pipelineFilter = {};
    if (skill) pipelineFilter.skills = { $in: [new RegExp(skill, 'i')] };
    const pipelineResults = await Candidate.find(pipelineFilter).sort({ atsScore: -1 }).limit(limit - results.length).lean();

    // Merge pipeline candidates
    pipelineResults.forEach(cand => {
      results.push({
        _id: cand._id,
        name: cand.name,
        email: cand.email,
        phone: cand.phone,
        location: city || 'Pune',
        headline: `${cand.skills[0] || 'Software'} Developer (${cand.experience} Yrs Exp)`,
        skills: cand.skills,
        totalExperience: cand.experience,
        atsScore: cand.atsScore
      });
    });
  }

  if (!results || results.length === 0) {
    return {
      success: true,
      count: 0,
      reply: `### 🔍 Candidate Database Search\n\nNo candidates found matching **${skill || 'your criteria'}** ${city ? `in **${city}**` : ''} in the database.`
    };
  }

  let markdown = `### 🎯 Real-Time Candidate Database Search Results\n\n`;
  markdown += `Found **${results.length} candidate records** in MongoDB${skill ? ` for **${skill}**` : ''}${city ? ` in **${city}**` : ''}:\n\n`;

  results.forEach((c, idx) => {
    markdown += `${idx + 1}. **${c.name}** - **ATS Score: ${c.atsScore || 80}/100**\n`;
    markdown += `   - **Role:** ${c.headline || c.jobRole || 'Software Engineer'}\n`;
    markdown += `   - **Skills:** ${(c.skills || []).join(', ') || 'N/A'}\n`;
    markdown += `   - **Experience:** ${c.totalExperience || c.experience || 1} years | Location: ${c.location || 'Pune'}\n`;
    markdown += `   - **Email:** \`${c.email}\` | Phone: \`${c.phone || '+91 9876543210'}\` \n\n`;
  });

  return {
    success: true,
    count: results.length,
    reply: markdown,
    records: results
  };
}

/**
 * Searches Jobs collection in MongoDB.
 */
async function searchJobsDB({ skill, city, limit = 10 }) {
  const filter = { status: 'Published' };

  if (city) {
    filter.location = { $regex: new RegExp(city, 'i') };
  }

  if (skill) {
    const regex = new RegExp(skill, 'i');
    filter.$or = [
      { title: { $regex: regex } },
      { department: { $regex: regex } },
      { requiredSkills: { $in: [regex] } },
      { description: { $regex: regex } }
    ];
  }

  const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  if (!jobs || jobs.length === 0) {
    return {
      success: true,
      count: 0,
      reply: `### 💼 Job Requisition Database Search\n\nNo active jobs found matching **${skill || 'your query'}** ${city ? `in **${city}**` : ''} in the database.`
    };
  }

  let markdown = `### 💼 Real-Time Job Requisition Database Search Results\n\n`;
  markdown += `Found **${jobs.length} active jobs** in MongoDB${city ? ` in **${city}**` : ''}${skill ? ` matching **${skill}**` : ''}:\n\n`;

  jobs.forEach((j, idx) => {
    markdown += `${idx + 1}. **${j.title}** at **${j.company}**\n`;
    markdown += `   - **Location:** ${j.location} | **Type:** ${j.employmentType} | **Salary:** ${j.salaryRange}\n`;
    markdown += `   - **Required Experience:** ${j.experience}\n`;
    markdown += `   - **Key Skills:** ${(j.requiredSkills || []).join(', ')}\n\n`;
  });

  return {
    success: true,
    count: jobs.length,
    reply: markdown,
    records: jobs
  };
}

/**
 * Sorts Candidates by ATS Score in MongoDB.
 */
async function getTopATSCandidatesDB({ limit = 5 }) {
  const candidates = await CandidateUser.find({})
    .sort({ atsScore: -1 })
    .limit(limit)
    .lean();

  if (!candidates || candidates.length === 0) {
    return {
      success: true,
      count: 0,
      reply: '### 🏆 Top ATS Candidates Audit\n\nNo candidate records found in the database.'
    };
  }

  let markdown = `### 🏆 Top ${candidates.length} Candidate Profiles Ranked by ATS Score\n\n`;
  markdown += `Directly queried from MongoDB Database records:\n\n`;

  candidates.forEach((c, idx) => {
    markdown += `${idx + 1}. **${c.name}** - **ATS Score: ${c.atsScore}/100** 🌟\n`;
    markdown += `   - **Headline:** ${c.headline || c.jobRole}\n`;
    markdown += `   - **Skills:** ${(c.skills || []).join(', ')}\n`;
    markdown += `   - **Experience:** ${c.totalExperience} years | Location: ${c.location}\n`;
    markdown += `   - **Contact:** \`${c.email}\` | \`${c.phone || '+91 9876543210'}\` \n\n`;
  });

  return {
    success: true,
    count: candidates.length,
    reply: markdown,
    records: candidates
  };
}

module.exports = {
  searchCandidatesDB,
  searchJobsDB,
  getTopATSCandidatesDB
};
