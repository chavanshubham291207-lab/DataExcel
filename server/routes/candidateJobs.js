const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const CandidateUser = require('../models/CandidateUser');
const { protectCandidate } = require('../middleware/candidateAuth');

// @route GET /api/candidate/jobs
// @desc  Browse all Published jobs (public)
router.get('/jobs', async (req, res) => {
  try {
    const { search, location, type, experience, skills } = req.query;
    const filter = { status: 'Published' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.employmentType = type;
    if (experience) filter.experience = { $regex: experience, $options: 'i' };
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      filter.requiredSkills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }

    const jobs = await Job.find(filter).sort('-createdAt').limit(100);
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate/jobs/:id
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'Published' });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate/jobs/:id/apply
router.post('/jobs/:id/apply', protectCandidate, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'Published' });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found or not active' });

    // Check for existing application (prevent duplicates by candidateId or candidateEmail)
    const existingApp = await Application.findOne({
      jobId: job._id,
      $or: [
        { candidateId: req.candidateUser._id },
        { candidateEmail: req.candidateUser.email }
      ]
    });
    if (existingApp) return res.status(400).json({ success: false, error: 'You have already applied to this job' });

    // Compute a basic match score from skill overlap
    const candidateSkills = req.candidateUser.skills.map(s => s.toLowerCase());
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
    const matchCount = candidateSkills.filter(s => jobSkills.includes(s)).length;
    const aiMatchScore = jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 50;

    const missingSkills = jobSkills.filter(s => !candidateSkills.includes(s));

    const application = await Application.create({
      job: job._id,
      jobId: job._id,
      candidate: req.candidateUser._id, // Legacy compatibility
      candidateId: req.candidateUser._id, // Main candidateUser reference
      recruiterId: job.recruiter, // Recruiter responsible for the job
      candidateEmail: req.candidateUser.email,
      candidateName: req.candidateUser.name,
      status: 'Applied',
      appliedDate: new Date(),
      aiMatchScore,
      aiAnalysis: {
        skillScore: aiMatchScore,
        missingSkills,
        relevanceExplanation: `${matchCount} of ${jobSkills.length} required skills matched.`
      }
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route POST /api/candidate/jobs/:id/save
router.post('/jobs/:id/save', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id);
    const jobId = req.params.id;
    const alreadySaved = candidate.savedJobs.some(id => id.toString() === jobId);

    if (alreadySaved) {
      candidate.savedJobs = candidate.savedJobs.filter(id => id.toString() !== jobId);
    } else {
      candidate.savedJobs.push(jobId);
    }

    await candidate.save();
    res.status(200).json({ success: true, saved: !alreadySaved, savedJobs: candidate.savedJobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate/saved-jobs
router.get('/saved-jobs', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id).populate('savedJobs');
    res.status(200).json({ success: true, data: candidate.savedJobs || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate/applications
router.get('/applications', protectCandidate, async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.candidateUser._id })
      .populate('job', 'title company location employmentType salaryRange')
      .sort('-appliedAt');
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate/recommended
// @desc  AI-ranked jobs based on candidate skills + profile
router.get('/recommended', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id);
    const jobs = await Job.find({ status: 'Published' }).limit(50);

    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const preferredLoc = (candidate.preferredLocation || '').toLowerCase();
    const experienceYears = candidate.totalExperience || 0;

    const ranked = jobs.map(job => {
      const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
      const matched = candidateSkills.filter(s => jobSkills.includes(s));
      const skillScore = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 50 : 25;
      const locScore = preferredLoc && job.location.toLowerCase().includes(preferredLoc) ? 20 : 0;
      const expScore = 20; // simplified
      const matchPercent = Math.min(Math.round(skillScore + locScore + expScore), 99);
      const missingSkills = jobSkills.filter(s => !candidateSkills.includes(s));

      return {
        ...job.toObject(),
        matchPercent,
        matchedSkills: matched,
        missingSkills,
        explanation: `You match ${matched.length}/${jobSkills.length} required skills.${locScore > 0 ? ' Location matches your preference.' : ''}`
      };
    });

    ranked.sort((a, b) => b.matchPercent - a.matchPercent);
    res.status(200).json({ success: true, data: ranked.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route GET /api/candidate/dashboard-stats
router.get('/dashboard-stats', protectCandidate, async (req, res) => {
  try {
    const candidate = await CandidateUser.findById(req.candidateUser._id);
    const totalApplied = await Application.countDocuments({ candidate: req.candidateUser._id });
    const savedCount = candidate.savedJobs ? candidate.savedJobs.length : 0;

    const interviews = await Application.countDocuments({
      candidate: req.candidateUser._id,
      status: 'Interview Scheduled'
    });

    res.status(200).json({
      success: true,
      data: {
        totalApplied,
        savedJobs: savedCount,
        interviewInvites: interviews,
        atsScore: candidate.atsScore || 0,
        profileCompleteness: candidate.profileCompleteness
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
