const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/recruiter-dashboard';
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}, Database: ${conn.connection.name}`);
    
    // Import all models for document counts
    const Recruiter = require('../models/Recruiter');
    const CandidateUser = require('../models/CandidateUser');
    const Candidate = require('../models/Candidate');
    const Company = require('../models/Company');
    const Job = require('../models/Job');
    const Application = require('../models/Application');
    const Interview = require('../models/Interview');

    const counts = {
      recruiters: await Recruiter.countDocuments(),
      candidateUsers: await CandidateUser.countDocuments(),
      candidates: await Candidate.countDocuments(),
      companies: await Company.countDocuments(),
      jobs: await Job.countDocuments(),
      applications: await Application.countDocuments(),
      interviews: await Interview.countDocuments()
    };

    console.log('================ DATABASE VERIFICATION ================');
    console.log(`Connected Database: ${conn.connection.name}`);
    console.log(`Total Users (Candidate Users): ${counts.candidateUsers}`);
    console.log(`Total Candidates (ATS):       ${counts.candidates}`);
    console.log(`Total Recruiters:             ${counts.recruiters}`);
    console.log(`Total Companies:              ${counts.companies}`);
    console.log(`Total Jobs:                   ${counts.jobs}`);
    console.log(`Total Applications:           ${counts.applications}`);
    console.log(`Total Interviews:             ${counts.interviews}`);
    console.log('=======================================================');

    if (counts.recruiters === 0) {
      console.log('[MongoDB] Collections are empty. Running automatic seed data...');
      const { seedDatabase } = require('../seed/seed');
      await seedDatabase();
      console.log('[MongoDB] Seed data populated successfully.');
    } else {
      console.log(`[MongoDB] Database contains existing records. Recruiter count: ${counts.recruiters}`);
    }
  } catch (error) {
    console.log(`Local/configured MongoDB at ${mongoUri} unavailable (${error.message}).`);
    console.log('Starting MongoMemoryServer fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`MongoDB Connected (In-Memory Fallback): ${conn.connection.host}, Database: ${conn.connection.name}`);
      
      const Recruiter = require('../models/Recruiter');
      const count = await Recruiter.countDocuments();
      if (count === 0) {
        console.log('Seeding initial data into in-memory database...');
        await seedInMemoryDB();
      }
    } catch (memErr) {
      console.error(`In-memory MongoDB startup failed: ${memErr.message}`);
      process.exit(1);
    }
  }
};

async function seedInMemoryDB() {
  const Recruiter = require('../models/Recruiter');
  const Job = require('../models/Job');
  const Candidate = require('../models/Candidate');
  const Application = require('../models/Application');
  const Interview = require('../models/Interview');
  const Notification = require('../models/Notification');

  const recruiter = await Recruiter.create({
    name: 'Sarah Jenkins',
    email: 'recruiter@example.com',
    password: 'password123',
    companyName: 'Apex AI Systems',
    companyWebsite: 'https://apex-ai.io',
    notificationSettings: {
      newApplications: true,
      interviewReminders: true,
      jobExpiration: true,
      offerStatus: true
    }
  });

  const job1 = await Job.create({
    recruiter: recruiter._id,
    title: 'Senior React Developer',
    company: 'Apex AI Systems',
    department: 'Product Engineering',
    location: 'Remote',
    salaryRange: '$90,000 - $120,000',
    employmentType: 'Full-time',
    experience: '5+ years',
    requiredSkills: ['React', 'TypeScript', 'Redux', 'Tailwind', 'Git'],
    education: 'Bachelor of Computer Science / IT',
    description: 'We are seeking a senior-level frontend engineer specializing in React and TypeScript to build rich user experiences for our AI Talent Platform.',
    responsibilities: [
      'Develop and maintain complex responsive frontend layouts.',
      'Optimize components for maximum performance across web devices.',
      'Collaborate with backend APIs and AI service teams.'
    ],
    benefits: ['Remote First Policy', 'Health and Dental Cover', 'Annual Tech Budget'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'Published'
  });

  const job2 = await Job.create({
    recruiter: recruiter._id,
    title: 'AI/ML Software Engineer',
    company: 'Apex AI Systems',
    department: 'Data Science & Intelligence',
    location: 'Pune',
    salaryRange: '₹12,00,000 - ₹18,00,000',
    employmentType: 'Full-time',
    experience: '3+ years',
    requiredSkills: ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'FastAPI'],
    education: 'M.Tech / M.Sc in Data Science or related fields',
    description: 'Join our intelligence core team and construct recommendation algorithms, parse unstructured CV data, and build real-time FastAPI endpoints.',
    responsibilities: [
      'Build, deploy and optimize NLP parser pipelines.',
      'Architect candidate-to-job match recommendation systems.',
      'Maintain FastAPI services serving recommendations.'
    ],
    benefits: ['Hybrid Work Mode', 'Stock Options (ESOPs)', 'Flexible Working Hours'],
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'Published'
  });

  const job3 = await Job.create({
    recruiter: recruiter._id,
    title: 'Full Stack Node.js Engineer',
    company: 'Apex AI Systems',
    department: 'Product Engineering',
    location: 'Pune',
    salaryRange: '₹8,00,000 - ₹12,00,000',
    employmentType: 'Contract',
    experience: '2-4 years',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'AWS', 'Docker'],
    education: 'B.Tech / BCA / Equivalent Degree',
    description: 'Looking for a backend-heavy full-stack engineer who is proficient in Node.js and MongoDB to manage our candidate matching platforms and scale our Express.js APIs.',
    responsibilities: [
      'Design database structures in MongoDB Atlas.',
      'Write modular API controllers for Express server integrations.',
      'Deploy backend containers using Docker and AWS ECS.'
    ],
    benefits: ['Performance Bonuses', 'Paid Time Off', 'Health Insurance'],
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'Closed'
  });

  const cand1 = await Candidate.create({
    recruiter: recruiter._id,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 555 123 4567',
    skills: ['React', 'TypeScript', 'Redux', 'Tailwind', 'Git', 'HTML', 'CSS', 'JavaScript'],
    experience: 6,
    education: ['B.Tech in Computer Science - State University'],
    projects: ['Lead Developer for high-traffic dashboard rebuild', 'E-commerce UI framework creation'],
    certifications: ['React Developer Certification', 'Scrum Alliance Product Owner'],
    summary: 'Senior frontend developer with over 6 years of expertise building user interfaces in React. Skilled in TypeScript, styling architectures, and state management.',
    atsScore: 92,
    tags: ['React', 'TypeScript', 'Senior'],
    internalRatings: 5,
    status: 'Shortlisted',
    notes: [
      { writer: 'Sarah Jenkins', comment: 'Extremely strong frontend candidate. Clear experience and solid coding style.' }
    ]
  });

  const cand2 = await Candidate.create({
    recruiter: recruiter._id,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 98765 43210',
    skills: ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'FastAPI', 'Pandas', 'Numpy', 'Data Science'],
    experience: 4,
    education: ['M.Tech in Data Science - IIT Pune', 'B.Tech in Information Technology'],
    projects: ['Designed recommendation systems for talent intelligence', 'Implemented LLM document summarizers'],
    certifications: ['DeepLearning.AI Tensorflow Certification', 'Google Cloud ML Associate'],
    summary: 'Data scientist and machine learning developer with 4 years of industrial experience building FastAPI integrations, cleaning text data, and training ML models.',
    atsScore: 89,
    tags: ['Python', 'Machine Learning', 'Data Science'],
    internalRatings: 4,
    status: 'Interview Scheduled',
    notes: [
      { writer: 'Sarah Jenkins', comment: 'Demonstrates thorough NLP knowledge. Interview scheduled.' }
    ]
  });

  await Application.create({
    job: job1._id,
    candidate: cand1._id,
    status: 'Shortlisted',
    aiMatchScore: 92,
    aiAnalysis: {
      skillScore: 95,
      experienceScore: 90,
      educationScore: 90,
      missingSkills: [],
      relevanceExplanation: 'Candidate matches 100% of skills needed and exceeds the experience threshold of 5+ years.'
    }
  });

  await Application.create({
    job: job2._id,
    candidate: cand2._id,
    status: 'Interview Scheduled',
    aiMatchScore: 88,
    aiAnalysis: {
      skillScore: 90,
      experienceScore: 85,
      educationScore: 95,
      missingSkills: ['SQL'],
      relevanceExplanation: 'Excellent candidate with solid AI/ML base. The candidate lacks SQL on their CV but has high experience in PyTorch and Python.'
    }
  });

  await Interview.create({
    recruiter: recruiter._id,
    candidate: cand2._id,
    job: job2._id,
    panelists: ['Dr. Alan Turing', 'Sarah Jenkins'],
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'Scheduled',
    meetingLink: 'https://meet.google.com/xvd-kjsq-opt',
    notes: 'Prepare deep-dive questions on recommendations and PyTorch model deploy pipelines.'
  });

  await Notification.create({
    recruiter: recruiter._id,
    title: 'New Application Received',
    message: 'Amit Patel applied for Full Stack Node.js Engineer.',
    type: 'info',
    read: false
  });

  console.log('In-memory database seeded successfully!');
}

module.exports = connectDB;
