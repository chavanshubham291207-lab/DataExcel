const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  writer: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CandidateSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add candidate name'],
    trim: true
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  education: {
    type: [String],
    default: []
  },
  projects: {
    type: [String],
    default: []
  },
  certifications: {
    type: [String],
    default: []
  },
  summary: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    default: ''
  },
  atsScore: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  internalRatings: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: [NoteSchema],
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  candidate_vector: {
    type: [Number],
    default: []
  },
  resume_vector: {
    type: [Number],
    default: []
  },
  resumeText: {
    type: String,
    default: ''
  }
});

CandidateSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isModified('skills') || this.isModified('summary') || !this.candidate_vector || this.candidate_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = `${this.name} ${(this.skills || []).join(' ')} ${this.summary || ''} ${(this.tags || []).join(' ')}`;
      this.candidate_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[Candidate Pre-save] Candidate embedding generation failed:', err.message);
    }
  }

  if (this.isModified('resumePath') || this.isModified('summary') || this.isModified('resumeText') || !this.resume_vector || this.resume_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = this.resumeText || this.summary || `Resume of candidate ${this.name} with skills: ${(this.skills || []).join(', ')}`;
      this.resume_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[Candidate Pre-save] Resume embedding generation failed:', err.message);
    }
  }
  next();
});

CandidateSchema.post('save', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:candidates:*');
  } catch (err) {
    console.warn('[Candidate Hook] Cache invalidate error:', err.message);
  }
});

CandidateSchema.post('findOneAndUpdate', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:candidates:*');
  } catch (err) {
    console.warn('[Candidate Hook] Cache invalidate error:', err.message);
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
