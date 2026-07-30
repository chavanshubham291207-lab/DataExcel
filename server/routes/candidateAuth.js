const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const CandidateUser = require('../models/CandidateUser');
const { protectCandidate } = require('../middleware/candidateAuth');
const { validateEmail } = require('../utils/emailValidator');

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      userId: user._id,
      email: user.email,
      role: 'candidate'
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345',
    { expiresIn: '30d' }
  );

// Multer for resume + photo
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  }
});

const resumeUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF/DOCX/DOC allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const photoUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// @route POST /api/candidate-auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, jobRole, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
  }

  // Email validation: format, disposable domains, fake placeholders
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return res.status(400).json({ success: false, error: emailCheck.message });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const exists = await CandidateUser.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ success: false, error: 'Email already registered' });

    const candidate = await CandidateUser.create({
      name,
      email: cleanEmail,
      password,
      jobRole: jobRole || '',
      phone: phone || '',
      role: 'candidate'
    });

    const profile = candidate.toObject();
    delete profile.password;
    profile.role = 'candidate';
    profile._id = candidate._id;

    const token = generateToken(candidate);

    res.status(201).json({
      success: true,
      token,
      role: 'candidate',
      user: profile,
      candidateUser: profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate-auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide email and password' });
  }

  // Email format validation on login
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return res.status(400).json({ success: false, error: emailCheck.message });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const candidate = await CandidateUser.findOne({ email: cleanEmail }).select('+password');
    if (!candidate) return res.status(401).json({ success: false, error: 'Account not found. Please check your email or create a new account.' });

    const isMatch = await candidate.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });

    const profile = candidate.toObject();
    delete profile.password;
    profile.role = 'candidate';
    profile._id = candidate._id;

    const token = generateToken(candidate);

    res.status(200).json({
      success: true,
      token,
      role: 'candidate',
      user: profile,
      candidateUser: profile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate-auth/me
router.get('/me', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id);
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route PUT /api/candidate-auth/profile
router.put('/profile', protectCandidate, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'location', 'headline', 'summary', 'jobRole',
      'skills', 'languages', 'education', 'workExperience', 'projects',
      'certifications', 'linkedin', 'github', 'portfolio',
      'expectedCTC', 'preferredLocation', 'noticePeriod', 'totalExperience',
      'notificationPrefs'
    ];
    const update = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const candidate = await CandidateUser.findByIdAndUpdate(
      req.candidateUser._id,
      update,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route PUT /api/candidate-auth/change-password
router.put('/change-password', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await candidate.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    candidate.password = newPassword;
    await candidate.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route DELETE /api/candidate-auth/delete-account
router.delete('/delete-account', protectCandidate, async (req, res) => {
  try {
    await CandidateUser.findByIdAndDelete(req.candidateUser._id);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate-auth/upload-resume
router.post('/upload-resume', protectCandidate, resumeUpload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const resumePath = `/uploads/${req.file.filename}`;
    await CandidateUser.findByIdAndUpdate(req.candidateUser._id, { resumePath });
    res.status(200).json({ success: true, resumePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate-auth/upload-photo
router.post('/upload-photo', protectCandidate, photoUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const profilePhoto = `/uploads/${req.file.filename}`;
    await CandidateUser.findByIdAndUpdate(req.candidateUser._id, { profilePhoto });
    res.status(200).json({ success: true, profilePhoto });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
