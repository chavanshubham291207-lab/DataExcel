const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { protectCandidate } = require('../middleware/candidateAuth');

// @route GET /api/candidate/interviews
// @desc  Get interviews where candidateEmail matches logged-in candidate
router.get('/', protectCandidate, async (req, res) => {
  try {
    const interviews = await Interview.find({
      candidateEmail: req.candidateUser.email
    }).sort('-scheduledAt');

    res.status(200).json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
