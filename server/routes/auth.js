const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');
const { protect } = require('../middleware/auth');
const { validateEmail } = require('../utils/emailValidator');

// Generate JWT Token with full payload
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      email: user.email,
      role: 'recruiter'
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_for_ai_recruiter_platform_12345',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new recruiter
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, companyName } = req.body;

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
    const userExists = await Recruiter.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({ success: false, error: 'Recruiter already exists with this email' });
    }

    const recruiter = await Recruiter.create({
      name,
      email: cleanEmail,
      password,
      companyName: companyName || '',
      role: 'recruiter'
    });

    const token = generateToken(recruiter);
    const userObj = {
      _id: recruiter._id,
      id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      role: 'recruiter',
      companyName: recruiter.companyName
    };

    res.status(201).json({
      success: true,
      token,
      role: 'recruiter',
      user: userObj,
      recruiter: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Login recruiter
// @route   POST /api/auth/login
// @access  Public
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
    const recruiter = await Recruiter.findOne({ email: cleanEmail }).select('+password');

    if (!recruiter) {
      return res.status(401).json({ success: false, error: 'Account not found. Please check your email or register a new account.' });
    }

    const isMatch = await recruiter.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(recruiter);
    const userObj = {
      _id: recruiter._id,
      id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      role: 'recruiter',
      companyName: recruiter.companyName,
      companyWebsite: recruiter.companyWebsite,
      notificationSettings: recruiter.notificationSettings
    };

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      recruiter: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get current logged in recruiter details
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiter.id);
    res.status(200).json({ success: true, data: recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update recruiter details
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      companyName: req.body.companyName,
      companyWebsite: req.body.companyWebsite,
      notificationSettings: req.body.notificationSettings
    };

    const recruiter = await Recruiter.findByIdAndUpdate(
      req.recruiter.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: recruiter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiter.id).select('+password');
    const { currentPassword, newPassword } = req.body;

    if (!(await recruiter.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    recruiter.password = newPassword;
    await recruiter.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete Account
// @route   DELETE /api/auth/delete-account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    await Recruiter.findByIdAndDelete(req.recruiter.id);
    // Note: In production you would cascade delete jobs/candidates/etc.
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Forgot password mockup
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  // Mock sending email
  const { email } = req.body;
  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }
    res.status(200).json({ success: true, message: 'Password reset link sent to email (Simulated)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Reset password mockup
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  res.status(200).json({ success: true, message: 'Password reset successful (Simulated)' });
});

module.exports = router;
