const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const { protect } = require('../middleware/auth');

// @desc    Get recruiter dashboard analytical metrics and charts
// @route   GET /api/analytics
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const recruiterId = req.recruiter.id;

    // 1. Fetch Key Stats
    const totalJobs = await Job.countDocuments({ recruiter: recruiterId });
    const activeJobs = await Job.countDocuments({ recruiter: recruiterId, status: 'Published' });
    const closedJobs = await Job.countDocuments({ recruiter: recruiterId, status: 'Closed' });
    const draftJobs = await Job.countDocuments({ recruiter: recruiterId, status: 'Draft' });

    // Count applicants via jobs posted by this recruiter
    const recruiterJobs = await Job.find({ recruiter: recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(j => j._id);
    const totalApplicants = await Application.countDocuments({ job: { $in: jobIds } });

    // Count candidate status states from both manual candidates and applications
    const shortlistedCandidates = await Application.countDocuments({ recruiterId, status: 'Shortlisted' });
    const interviewScheduled = await Application.countDocuments({ recruiterId, status: 'Interview Scheduled' });
    const hiredCandidates = await Application.countDocuments({ recruiterId, status: 'Hired' });
    const rejectedCandidates = await Application.countDocuments({ recruiterId, status: 'Rejected' });

    // 2. Hiring Funnel Aggregates
    const appliedCount = await Candidate.countDocuments({ recruiter: recruiterId, status: 'Applied' });
    const funnelData = [
      { name: 'Applied', value: appliedCount + shortlistedCandidates + interviewScheduled + hiredCandidates + rejectedCandidates },
      { name: 'Shortlisted', value: shortlistedCandidates + interviewScheduled + hiredCandidates },
      { name: 'Interview Scheduled', value: interviewScheduled + hiredCandidates },
      { name: 'Hired', value: hiredCandidates }
    ];

    // 3. Candidate Skills Distribution
    // Get all recruiter's candidates and calculate top skills
    const candidates = await Candidate.find({ recruiter: recruiterId }).select('skills');
    const skillCounts = {};
    candidates.forEach(cand => {
      cand.skills.forEach(skill => {
        const cleanSkill = skill.trim();
        skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
      });
    });
    // Format and sort top 8 skills
    const skillsDistribution = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 4. Monthly Hiring Trend (Mock / Aggregate past 6 months)
    const monthlyHiring = [
      { name: 'Jan', Hired: 2, Rejected: 1 },
      { name: 'Feb', Hired: 1, Rejected: 3 },
      { name: 'Mar', Hired: 3, Rejected: 2 },
      { name: 'Apr', Hired: hiredCandidates, Rejected: rejectedCandidates } // Connect to real count
    ];

    // 5. Daily Applications Trend (Past 7 days)
    // Dynamic generation of date keys
    const appTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Calculate applications on this day
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await Application.countDocuments({
        job: { $in: jobIds },
        appliedAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      appTrend.push({
        name: label,
        Applications: count
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        closedJobs,
        draftJobs,
        totalApplicants,
        shortlistedCandidates,
        interviewScheduled,
        hiredCandidates,
        rejectedCandidates
      },
      charts: {
        funnelData,
        skillsDistribution,
        monthlyHiring,
        appTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
