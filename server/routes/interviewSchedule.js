const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const CandidateUser = require('../models/CandidateUser');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { protectCandidate } = require('../middleware/candidateAuth');

// ─────────────────────────────────────────────────────────────
// RECRUITER ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * @route  POST /api/interview-schedule/lookup-application
 * @desc   Lookup an application by ID and return candidate + job details
 * @access Private (Recruiter)
 */
router.post('/lookup-application', protect, async (req, res) => {
  const { applicationId } = req.body;

  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Application ID.' });
  }

  try {
    // Fetch the application and populate job
    const application = await Application.findById(applicationId).populate('job');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found. Please check the Application ID.' });
    }

    // Verify the job belongs to the logged-in recruiter
    if (!application.job || application.job.recruiter.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied. This application does not belong to your job postings.' });
    }

    // Find candidate by email from CandidateUser model
    let candidateProfile = null;
    if (application.candidateEmail) {
      candidateProfile = await CandidateUser.findOne({ email: application.candidateEmail });
    }

    // Check if interview already scheduled for this application
    const existingInterview = await Interview.findOne({ applicationId: application._id });

    return res.status(200).json({
      success: true,
      data: {
        application: {
          _id: application._id,
          status: application.status,
          aiMatchScore: application.aiMatchScore,
          appliedAt: application.appliedAt,
          candidateName: application.candidateName,
          candidateEmail: application.candidateEmail,
        },
        candidate: candidateProfile
          ? {
              _id: candidateProfile._id,
              name: candidateProfile.name,
              email: candidateProfile.email,
              phone: candidateProfile.phone || '',
              headline: candidateProfile.headline || '',
              skills: candidateProfile.skills || [],
              totalExperience: candidateProfile.totalExperience || 0,
              workExperience: candidateProfile.workExperience || [],
              education: candidateProfile.education || [],
              resumePath: candidateProfile.resumePath || '',
              atsScore: candidateProfile.atsScore || 0,
              linkedin: candidateProfile.linkedin || '',
              github: candidateProfile.github || '',
            }
          : {
              name: application.candidateName || 'Unknown Candidate',
              email: application.candidateEmail || '',
              skills: [],
              workExperience: [],
            },
        job: {
          _id: application.job._id,
          title: application.job.title,
          company: application.job.company,
          department: application.job.department,
          location: application.job.location,
          employmentType: application.job.employmentType,
          requiredSkills: application.job.requiredSkills || [],
        },
        existingInterview: existingInterview
          ? {
              _id: existingInterview._id,
              interviewDate: existingInterview.interviewDate,
              startTime: existingInterview.startTime,
              endTime: existingInterview.endTime,
              mode: existingInterview.mode,
              meetingLink: existingInterview.meetingLink,
              status: existingInterview.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[interview-schedule] lookup-application error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route  POST /api/interview-schedule/schedule
 * @desc   Schedule interview for an application (CandidateUser-based)
 * @access Private (Recruiter)
 */
router.post('/schedule', protect, async (req, res) => {
  const { applicationId, interviewDate, startTime, endTime, mode, meetingLink, notes } = req.body;

  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Application ID.' });
  }

  if (!interviewDate || !startTime || !endTime || !mode) {
    return res.status(400).json({ success: false, error: 'Interview date, start time, end time, and mode are required.' });
  }

  try {
    // Verify application exists and belongs to recruiter's jobs
    const application = await Application.findById(applicationId).populate('job');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (!application.job || application.job.recruiter.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only schedule interviews for your own job postings.' });
    }

    // Prevent duplicate scheduling
    const duplicate = await Interview.findOne({ applicationId: application._id });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: 'An interview has already been scheduled for this application. Please cancel the existing one first.',
      });
    }

    // Build interview record
    const interviewData = {
      applicationId: application._id,
      recruiterId: req.recruiter.id,
      jobId: application.job._id,
      candidateEmail: application.candidateEmail || '',
      candidateName: application.candidateName || '',
      interviewDate,
      startTime,
      endTime,
      mode,
      meetingLink: meetingLink || '',
      notes: notes || '',
      status: 'Scheduled',
      // Legacy Interview model fields for compatibility
      recruiter: req.recruiter.id,
      job: application.job._id,
      candidate: application.candidate || null,
      dateTime: new Date(`${interviewDate}T${startTime}`),
    };

    const interview = await Interview.create(interviewData);

    // Update application status
    application.status = 'Interview Scheduled';
    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: 'Interview Scheduled',
      changedAt: new Date(),
      note: `Interview scheduled by recruiter for ${interviewDate} at ${startTime}`,
    });
    await application.save();

    // Create notification for recruiter
    try {
      await Notification.create({
        recruiter: req.recruiter.id,
        title: 'Interview Scheduled',
        message: `Interview scheduled for ${application.candidateName || 'candidate'} — ${application.job.title} on ${interviewDate} at ${startTime}`,
        type: 'success',
      });
    } catch (_) { /* notification failure is non-critical */ }

    // Create notification for candidate
    try {
      await Notification.create({
        recipientId: application.candidateId ? application.candidateId.toString() : '',
        recipientEmail: application.candidateEmail || '',
        title: 'Interview Scheduled',
        message: `You have an interview scheduled for ${application.job.title} on ${interviewDate} at ${startTime}.`,
        type: 'success',
      });
    } catch (err) {
      console.error('[interview-schedule] Failed to create candidate notification:', err.message);
    }

    return res.status(201).json({ success: true, data: interview });
  } catch (error) {
    console.error('[interview-schedule] schedule error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route  GET /api/interview-schedule/application/:applicationId
 * @desc   Get interview for a specific application
 * @access Private (Recruiter)
 */
router.get('/application/:applicationId', protect, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.applicationId)) {
    return res.status(400).json({ success: false, error: 'Invalid Application ID.' });
  }

  try {
    const application = await Application.findById(req.params.applicationId).populate('job');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (!application.job || application.job.recruiter.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const interview = await Interview.findOne({ applicationId: req.params.applicationId });
    return res.status(200).json({ success: true, data: interview || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route  GET /api/interview-schedule/recruiter/all
 * @desc   Get all scheduled interviews for recruiter with full details
 * @access Private (Recruiter)
 */
router.get('/recruiter/all', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.recruiter.id })
      .populate('jobId', 'title company department')
      .sort({ interviewDate: 1, startTime: 1 });

    return res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route  PUT /api/interview-schedule/:id/cancel
 * @desc   Cancel a scheduled interview and revert application status
 * @access Private (Recruiter)
 */
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, recruiterId: req.recruiter.id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found or access denied.' });
    }

    interview.status = 'Cancelled';
    await interview.save();

    // Revert application status
    if (interview.applicationId) {
      const app = await Application.findById(interview.applicationId);
      if (app) {
        app.status = 'Shortlisted';
        app.statusHistory = app.statusHistory || [];
        app.statusHistory.push({
          status: 'Shortlisted',
          changedAt: new Date(),
          note: 'Interview cancelled by recruiter.',
        });
        await app.save();
      }
    }

    return res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CANDIDATE ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * @route  GET /api/interview-schedule/candidate/my-interviews
 * @desc   Get all interviews scheduled for the logged-in candidate
 * @access Private (Candidate)
 */
router.get('/candidate/my-interviews', protectCandidate, async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateEmail: req.candidateUser.email })
      .populate('jobId', 'title company department location')
      .sort({ interviewDate: 1, startTime: 1 });

    return res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
