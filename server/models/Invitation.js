const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true
  },
  candidateUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CandidateUser',
    default: null
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    default: null
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    default: ''
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  jobTitle: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  interviewDate: {
    type: Date,
    default: null
  },
  message: {
    type: String,
    default: 'You have been invited to apply and interview for a software role by the hiring manager.'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

InvitationSchema.post('save', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:applications:*');
  } catch (err) {
    console.warn('[Invitation Hook] Cache invalidate error:', err.message);
  }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
