const express = require('express');
const router = express.Router();
const { protectAny, restrictTo } = require('../middleware/protectAny');
const { aiRateLimiter, sanitizePromptInput } = require('../middleware/rateLimiter');
const {
  handleChat,
  handleAnalyzeResume,
  handleATSScore,
  handleRankCandidates,
  handleJobRecommendation,
  handleInterviewGen,
  getHistory,
  clearHistory
} = require('../controllers/aiController');

// All AI endpoints use rate limiting and prompt injection protection
router.use(aiRateLimiter);
router.use(sanitizePromptInput);

// Core AI Chat Endpoint (Accessible to both Recruiter & Candidate)
router.post('/chat', protectAny, handleChat);

// Specific AI Feature Endpoints
router.post('/analyze-resume', protectAny, handleAnalyzeResume);
router.post('/ats-score', protectAny, handleATSScore);

// Recruiter Specific: Candidate Ranking
router.post('/rank-candidates', protectAny, restrictTo('recruiter'), handleRankCandidates);

// Candidate Specific: Job Recommendation
router.post('/job-recommendation', protectAny, restrictTo('candidate'), handleJobRecommendation);

// Interview Questions Generation
router.post('/interview', protectAny, handleInterviewGen);

// History Endpoints
router.get('/history', protectAny, getHistory);
router.delete('/history', protectAny, clearHistory);

module.exports = router;
