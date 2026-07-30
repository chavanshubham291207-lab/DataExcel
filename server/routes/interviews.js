const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @desc    Get all interviews for recruiter (for Calendar/List views)
// @route   GET /api/interviews
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiter: req.recruiter.id })
      .populate('candidate', 'name email status')
      .populate('job', 'title company')
      .sort('dateTime');
    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Schedule a new interview
// @route   POST /api/interviews
// @access  Private
router.post('/', protect, async (req, res) => {
  const { candidateId, jobId, dateTime, panelists, meetingLink, notes } = req.body;

  try {
    const candidate = await Candidate.findOne({ _id: candidateId, recruiter: req.recruiter.id });
    const job = await Job.findOne({ _id: jobId, recruiter: req.recruiter.id });

    if (!candidate || !job) {
      return res.status(404).json({ success: false, error: 'Candidate or Job not found' });
    }

    const interview = await Interview.create({
      recruiter: req.recruiter.id,
      candidate: candidateId,
      job: jobId,
      dateTime,
      panelists: panelists || [],
      meetingLink: meetingLink || 'https://meet.google.com/abc-defg-hij',
      notes: notes || ''
    });

    // Update candidate status to 'Interview Scheduled'
    candidate.status = 'Interview Scheduled';
    candidate.notes.push({
      writer: 'System',
      comment: `Interview scheduled on ${new Date(dateTime).toLocaleString()} with panelists: ${panelists.join(', ')}`
    });
    await candidate.save();

    // Create Notification
    await Notification.create({
      recruiter: req.recruiter.id,
      title: 'Interview Scheduled',
      message: `An interview has been scheduled for ${candidate.name} for the role of ${job.title} on ${new Date(dateTime).toLocaleDateString()}`,
      type: 'success'
    });

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Reschedule an interview
// @route   PUT /api/interviews/:id/reschedule
// @access  Private
router.put('/:id/reschedule', protect, async (req, res) => {
  const { dateTime } = req.body;

  try {
    let interview = await Interview.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    interview.dateTime = dateTime;
    interview.status = 'Rescheduled';
    await interview.save();

    // Log to candidate notes
    const candidate = await Candidate.findById(interview.candidate);
    if (candidate) {
      candidate.notes.push({
        writer: 'System',
        comment: `Interview rescheduled to ${new Date(dateTime).toLocaleString()}`
      });
      await candidate.save();
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Cancel an interview
// @route   PUT /api/interviews/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    let interview = await Interview.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    interview.status = 'Cancelled';
    await interview.save();

    // Reset candidate status back to Applied/Shortlisted (Mock: Shortlisted)
    const candidate = await Candidate.findById(interview.candidate);
    if (candidate) {
      candidate.status = 'Shortlisted';
      candidate.notes.push({
        writer: 'System',
        comment: `Interview scheduled on ${new Date(interview.dateTime).toLocaleString()} was cancelled.`
      });
      await candidate.save();
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Record feedback and final decision
// @route   PUT /api/interviews/:id/feedback
// @access  Private
router.put('/:id/feedback', protect, async (req, res) => {
  const { feedback, notes, finalDecision } = req.body;

  try {
    let interview = await Interview.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    interview.feedback = feedback || interview.feedback;
    interview.notes = notes || interview.notes;
    interview.finalDecision = finalDecision || interview.finalDecision;
    interview.status = 'Completed';
    await interview.save();

    // If final decision is made, update candidate status accordingly
    if (finalDecision && finalDecision !== 'Pending') {
      const candidate = await Candidate.findById(interview.candidate);
      if (candidate) {
        if (finalDecision === 'Hire') {
          candidate.status = 'Hired';
          candidate.notes.push({
            writer: 'System',
            comment: 'Offer Extended: Candidate cleared interview panel.'
          });
          
          await Notification.create({
            recruiter: req.recruiter.id,
            title: 'Offer Accepted / Candidate Hired',
            message: `Hiring decision complete! ${candidate.name} has been marked as HIRED.`,
            type: 'success'
          });
        } else if (finalDecision === 'Reject') {
          candidate.status = 'Rejected';
          candidate.notes.push({
            writer: 'System',
            comment: 'Candidate rejected post-interview panel evaluation.'
          });
        }
        await candidate.save();
      }
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
