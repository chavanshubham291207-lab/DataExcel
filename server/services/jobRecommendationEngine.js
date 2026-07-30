const { calculateCandidateMatch } = require('./rankingEngine');

/**
 * Computes job recommendations for a candidate profile against available database jobs.
 */
function recommendJobsForCandidate(candidateProfile, availableJobs = []) {
  if (!availableJobs || availableJobs.length === 0) {
    return {
      success: true,
      recommendations: [],
      message: 'No active job requisitions available in database for matching.'
    };
  }

  const matches = availableJobs.map(job => {
    const matchData = calculateCandidateMatch(candidateProfile, job);
    return {
      jobId: job._id || job.id,
      jobTitle: job.title || 'Software Role',
      company: job.company || job.companyName || 'Apex AI Systems',
      location: job.location || 'Remote',
      type: job.type || job.jobType || 'Full-time',
      salary: job.salary || job.salaryRange || 'Competitive',
      matchScore: matchData.matchScore,
      matchedSkills: matchData.matchedSkills,
      missingSkills: matchData.missingSkills,
      recommendationReason: matchData.matchScore > 80
        ? 'High match! Your core skills and experience closely align with this role.'
        : matchData.matchScore > 65
          ? 'Good match. Acquiring key missing skills can significantly boost your interview chances.'
          : 'Potential match based on background experience.'
    };
  });

  // Sort descending by match score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  const topJobs = matches.slice(0, 5);

  // Skill Gap Synthesis
  const allMissingSkills = {};
  topJobs.forEach(job => {
    (job.missingSkills || []).forEach(skill => {
      allMissingSkills[skill] = (allMissingSkills[skill] || 0) + 1;
    });
  });

  const sortedSkillGaps = Object.entries(allMissingSkills)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  return {
    success: true,
    candidateName: candidateProfile.name || 'Candidate',
    totalJobsAnalyzed: availableJobs.length,
    recommendations: topJobs,
    topSkillGapsToLearn: sortedSkillGaps.slice(0, 5)
  };
}

module.exports = { recommendJobsForCandidate };
