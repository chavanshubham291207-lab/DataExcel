const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const Candidate = require('../models/Candidate');
const CandidateUser = require('../models/CandidateUser');
const Job = require('../models/Job');

/**
 * Creates in-app Recruitment Invitations in MongoDB for selected candidates.
 */
async function sendRecruitmentInvitations({ recruiter, candidatesList = [], jobId = null, customMessage = '' }) {
  if (!candidatesList || candidatesList.length === 0) {
    return {
      success: false,
      reply: '❌ No candidate records found in conversation context to send invitations to.'
    };
  }

  let job = null;
  if (jobId) {
    job = await Job.findById(jobId);
  }
  if (!job) {
    job = await Job.findOne({ recruiter: recruiter._id }) || { _id: null, title: 'Senior Software Role', company: recruiter.companyName || 'Apex AI Systems' };
  }

  const createdInvitations = [];

  for (const cand of candidatesList) {
    // Find candidate account
    let candUser = null;
    if (cand._id) {
      candUser = await CandidateUser.findById(cand._id);
    }
    if (!candUser && cand.email) {
      candUser = await CandidateUser.findOne({ email: cand.email });
    }

    const invitation = await Invitation.create({
      recruiter: recruiter._id,
      candidateUser: candUser ? candUser._id : null,
      candidate: cand._id && !candUser ? cand._id : null,
      candidateName: cand.name || 'Candidate',
      candidateEmail: cand.email || '',
      job: job._id,
      jobTitle: job.title || 'Senior Software Developer',
      companyName: recruiter.companyName || job.company || 'Apex AI Systems',
      status: 'Pending',
      message: customMessage || `You have been selected by ${recruiter.name || 'Hiring Manager'} at ${recruiter.companyName || 'Apex AI Systems'} for the ${job.title || 'Software'} position.`
    });

    createdInvitations.push(invitation);

    // Create In-App Notification record
    try {
      await Notification.create({
        recruiter: recruiter._id,
        title: `Invitation Sent: ${cand.name}`,
        message: `In-app recruitment invitation created for ${cand.name} (${job.title}). Status set to Pending.`,
        type: 'success'
      });
    } catch {}
  }

  const count = createdInvitations.length;
  const reply = `✅ **${count} recruitment invitations created successfully.**\n\nCandidates will now see the pending invitation directly inside their **My Invitations** dashboard tab.`;

  return {
    success: true,
    count,
    reply,
    invitations: createdInvitations
  };
}

/**
 * Shortlists candidate records directly in MongoDB.
 */
async function shortlistCandidates({ recruiter, candidatesList = [] }) {
  if (!candidatesList || candidatesList.length === 0) {
    return {
      success: false,
      reply: '❌ No candidate records found in context to shortlist.'
    };
  }

  for (const cand of candidatesList) {
    if (cand._id) {
      await Candidate.findByIdAndUpdate(cand._id, { status: 'Shortlisted' });
    }
  }

  return {
    success: true,
    reply: `✅ **${candidatesList.length} candidates shortlisted successfully.** Status updated to "Shortlisted" in MongoDB.`
  };
}

/**
 * Rejects candidate records directly in MongoDB.
 */
async function rejectCandidates({ recruiter, candidatesList = [] }) {
  if (!candidatesList || candidatesList.length === 0) {
    return {
      success: false,
      reply: '❌ No candidate records found in context to reject.'
    };
  }

  for (const cand of candidatesList) {
    if (cand._id) {
      await Candidate.findByIdAndUpdate(cand._id, { status: 'Rejected' });
    }
  }

  return {
    success: true,
    reply: `✅ **${candidatesList.length} candidate statuses updated to Rejected in MongoDB.**`
  };
}

module.exports = {
  sendRecruitmentInvitations,
  shortlistCandidates,
  rejectCandidates
};
