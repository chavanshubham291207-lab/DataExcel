const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Please specify an industry']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  website: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  company_vector: {
    type: [Number],
    default: []
  }
});

CompanySchema.pre('save', async function(next) {
  if (this.isModified('companyName') || this.isModified('description') || !this.company_vector || this.company_vector.length === 0) {
    try {
      const { generateEmbedding } = require('../services/embedding.service');
      const textToEmbed = `${this.companyName} ${this.industry} ${this.location} ${this.description}`;
      this.company_vector = await generateEmbedding(textToEmbed);
    } catch (err) {
      console.warn('[Company Pre-save] Company embedding generation failed:', err.message);
    }
  }
  next();
});

module.exports = mongoose.model('Company', CompanySchema);
