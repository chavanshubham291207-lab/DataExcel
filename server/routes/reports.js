const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

// @desc    Get summary report data
// @route   GET /api/reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const recruiterId = req.recruiter.id;

    // 1. Job Performance Report
    const jobs = await Job.find({ recruiter: recruiterId });
    const jobPerformance = await Promise.all(
      jobs.map(async (job) => {
        const totalApps = await Application.countDocuments({ job: job._id });
        const shortlists = await Application.countDocuments({ job: job._id, status: 'Shortlisted' });
        const hires = await Application.countDocuments({ job: job._id, status: 'Hired' });
        const conversionRate = totalApps > 0 ? ((hires / totalApps) * 100).toFixed(1) : 0;
        return {
          title: job.title,
          location: job.location,
          status: job.status,
          applicants: totalApps,
          shortlisted: shortlists,
          hired: hires,
          conversionRate: `${conversionRate}%`
        };
      })
    );

    // 2. Candidate Analytics Summary
    const totalCandidates = await Candidate.countDocuments({ recruiter: recruiterId });
    const avgAts = await Candidate.aggregate([
      { $match: { recruiter: new require('mongoose').Types.ObjectId(recruiterId) } },
      { $group: { _id: null, avg: { $avg: '$atsScore' } } }
    ]);
    const averageAtsScore = avgAts.length > 0 ? avgAts[0].avg.toFixed(1) : 0;

    // 3. Skill Demand Analytics
    const skillsCounts = {};
    jobs.forEach(job => {
      job.requiredSkills.forEach(s => {
        const cleanS = s.trim();
        skillsCounts[cleanS] = (skillsCounts[cleanS] || 0) + 1;
      });
    });
    const skillDemand = Object.entries(skillsCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Recruiter Performance (Simulated KPI stats)
    const recruiterKPI = {
      interviewsConducted: await Candidate.countDocuments({ recruiter: recruiterId, status: 'Interview Scheduled' }),
      avgTimeToHire: '18 Days',
      activeRecruiterSatisfaction: '94%'
    };

    res.status(200).json({
      success: true,
      data: {
        jobPerformance,
        candidateSummary: {
          totalCandidates,
          averageAtsScore
        },
        skillDemand,
        recruiterKPI
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Export data to CSV format
// @route   GET /api/reports/export
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const recruiterId = req.recruiter.id;
    const type = req.query.type || 'candidates'; // 'candidates' or 'jobs'

    let csvContent = '';
    let fileName = '';

    if (type === 'jobs') {
      fileName = 'Job_Performance_Report.csv';
      csvContent = 'Job Title,Company,Location,Department,Status,Applicants Count\n';
      
      const jobs = await Job.find({ recruiter: recruiterId });
      for (const job of jobs) {
        const appCount = await Application.countDocuments({ job: job._id });
        csvContent += `"${job.title}","${job.company}","${job.location}","${job.department}","${job.status}",${appCount}\n`;
      }
    } else {
      // Default: Candidates
      fileName = 'Candidate_Intelligence_Report.csv';
      csvContent = 'Name,Email,Phone,Skills,Experience (Years),ATS Score,Status\n';

      const candidates = await Candidate.find({ recruiter: recruiterId });
      for (const cand of candidates) {
        const skillsStr = cand.skills.join('; ');
        csvContent += `"${cand.name}","${cand.email}","${cand.phone}","${skillsStr}",${cand.experience},${cand.atsScore},"${cand.status}"\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
