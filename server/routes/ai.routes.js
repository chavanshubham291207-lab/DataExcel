const express = require('express');
const router = express.Router();
const { protectAny, restrictTo } = require('../middleware/protectAny');
const { aiRateLimiter, sanitizePromptInput } = require('../middleware/rateLimiter');
const { 
  handleChat, 
  handleGetConversation, 
  handleDeleteConversation,
  handleListConversations,
  handleNewChat,
  handleRenameConversation
} = require('../controllers/ai.controller');
const {
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

// POST /api/ai/chat (Supports optional or JWT protected calls)
router.post('/chat', (req, res, next) => {
  if (req.headers.authorization) {
    return protectAny(req, res, (err) => {
      return handleChat(req, res, next);
    });
  }
  return handleChat(req, res, next);
});

// Specific AI Feature Endpoints
router.post('/analyze-resume', protectAny, handleAnalyzeResume);
router.post('/ats-score', protectAny, handleATSScore);

// Recruiter Specific: Candidate Ranking
router.post('/rank-candidates', protectAny, restrictTo('recruiter'), handleRankCandidates);

// Candidate Specific: Job Recommendation
router.post('/job-recommendation', protectAny, restrictTo('candidate'), handleJobRecommendation);

// Interview Questions Generation
router.post('/interview', protectAny, handleInterviewGen);

// Conversation memory endpoints
router.get('/conversation', protectAny, handleGetConversation);
router.delete('/conversation', protectAny, handleDeleteConversation);
router.get('/conversations', protectAny, handleListConversations);
router.post('/conversations/new', protectAny, handleNewChat);
router.patch('/conversations/:conversationId/rename', protectAny, handleRenameConversation);

// History Endpoints
router.get('/history', protectAny, getHistory);
router.delete('/history', protectAny, clearHistory);

module.exports = router;
