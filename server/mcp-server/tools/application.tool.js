const Application = require('../../models/Application');
const Invitation = require('../../models/Invitation');

/**
 * MCP Tool: getApplications
 * Fetches candidate applications and invitations using existing Application and Invitation models.
 */
async function getApplications(params = {}) {
  try {
    const { userId, candidateId, candidateEmail, recruiterId, status } = params;
    const targetId = userId || candidateId;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (targetId) {
      query.$or = [
        { candidate: targetId },
        { candidateId: targetId }
      ];
    }

    if (candidateEmail) {
      query.candidateEmail = { $regex: candidateEmail, $options: 'i' };
    }

    console.log('\nSearch Query:');
    console.log(JSON.stringify(query, null, 2));

    // Fetch from Application collection
    console.log('MongoDB Query');
    const apps = await Application.find(query)
      .populate('job', 'title company location')
      .sort({ appliedAt: -1 })
      .limit(30)
      .lean();

    // Fetch from Invitation collection
    console.log('MongoDB Query');
    const invs = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    console.log('\nResult:');
    console.log(`Found ${apps.length + invs.length} applications/invitations.\n`);

    const formattedApps = apps.map(a => ({
      id: a._id.toString(),
      type: 'Application',
      candidateName: a.candidateName || 'Candidate',
      candidateEmail: a.candidateEmail || '',
      jobTitle: a.job ? a.job.title : 'Software Developer',
      companyName: a.job ? a.job.company : 'Tech Platform',
      status: a.status,
      appliedAt: a.appliedAt
    }));

    const formattedInvs = invs.map(i => ({
      id: i._id.toString(),
      type: 'Invitation',
      candidateName: i.candidateName,
      candidateEmail: i.candidateEmail,
      jobTitle: i.jobTitle,
      companyName: i.companyName,
      status: i.status,
      interviewDate: i.interviewDate,
      message: i.message,
      createdAt: i.createdAt
    }));

    const combined = [...formattedApps, ...formattedInvs];

    return {
      success: true,
      count: combined.length,
      applications: combined
    };
  } catch (error) {
    console.error('[MCP Application Tool] Error fetching applications:', error.message);
    return {
      success: false,
      error: error.message,
      applications: []
    };
  }
}

module.exports = { getApplications };
