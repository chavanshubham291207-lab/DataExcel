const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

// @desc    Get all jobs for logged in recruiter
// @route   GET /api/jobs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.recruiter.id }).sort('-createdAt');
    
    // Add applicant counts to each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id });
        return {
          ...job.toObject(),
          applicantCount: count
        };
      })
    );

    res.status(200).json({ success: true, count: jobsWithCounts.length, data: jobsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const applicantCount = await Application.countDocuments({ job: job._id });

    res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        applicantCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    req.body.recruiter = req.recruiter.id;

    if (!req.body.company || !req.body.company.trim()) {
      let companyName = req.recruiter.companyName;

      if (!companyName && req.recruiter.companyId) {
        const Company = require('../models/Company');
        const companyRecord = await Company.findById(req.recruiter.companyId);
        if (companyRecord && companyRecord.companyName) {
          companyName = companyRecord.companyName;
        }
      }

      req.body.company = companyName && companyName.trim() ? companyName.trim() : 'DataExcel';
    }

    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (req.body.company === '' || req.body.company === null || (req.body.company && !req.body.company.trim())) {
      let companyName = req.recruiter.companyName;

      if (!companyName && req.recruiter.companyId) {
        const Company = require('../models/Company');
        const companyRecord = await Company.findById(req.recruiter.companyId);
        if (companyRecord && companyRecord.companyName) {
          companyName = companyRecord.companyName;
        }
      }

      req.body.company = companyName && companyName.trim() ? companyName.trim() : (job.company || 'DataExcel');
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Delete job applications as well
    await Application.deleteMany({ job: job._id });
    await job.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Duplicate a job
// @route   POST /api/jobs/:id/duplicate
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const originalJob = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!originalJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const jobData = originalJob.toObject();
    delete jobData._id;
    delete jobData.createdAt;
    
    // Modify details to reflect duplicate
    jobData.title = `${jobData.title} (Copy)`;
    jobData.status = 'Draft';

    const duplicatedJob = await Job.create(jobData);

    res.status(201).json({ success: true, data: duplicatedJob });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update job status directly
// @route   PATCH /api/jobs/:id/status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Draft', 'Published', 'Closed', 'Archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    let job = await Job.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    job.status = status;
    await job.save();

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
