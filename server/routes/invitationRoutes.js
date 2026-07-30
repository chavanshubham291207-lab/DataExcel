const express = require('express');
const router = express.Router();
const { protectAny, restrictTo } = require('../middleware/protectAny');
const {
  sendInvitations,
  getCandidateInvitations,
  getRecruiterInvitations,
  respondToInvitation
} = require('../controllers/invitationController');

// All routes require authentication
router.use(protectAny);

// Recruiter Endpoints
router.post('/send', restrictTo('recruiter'), sendInvitations);
router.get('/recruiter', restrictTo('recruiter'), getRecruiterInvitations);

// Candidate Endpoints
router.get('/candidate', restrictTo('candidate'), getCandidateInvitations);
router.patch('/:id/respond', restrictTo('candidate'), respondToInvitation);

module.exports = router;
