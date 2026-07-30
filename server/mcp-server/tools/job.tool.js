const Job = require('../../models/Job');
const { generateEmbedding, searchVector } = require('../../services/embedding.service');

/**
 * MCP Tool: searchJobs
 * Upgraded to use MongoDB Atlas Vector Search for semantic AI matching.
 */
async function searchJobs(params = {}) {
  try {
    const { skills, location, keyword, employmentType, useVectorSearch = true } = params;
    const filter = {};

    if (employmentType) {
      filter.employmentType = employmentType;
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const searchQueryText = keyword || skills || '';
    
    if (useVectorSearch && searchQueryText) {
      console.log('Vector Search Used');
      const queryVector = await generateEmbedding(searchQueryText);
      
      const jobs = await searchVector(Job, 'job_vector', queryVector, filter, 20);
      if (jobs && jobs.length > 0) {
        return {
          success: true,
          totalCount: jobs.length,
          jobs: jobs.map(j => ({
            id: j._id.toString(),
            title: j.title,
            company: j.company,
            location: j.location,
            employmentType: j.employmentType,
            experience: j.experience,
            salaryRange: j.salaryRange || 'Competitive',
            requiredSkills: j.requiredSkills,
            status: j.status,
            deadline: j.deadline,
            score: j.score || 0.85
          }))
        };
      }
    }

    // Keyword Search Fallback
    console.log('MongoDB Query');
    const query = { ...filter };
    const conditions = [];

    if (keyword) {
      const kwRegex = new RegExp(keyword, 'i');
      conditions.push(
        { title: kwRegex },
        { company: kwRegex },
        { department: kwRegex },
        { description: kwRegex },
        { requiredSkills: kwRegex }
      );
    }

    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim()).filter(Boolean);

      if (skillsArray.length > 0) {
        const skillsRegexes = skillsArray.map(s => new RegExp(s, 'i'));
        conditions.push({ requiredSkills: { $in: skillsRegexes } });
      }
    }

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    console.log('\nFallback Keyword Search Query:');
    console.log(JSON.stringify(query, null, 2));

    const jobs = await Job.find(query)
      .limit(20)
      .sort({ createdAt: -1 })
      .lean();

    console.log('\nResult:');
    console.log(`Found ${jobs.length} jobs.\n`);

    return {
      success: true,
      totalCount: jobs.length,
      jobs: jobs.map(j => ({
        id: j._id.toString(),
        title: j.title,
        company: j.company,
        location: j.location,
        employmentType: j.employmentType,
        experience: j.experience,
        salaryRange: j.salaryRange || 'Competitive',
        requiredSkills: j.requiredSkills,
        status: j.status,
        deadline: j.deadline
      }))
    };
  } catch (error) {
    console.error('[MCP Job Tool] Error searching jobs:', error.message);
    return {
      success: false,
      error: error.message,
      jobs: []
    };
  }
}

module.exports = { searchJobs };
