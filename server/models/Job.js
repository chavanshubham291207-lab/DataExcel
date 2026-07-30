const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Please add a company name']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  department: {
    type: String,
    required: [true, 'Please add a department']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  salaryRange: {
    type: String,
    default: ''
  },
  salary: {
    type: String,
    default: ''
  },
  employmentType: {
    type: String,
    required: [true, 'Please specify employment type'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
  },
  jobType: {
    type: String,
    default: 'Full-time'
  },
  experience: {
    type: String,
    required: [true, 'Please specify required experience (e.g. 2-5 years)']
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  education: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  responsibilities: {
    type: [String],
    default: []
  },
  benefits: {
    type: [String],
    default: []
  },
  deadline: {
    type: Date,
    required: [true, 'Please specify application deadline']
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Closed', 'Archived'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  job_vector: {
    type: [Number],
    default: []
  }
});

JobSchema.pre('save', async function(next) {
  if (this.isModified('title') || this.isModified('description') || !this.job_vector || this.job_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = `${this.title} ${this.company} ${this.department} ${this.description} ${(this.requiredSkills || []).join(' ')}`;
      this.job_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[Job Pre-save] Embedding generation failed:', err.message);
    }
  }
  next();
});

JobSchema.post('save', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:jobs:*');
  } catch (err) {
    console.warn('[Job Hook] Cache invalidate error:', err.message);
  }
});

module.exports = mongoose.model('Job', JobSchema);
