const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EducationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  institution: { type: String, default: '' },
  field: { type: String, default: '' },
  startYear: { type: String, default: '' },
  endYear: { type: String, default: '' },
  grade: { type: String, default: '' }
});

const ExperienceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  description: { type: String, default: '' }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  techStack: { type: [String], default: [] },
  link: { type: String, default: '' }
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  year: { type: String, default: '' },
  credentialUrl: { type: String, default: '' }
});

const CandidateUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false
  },
  role: {
    type: String,
    default: 'candidate'
  },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  jobRole: { type: String, default: '' },
  skills: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  education: { type: [EducationSchema], default: [] },
  workExperience: { type: [ExperienceSchema], default: [] },
  projects: { type: [ProjectSchema], default: [] },
  certifications: { type: [CertificationSchema], default: [] },
  resumePath: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  expectedCTC: { type: String, default: '' },
  preferredLocation: { type: String, default: '' },
  noticePeriod: { type: String, default: '' },
  totalExperience: { type: Number, default: 0 },
  atsScore: { type: Number, default: 0 },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  notificationPrefs: {
    jobAlerts: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    recruiterMessages: { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now },
  candidate_vector: { type: [Number], default: [] },
  resume_vector: { type: [Number], default: [] },
  resumeText: { type: String, default: '' }
});

// Virtual: profile completeness %
CandidateUserSchema.virtual('profileCompleteness').get(function () {
  let score = 0;
  const checks = [
    this.name, this.email, this.phone, this.location, this.headline,
    this.summary, this.jobRole, this.skills.length > 0,
    this.education.length > 0, this.workExperience.length > 0,
    this.resumePath, this.linkedin
  ];
  checks.forEach(c => { if (c) score++; });
  return Math.round((score / checks.length) * 100);
});

CandidateUserSchema.set('toJSON', { virtuals: true });
CandidateUserSchema.set('toObject', { virtuals: true });

// Encrypt password and calculate embeddings
CandidateUserSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isModified('skills') || this.isModified('summary') || !this.candidate_vector || this.candidate_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = `${this.name} ${(this.skills || []).join(' ')} ${this.summary || ''} ${this.jobRole || ''}`;
      this.candidate_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[CandidateUser Pre-save] Candidate embedding generation failed:', err.message);
    }
  }

  if (this.isModified('resumePath') || this.isModified('summary') || this.isModified('resumeText') || !this.resume_vector || this.resume_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = this.resumeText || this.summary || `Resume profile of candidate ${this.name} with skills: ${(this.skills || []).join(', ')}`;
      this.resume_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[CandidateUser Pre-save] Resume embedding generation failed:', err.message);
    }
  }

  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
CandidateUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

CandidateUserSchema.post('save', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:candidates:*');
  } catch (err) {
    console.warn('[CandidateUser Hook] Cache invalidate error:', err.message);
  }
});

CandidateUserSchema.post('findOneAndUpdate', async function() {
  try {
    const cacheService = require('../services/cache.service');
    await cacheService.invalidatePattern('search:candidates:*');
  } catch (err) {
    console.warn('[CandidateUser Hook] Cache invalidate error:', err.message);
  }
});

module.exports = mongoose.model('CandidateUser', CandidateUserSchema);
