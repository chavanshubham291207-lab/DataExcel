const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middlewares
const { protect } = require('../middleware/auth');
const { protectCandidate } = require('../middleware/candidateAuth');

// Models
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Interview = require('../models/Interview');
const Job = require('../models/Job');

// Services
const { askGemini } = require('../services/gemini.service');
const cacheService = require('../services/cache.service');

// 1. GET /api/ats/applications (protect - recruiter)
router.get('/applications', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = { recruiterId: req.recruiter.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      let jobIds = [];
      try {
        const matchingJobs = await Job.find({ title: searchRegex, recruiter: req.recruiter.id }).select('_id');
        jobIds = matchingJobs.map(j => j._id);
      } catch (e) {
        // Job model might not be accessible or query fails, ignore job search gracefully
      }
      
      query.$or = [
        { candidateName: searchRegex },
        { candidateEmail: searchRegex }
      ];
      if (jobIds.length > 0) {
        query.$or.push({ jobId: { $in: jobIds } });
      }
    }

    const [applications, totalCount, statusCountsAggregation] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title company location requiredSkills status')
        .populate('candidateId', 'name email phone skills totalExperience profilePhoto education workExperience location headline')
        .sort({ appliedAt: -1, appliedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(query),
      Application.aggregate([
        { $match: { recruiterId: new mongoose.Types.ObjectId(req.recruiter.id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = {};
    const allStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Hired', 'Rejected'];
    allStatuses.forEach(s => { statusCounts[s] = 0; });
    statusCountsAggregation.forEach(item => {
      if (item._id) statusCounts[item._id] = item.count;
    });

    res.json({
      success: true,
      data: applications,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      statusCounts
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 2. PATCH /api/ats/applications/:id/accept (protect - recruiter)
router.patch('/applications/:id/accept', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    if (application.recruiterId.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    application.status = 'Shortlisted';
    if (!application.statusHistory) application.statusHistory = [];
    application.statusHistory.push({
      status: 'Shortlisted',
      changedAt: new Date(),
      note: 'Accepted by recruiter'
    });
    
    await application.save();

    await Notification.create({
      recruiter: req.recruiter.id,
      recipientId: application.candidateId,
      recipientEmail: application.candidateEmail,
      title: 'Application Accepted',
      message: 'Your application has been shortlisted for the next round.',
      type: 'success',
      read: false
    });

    if (req.io) {
      req.io.emit('application:updated', { id: application._id });
    }
    
    if (cacheService && typeof cacheService.invalidatePattern === 'function') {
      await cacheService.invalidatePattern('search:applications:*');
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 3. PATCH /api/ats/applications/:id/reject (protect - recruiter)
router.patch('/applications/:id/reject', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    if (application.recruiterId.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    application.status = 'Rejected';
    if (!application.statusHistory) application.statusHistory = [];
    application.statusHistory.push({
      status: 'Rejected',
      changedAt: new Date(),
      note: 'Rejected by recruiter'
    });
    
    await application.save();

    await Notification.create({
      recruiter: req.recruiter.id,
      recipientId: application.candidateId,
      recipientEmail: application.candidateEmail,
      title: 'Application Rejected',
      message: 'Unfortunately, your application was not selected for further processing.',
      type: 'error',
      read: false
    });

    if (req.io) {
      req.io.emit('application:updated', { id: application._id });
    }
    
    if (cacheService && typeof cacheService.invalidatePattern === 'function') {
      await cacheService.invalidatePattern('search:applications:*');
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 4. POST /api/ats/applications/:id/schedule-interview (protect - recruiter)
router.post('/applications/:id/schedule-interview', protect, async (req, res) => {
  try {
    const { interviewDate, startTime, endTime, mode, meetingLink, notes } = req.body;
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    if (application.recruiterId.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const interview = await Interview.create({
      applicationId: application._id,
      recruiterId: req.recruiter.id,
      recruiter: req.recruiter.id,
      jobId: application.jobId,
      job: application.jobId,
      candidate: application.candidateId,
      candidateEmail: application.candidateEmail,
      candidateName: application.candidateName,
      interviewDate,
      startTime,
      endTime,
      mode,
      meetingLink,
      notes,
      status: 'Scheduled'
    });

    application.status = 'Interview Scheduled';
    if (!application.statusHistory) application.statusHistory = [];
    application.statusHistory.push({
      status: 'Interview Scheduled',
      changedAt: new Date(),
      note: 'Interview scheduled by recruiter'
    });
    
    await application.save();

    await Notification.create({
      recruiter: req.recruiter.id,
      recipientId: application.candidateId,
      recipientEmail: application.candidateEmail,
      title: 'Interview Scheduled',
      message: `An interview has been scheduled for ${new Date(interviewDate).toLocaleDateString()} at ${startTime}.`,
      type: 'success',
      read: false
    });

    if (req.io) {
      req.io.emit('application:updated', { id: application._id });
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 5. POST /api/ats/applications/:id/ai-analysis (protect - recruiter)
router.post('/applications/:id/ai-analysis', protect, async (req, res) => {
  try {
    const cacheKey = `ats:ai-analysis:${req.params.id}`;
    
    if (cacheService && typeof cacheService.get === 'function') {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: { analysis: cached } });
      }
    }

    const application = await Application.findById(req.params.id)
      .populate('candidateId')
      .populate('jobId');
      
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    
    if (application.recruiterId.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const candidate = application.candidateId || {};
    const job = application.jobId || {};

    const prompt = `
      You are an expert ATS AI Assistant. Analyze the following candidate profile against the job description and provide a JSON response.
      
      Job Title: ${job.title || 'N/A'}
      Required Skills: ${job.requiredSkills ? job.requiredSkills.join(', ') : 'N/A'}
      
      Candidate Skills: ${candidate.skills ? candidate.skills.join(', ') : 'N/A'}
      Candidate Experience: ${candidate.totalExperience || 'N/A'} years
      Candidate Education: ${candidate.education ? JSON.stringify(candidate.education) : 'N/A'}
      Candidate Resume Text: ${candidate.resumeText || 'N/A'}
      
      Respond STRICTLY with a valid JSON object matching this schema:
      {
        "resumeSummary": "A brief 2-3 sentence summary of the candidate.",
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "matchPercentage": 85,
        "interviewRecommendation": "Highly recommended for technical interview.",
        "suggestedQuestions": ["Q1", "Q2", "Q3", "Q4", "Q5"]
      }
      
      Do not include any other text, only the JSON.
    `;

    let aiResultText = null;
    if (typeof askGemini === 'function') {
      aiResultText = await askGemini(prompt);
    }

    let analysis;
    if (aiResultText) {
      try {
        // Strip out markdown formatting if present
        let cleanText = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        analysis = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    // Fallback if AI fails or returns invalid JSON
    if (!analysis) {
      analysis = {
        resumeSummary: "Candidate profile analyzed based on available data.",
        strengths: candidate.skills || [],
        weaknesses: ["Cannot accurately determine weaknesses without AI analysis"],
        matchPercentage: 70,
        interviewRecommendation: "Proceed with standard interview process.",
        suggestedQuestions: [
          "Can you describe your past experience?",
          "How do your skills align with this role?",
          "What are your key strengths?",
          "Describe a challenge you've overcome.",
          "Why are you interested in this position?"
        ]
      };
    }

    if (cacheService && typeof cacheService.set === 'function') {
      await cacheService.set(cacheKey, analysis, 1800); // 30 minutes
    }
    
    // Save the analysis on the application model
    application.aiAnalysis = analysis;
    if (analysis.matchPercentage) {
      application.aiMatchScore = analysis.matchPercentage;
    }
    await application.save();

    res.json({ success: true, data: { analysis } });
  } catch (error) {
    console.error('Error analyzing application:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// 6. GET /api/ats/candidate/my-applications (protectCandidate)
router.get('/candidate/my-applications', protectCandidate, async (req, res) => {
  try {
    const candidateEmail = req.candidateUser.email;
    const candidateId = req.candidateUser._id;
    
    const applications = await Application.find({
      $or: [
        { candidateEmail },
        { candidateId }
      ]
    })
    .populate('jobId', 'title company location requiredSkills')
    .sort({ appliedAt: -1, appliedDate: -1 });

    const mappedApplications = applications.map(app => {
      const appObj = app.toObject();
      return {
        ...appObj,
        timeline: appObj.statusHistory || []
      };
    });

    res.json({ success: true, data: mappedApplications });
  } catch (error) {
    console.error('Error fetching candidate applications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
