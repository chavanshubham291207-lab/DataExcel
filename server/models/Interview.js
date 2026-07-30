const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  // ── Legacy fields (kept for backward compatibility) ──
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter'
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  panelists: {
    type: [String],
    default: []
  },
  dateTime: {
    type: Date
  },
  feedback: {
    type: String,
    default: ''
  },
  finalDecision: {
    type: String,
    enum: ['Pending', 'Hire', 'Reject'],
    default: 'Pending'
  },

  // ── New Application-based scheduling fields ──
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    default: null
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  candidateEmail: {
    type: String,
    default: ''
  },
  candidateName: {
    type: String,
    default: ''
  },
  interviewDate: {
    type: String,  // ISO date string: "2025-08-15"
    default: ''
  },
  startTime: {
    type: String,  // "10:00"
    default: ''
  },
  endTime: {
    type: String,  // "11:00"
    default: ''
  },
  mode: {
    type: String,
    enum: ['Video Call', 'Phone Call', 'In-Person', 'Technical Test', 'Panel Interview', 'Online', 'Offline'],
    default: 'Video Call'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },

  // ── Shared status ──
  status: {
    type: String,
    enum: ['Scheduled', 'Rescheduled', 'Cancelled', 'Completed'],
    default: 'Scheduled'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);
