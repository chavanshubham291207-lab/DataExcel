const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

// @desc    Get all applications for the logged-in recruiter
// @route   GET /api/applications
// @access  Private (Recruiter)
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Initial filter: only applications corresponding to this recruiter
    let filter = { recruiterId: req.recruiter.id };

    if (status) {
      filter.status = status;
    }

    let applications = await Application.find(filter)
      .populate('jobId', 'title company location requiredSkills')
      .populate('candidateId', 'name email phone skills totalExperience profilePhoto education workExperience linkedin github portfolio')
      .sort('-appliedDate');

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      applications = applications.filter(app => {
        const candidateName = (app.candidateName || app.candidateId?.name || '').toLowerCase();
        const candidateEmail = (app.candidateEmail || app.candidateId?.email || '').toLowerCase();
        const jobTitle = (app.jobId?.title || '').toLowerCase();
        
        return (
          candidateName.includes(searchLower) ||
          candidateEmail.includes(searchLower) ||
          jobTitle.includes(searchLower)
        );
      });
    }

    const totalCount = applications.length;
    const paginatedApps = applications.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      count: paginatedApps.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: paginatedApps
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get details for a single application
// @route   GET /api/applications/:id
// @access  Private (Recruiter)
router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('candidateId');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Verify ownership
    if (application.recruiterId && application.recruiterId.toString() !== req.recruiter.id.toString()) {
      return res.status(403).json({ success: false, error: 'Access denied. You can only view applications for your own jobs.' });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
