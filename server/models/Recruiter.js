const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RecruiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'recruiter'
  },
  companyName: {
    type: String,
    default: ''
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  designation: {
    type: String,
    default: 'HR Manager'
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  notificationSettings: {
    newApplications: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    jobExpiration: { type: Boolean, default: true },
    offerStatus: { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
RecruiterSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
RecruiterSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Recruiter', RecruiterSchema);
