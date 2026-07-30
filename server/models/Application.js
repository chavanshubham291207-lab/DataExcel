const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CandidateUser'
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter'
  },
  // For self-applied candidates (CandidateUser model)
  candidateEmail: { type: String, default: '' },
  candidateName: { type: String, default: '' },
  appliedDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],
  aiMatchScore: {
    type: Number,
    default: 0
  },
  aiAnalysis: {
    skillScore: Number,
    experienceScore: Number,
    educationScore: Number,
    missingSkills: [String],
    relevanceExplanation: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

ApplicationSchema.post('save', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:applications:*');
  } catch (err) {
    console.warn('[Application Hook] Cache invalidate error:', err.message);
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
