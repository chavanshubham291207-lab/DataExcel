const ChatHistory = require('../models/ChatHistory');
const Candidate = require('../models/Candidate');
const CandidateUser = require('../models/CandidateUser');
const Job = require('../models/Job');
const { processAgentChat } = require('../services/agentRouter');
const { analyzeResume } = require('../services/resumeAnalyzer');
const { calculateATSScore } = require('../services/atsEngine');
const { rankCandidatesPool } = require('../services/rankingEngine');
const { recommendJobsForCandidate } = require('../services/jobRecommendationEngine');
const { generateInterviewQuestions } = require('../services/interviewGenerator');

/**
 * @desc    Main AI Agent Chat Endpoint (Auto Role Steering)
 * @route   POST /api/ai/chat
 * @access  Private (Recruiter or Candidate)
 */
exports.handleChat = async (req, res, next) => {
  try {
    const { message, activeJobId } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a valid message string.' });
    }

    const user = req.user;
    const role = req.role;

    // Process through Intelligent Agent Router
    const agentResult = await processAgentChat({
      user,
      role,
      message: message.trim(),
      activeJobId
    });

    // Save Chat History to MongoDB
    try {
      let history = await ChatHistory.findOne({
        userId: user._id,
        userModel: req.userModel
      });

      if (!history) {
        history = new ChatHistory({
          userId: user._id,
          userModel: req.userModel,
          role,
          sessionTitle: `${role === 'recruiter' ? 'Recruiter' : 'Candidate'} AI Chat`,
          messages: []
        });
      }

      history.messages.push({
        sender: 'user',
        content: message,
        intent: agentResult.intent || 'general',
        metadata: { activeJobId }
      });

      history.messages.push({
        sender: 'ai',
        content: agentResult.reply,
        intent: agentResult.intent || 'general',
        metadata: agentResult.metadata || {}
      });

      await history.save();
    } catch (dbErr) {
      console.error('[AIController] Non-blocking error saving chat history:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      role,
      reply: agentResult.reply,
      intent: agentResult.intent,
      metadata: agentResult.metadata
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Analyze Candidate Resume
 * @route   POST /api/ai/analyze-resume
 * @access  Private
 */
exports.handleAnalyzeResume = async (req, res, next) => {
  try {
    const resumeData = req.body.resumeData || req.body.text || req.user;
    const result = await analyzeResume(resumeData);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Calculate ATS Score
 * @route   POST /api/ai/ats-score
 * @access  Private
 */
exports.handleATSScore = async (req, res, next) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    const content = resumeContent || JSON.stringify(req.user);
    const result = await calculateATSScore(content, jobDescription || {});
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Rank Candidates Pool against Job Requisition
 * @route   POST /api/ai/rank-candidates
 * @access  Private (Recruiter)
 */
exports.handleRankCandidates = async (req, res, next) => {
  try {
    const { jobId, candidatesList } = req.body;

    let job = null;
    if (jobId) {
      job = await Job.findById(jobId);
    }
    if (!job) {
      job = req.body.job || { title: 'Software Developer', requiredSkills: ['React', 'Node.js'] };
    }

    let pool = candidatesList;
    if (!pool || !Array.isArray(pool) || pool.length === 0) {
      pool = await Candidate.find({}).limit(20).lean();
      if (pool.length === 0) {
        pool = await CandidateUser.find({}).limit(20).lean();
      }
    }

    const result = await rankCandidatesPool(job, pool);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Job Recommendation for Candidates
 * @route   POST /api/ai/job-recommendation
 * @access  Private (Candidate)
 */
exports.handleJobRecommendation = async (req, res, next) => {
  try {
    const candidateProfile = req.body.candidateProfile || req.user;
    const openJobs = await Job.find({ status: 'Active' }).limit(10).lean();
    const result = recommendJobsForCandidate(candidateProfile, openJobs);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate Interview Questions & Assessment
 * @route   POST /api/ai/interview
 * @access  Private
 */
exports.handleInterviewGen = async (req, res, next) => {
  try {
    const { jobTitle, candidateData, level } = req.body;
    const result = await generateInterviewQuestions(jobTitle, candidateData, level);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Chat History for Authenticated User
 * @route   GET /api/ai/history
 * @access  Private
 */
exports.getHistory = async (req, res, next) => {
  try {
    const history = await ChatHistory.findOne({
      userId: req.user._id,
      userModel: req.userModel
    });

    return res.status(200).json({
      success: true,
      messages: history ? history.messages : []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Clear Chat History for Authenticated User
 * @route   DELETE /api/ai/history
 * @access  Private
 */
exports.clearHistory = async (req, res, next) => {
  try {
    await ChatHistory.findOneAndDelete({
      userId: req.user._id,
      userModel: req.userModel
    });

    return res.status(200).json({
      success: true,
      message: 'AI chat history cleared successfully.'
    });
  } catch (err) {
    next(err);
  }
};
