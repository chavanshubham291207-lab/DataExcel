const express = require('express');
const router = express.Router();
const axios = require('axios');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Get all candidates with filters, sorting, and NL Search proxy
// @route   GET /api/candidates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let mongoQuery = { recruiter: req.recruiter.id };
    let parsedFilters = null;
    
    // If a natural language query is supplied
    if (req.query.query) {
      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/search`, {
          query: req.query.query
        });
        
        const filters = aiResponse.data;
        parsedFilters = filters;
        
        // Match skills (if any)
        if (filters.skills && filters.skills.length > 0) {
          mongoQuery.skills = { $all: filters.skills.map(s => new RegExp(s, 'i')) };
        }
        
        // Experience filter
        if (filters.minExperience !== null || filters.maxExperience !== null) {
          mongoQuery.experience = {};
          if (filters.minExperience !== null) mongoQuery.experience.$gte = filters.minExperience;
          if (filters.maxExperience !== null) mongoQuery.experience.$lte = filters.maxExperience;
        }
        
        // Location filter
        if (filters.location) {
          mongoQuery.location = new RegExp(filters.location, 'i');
        }
        
        // Education check
        if (filters.education) {
          mongoQuery.education = new RegExp(filters.education, 'i');
        }
      } catch (err) {
        console.error('NL Search parsing failed, falling back to basic text matching:', err.message);
        // Fallback: search text in name/skills/summary
        mongoQuery.$or = [
          { name: new RegExp(req.query.query, 'i') },
          { skills: new RegExp(req.query.query, 'i') },
          { summary: new RegExp(req.query.query, 'i') }
        ];
      }
    } else {
      // Standard filters
      if (req.query.skills) {
        const skillsArr = req.query.skills.split(',').map(s => s.trim());
        mongoQuery.skills = { $all: skillsArr.map(s => new RegExp(s, 'i')) };
      }
      
      if (req.query.status) {
        mongoQuery.status = req.query.status;
      }
      
      if (req.query.experience) {
        const exp = parseInt(req.query.experience);
        if (!isNaN(exp)) {
          mongoQuery.experience = { $gte: exp };
        }
      }
      
      if (req.query.location) {
        mongoQuery.location = new RegExp(req.query.location, 'i');
      }
    }

    // Determine Sorting
    let sortBy = '-createdAt';
    if (req.query.sort) {
      if (req.query.sort === 'experience') sortBy = '-experience';
      else if (req.query.sort === 'atsScore') sortBy = '-atsScore';
      else if (req.query.sort === 'oldest') sortBy = 'createdAt';
      else if (req.query.sort === 'latest') sortBy = '-createdAt';
    }

    const candidates = await Candidate.find(mongoQuery).sort(sortBy);
    
    // If filtering candidates by job application match score
    const candidatesWithApplicationData = await Promise.all(
      candidates.map(async (c) => {
        let appData = null;
        if (req.query.jobId) {
          appData = await Application.findOne({ candidate: c._id, job: req.query.jobId });
        }
        return {
          ...c.toObject(),
          matchScore: appData ? appData.aiMatchScore : 0,
          aiAnalysis: appData ? appData.aiAnalysis : null,
          jobStatus: appData ? appData.status : null
        };
      })
    );

    // If sorting by AI Match Score
    if (req.query.sort === 'matchScore' && req.query.jobId) {
      candidatesWithApplicationData.sort((a, b) => b.matchScore - a.matchScore);
    }

    res.status(200).json({ success: true, count: candidatesWithApplicationData.length, data: candidatesWithApplicationData, filters: parsedFilters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Get all jobs candidate applied to
    const applications = await Application.find({ candidate: candidate._id }).populate('job', 'title company');

    res.status(200).json({ success: true, data: candidate, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Upload resume and parse via AI FastAPI service
// @route   POST /api/candidates/upload
// @access  Private
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please upload a resume file.' });
  }

  try {
    const fs = require('fs');
    const pdf = require('pdf-parse');
    
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Step 1 & 2: Extract text from PDF resume
    const pdfData = await pdf(fileBuffer);
    const extractedText = pdfData.text || '';

    // Step 3: Extract structured fields using Gemini
    let parsedData = {
      name: req.file.originalname.split('.')[0],
      email: '',
      phone: '',
      skills: [],
      experience: 0,
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      summary: '',
      atsScore: 70
    };

    try {
      const { generateGeminiContent } = require('../services/geminiService');
      const parsePrompt = `Analyze the following resume text and extract candidate profile details in JSON format:
{
  "name": "Full Name",
  "email": "email address",
  "phone": "phone number",
  "skills": ["skill1", "skill2"],
  "experience": 3,
  "education": ["degree details"],
  "projects": ["project details"],
  "certifications": ["certification details"],
  "languages": ["language details"],
  "summary": "Short 2-sentence professional summary",
  "atsScore": 85
}

Resume Text:
${extractedText}`;

      const aiResponse = await generateGeminiContent(parsePrompt, 'You are an expert resume parser. Respond ONLY with valid JSON.');
      if (aiResponse) {
        const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = { ...parsedData, ...JSON.parse(cleanJson) };
      }
    } catch (parseErr) {
      console.warn('[Resume Parsing Fallback] Gemini JSON extraction failed, using basic fallback:', parseErr.message);
    }

    // Create Candidate details in MongoDB (will trigger pre-save embedding hook)
    const candidate = await Candidate.create({
      recruiter: req.recruiter.id,
      name: parsedData.name || req.file.originalname.split('.')[0],
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      skills: parsedData.skills || [],
      experience: parsedData.experience || 0,
      education: parsedData.education || [],
      projects: parsedData.projects || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      summary: parsedData.summary || '',
      resumePath: `/uploads/${req.file.filename}`,
      atsScore: parsedData.atsScore || 70,
      tags: parsedData.skills ? parsedData.skills.slice(0, 3) : [],
      resumeText: extractedText
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    console.error('Upload & AI Parsing error:', error.message);
    res.status(500).json({ success: false, error: `Resume processing failed: ${error.message}` });
  }
});

// @desc    Create candidate manually
// @route   POST /api/candidates
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    req.body.recruiter = req.recruiter.id;
    const candidate = await Candidate.create(req.body);
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update candidate details
// @route   PUT /api/candidates/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Apply candidate to a Job and run AI Matching score
// @route   POST /api/candidates/:id/apply/:jobId
// @access  Private
router.post('/:id/apply/:jobId', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });
    const job = await Job.findOne({ _id: req.params.jobId, recruiter: req.recruiter.id });

    if (!candidate || !job) {
      return res.status(404).json({ success: false, error: 'Candidate or Job not found' });
    }

    // Check if application already exists
    let application = await Application.findOne({ candidate: candidate._id, job: job._id });
    if (application) {
      return res.status(400).json({ success: false, error: 'Candidate has already applied to this job' });
    }

    // Call Python service to get Match Score
    let aiMatchScore = 50;
    let aiAnalysis = {
      skillScore: 50,
      experienceScore: 50,
      educationScore: 50,
      missingSkills: [],
      relevanceExplanation: 'Computed default match'
    };

    try {
      const matchRes = await axios.post(`${AI_SERVICE_URL}/match`, {
        candidate: {
          skills: candidate.skills,
          experience: candidate.experience,
          education: candidate.education
        },
        job: {
          requiredSkills: job.requiredSkills,
          experience: job.experience,
          education: job.education
        }
      });
      
      aiMatchScore = matchRes.data.matchScore;
      aiAnalysis = {
        skillScore: matchRes.data.skillScore,
        experienceScore: matchRes.data.experienceScore,
        educationScore: matchRes.data.educationScore,
        missingSkills: matchRes.data.missingSkills,
        relevanceExplanation: matchRes.data.relevanceExplanation
      };
    } catch (err) {
      console.error('FastAPI Matching Service unavailable. Calculating local fallback.', err.message);
      // Fallback matching logic
      const reqSkills = job.requiredSkills.map(s => s.toLowerCase());
      const candSkills = candidate.skills.map(s => s.toLowerCase());
      const matched = reqSkills.filter(s => candSkills.includes(s));
      const skillScore = reqSkills.length > 0 ? (matched.length / reqSkills.length) * 100 : 100;
      aiMatchScore = Math.round(skillScore);
      aiAnalysis.skillScore = aiMatchScore;
      aiAnalysis.relevanceExplanation = 'Fallback local calculation';
      aiAnalysis.missingSkills = job.requiredSkills.filter(s => !candSkills.includes(s.toLowerCase()));
    }

    application = await Application.create({
      job: job._id,
      candidate: candidate._id,
      status: 'Applied',
      aiMatchScore,
      aiAnalysis
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update candidate status
// @route   PATCH /api/candidates/:id/status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, jobId } = req.body;
    if (!['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    candidate.status = status;
    await candidate.save();

    // If job context is provided, update application status as well
    if (jobId) {
      await Application.findOneAndUpdate(
        { candidate: candidate._id, job: jobId },
        { status },
        { new: true }
      );
    }

    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Add comment / note
// @route   POST /api/candidates/:id/notes
// @access  Private
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    candidate.notes.push({
      writer: req.recruiter.name,
      comment: req.body.comment
    });

    await candidate.save();

    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update internal ratings
// @route   PATCH /api/candidates/:id/rating
// @access  Private
router.patch('/:id/rating', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    candidate.internalRatings = rating;
    await candidate.save();

    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    await Application.deleteMany({ candidate: candidate._id });
    await candidate.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Send email to candidate
// @route   POST /api/candidates/:id/email
// @access  Private
router.post('/:id/email', protect, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, recruiter: req.recruiter.id });
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const { subject, body } = req.body;

    // Nodemailer configuration (Mock transport)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal_user_placeholder',
        pass: process.env.EMAIL_PASS || 'ethereal_pass_placeholder'
      }
    });

    const mailOptions = {
      from: `"${req.recruiter.name} from ${req.recruiter.companyName || 'Talent Platform'}" <${req.recruiter.email}>`,
      to: candidate.email,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
              <p>${body.replace(/\n/g, '<br>')}</p>
             </div>`
    };

    // Attempt mail send (will catch if using invalid creds, but return success anyway for demo convenience)
    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.log('Nodemailer simulated dispatch (creds missing or mock host):', mailErr.message);
    }

    // Document in notes timeline
    candidate.notes.push({
      writer: 'System (Email Dispatched)',
      comment: `Subject: ${subject}`
    });
    await candidate.save();

    res.status(200).json({ success: true, message: 'Email sent successfully (Simulated)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    AI Hiring Copilot proxy
// @route   POST /api/candidates/copilot
// @access  Private
router.post('/copilot', protect, async (req, res) => {
  try {
    const { message, jobId } = req.body;
    
    // Fetch all candidates for this recruiter
    const candidates = await Candidate.find({ recruiter: req.recruiter.id });
    
    // Fetch active job if provided
    let activeJob = null;
    if (jobId) {
      activeJob = await Job.findOne({ _id: jobId, recruiter: req.recruiter.id });
    }

    // Forward to FastAPI copilot
    const copilotRes = await axios.post(`${AI_SERVICE_URL}/copilot`, {
      message,
      candidates,
      job: activeJob
    });

    res.status(200).json({ success: true, reply: copilotRes.data.reply });
  } catch (error) {
    console.error('AI Copilot route error:', error.message);
    
    // Fallback: run local copilot parser logic directly in backend if FastAPI fails
    res.status(200).json({ 
      success: true, 
      reply: "I am having trouble connecting to my AI core service, but I can help you with local candidates. Try running the FastAPI server on port 8000."
    });
  }
});

module.exports = router;
