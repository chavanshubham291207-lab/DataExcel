const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Company = require('../models/Company');
const Recruiter = require('../models/Recruiter');
const CandidateUser = require('../models/CandidateUser');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-recruiter';

// Array helpers
const randomElem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomElems = (arr, min = 1, max = 4) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing data
    console.log('Cleaning existing collections...');
    await Promise.all([
      Company.deleteMany({}),
      Recruiter.deleteMany({}),
      CandidateUser.deleteMany({}),
      Candidate.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Interview.deleteMany({})
    ]);
    console.log('Collections cleared.');

    // Single pre-hashed password for fast bulk insertion
    const hashedPassword = bcrypt.hashSync('Password123!', 10);

    // ─────────────────────────────────────────────────────────────
    // 1. COMPANIES DATA (105 Companies)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 105+ Companies...');
    const industries = ['IT Services', 'AI/ML', 'FinTech', 'Healthcare', 'E-commerce', 'Cyber Security', 'SaaS', 'EdTech', 'Cloud'];
    const locations = ['Bangalore, India', 'Hyderabad, India', 'Mumbai, India', 'Pune, India', 'Delhi NCR, India', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Remote', 'London, UK'];

    const companyPrefixes = ['Apex', 'Neural', 'Fin', 'Health', 'Cyber', 'Cloud', 'Byte', 'Omni', 'Quantum', 'Synthetix', 'Data', 'Nova', 'Pulse', 'Aether', 'Vortex', 'Hyper', 'Zenith', 'Nexus', 'Starlight', 'Inno', 'Velocity', 'Frontier', 'Aura', 'Cognitive', 'Scalable'];
    const companySuffixes = ['Systems', 'Labs', 'AI', 'Technologies', 'Networks', 'Solutions', 'Pay', 'Sec', 'Cloud', 'Data', 'Digital', 'Dynamics', 'Software', 'Platform', 'Global'];

    const companiesData = [];
    const usedCompanyNames = new Set();

    while (companiesData.length < 110) {
      const name = `${randomElem(companyPrefixes)} ${randomElem(companySuffixes)}`;
      if (usedCompanyNames.has(name)) continue;
      usedCompanyNames.add(name);

      const industry = randomElem(industries);
      const loc = randomElem(locations);
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');

      companiesData.push({
        companyName: name,
        industry: industry,
        location: loc,
        website: `https://www.${slug}.io`,
        description: `Leading ${industry} enterprise delivering next-generation digital solutions and AI-driven platforms across ${loc}.`
      });
    }

    const createdCompanies = await Company.insertMany(companiesData);
    console.log(`Created ${createdCompanies.length} companies.`);

    // ─────────────────────────────────────────────────────────────
    // 2. RECRUITER DATA (110 Recruiters)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 110+ Recruiters...');
    const firstNames = ['Sarah', 'Rahul', 'Anita', 'David', 'Priya', 'Michael', 'Vikram', 'Emily', 'Sanjay', 'Jessica', 'Amit', 'Rachel', 'Karan', 'Laura', 'Rohan', 'Jennifer', 'Dev', 'Alex', 'Neha', 'Daniel', 'Pooja', 'James', 'Kavita', 'Robert', 'Swati', 'William', 'Meera', 'Joseph', 'Ananya', 'Thomas', 'Divya'];
    const lastNames = ['Sharma', 'Jenkins', 'Verma', 'Smith', 'Gupta', 'Johnson', 'Patel', 'Williams', 'Singh', 'Brown', 'Kumar', 'Jones', 'Reddy', 'Miller', 'Nair', 'Davis', 'Rao', 'Wilson', 'Joshi', 'Anderson', 'Chawla', 'Taylor', 'Deshmukh', 'Thomas', 'Iyer'];
    const designations = ['HR Manager', 'Technical Recruiter', 'Talent Acquisition Specialist', 'Hiring Manager'];

    const recruitersData = [];
    // Seed standard demo recruiter account
    recruitersData.push({
      name: 'Sarah Jenkins',
      email: 'recruiter@example.com',
      password: hashedPassword,
      role: 'recruiter',
      companyName: createdCompanies[0].companyName,
      companyId: createdCompanies[0]._id,
      designation: 'Talent Acquisition Lead',
      companyWebsite: createdCompanies[0].website
    });

    for (let i = 1; i < 112; i++) {
      const fName = randomElem(firstNames);
      const lName = randomElem(lastNames);
      const company = createdCompanies[i % createdCompanies.length];
      const email = `recruiter.${fName.toLowerCase()}.${lName.toLowerCase()}${i}@${company.website.replace('https://www.', '')}`;

      recruitersData.push({
        name: `${fName} ${lName}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'recruiter',
        companyName: company.companyName,
        companyId: company._id,
        designation: randomElem(designations),
        companyWebsite: company.website
      });
    }

    const createdRecruiters = await Recruiter.insertMany(recruitersData);
    console.log(`Created ${createdRecruiters.length} recruiters.`);

    // ─────────────────────────────────────────────────────────────
    // 3. CANDIDATE DATA (1050 Candidates)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 1050+ Candidate Profiles...');

    const candidateSkillsPool = {
      frontend: ['React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Redux', 'TailwindCSS'],
      backend: ['Node.js', 'Express.js', 'Java', 'Spring Boot', 'Python', 'Django', 'REST APIs', 'GraphQL', 'Microservices'],
      database: ['MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Cassandra'],
      ai: ['Machine Learning', 'Python', 'TensorFlow', 'NLP', 'Data Science', 'PyTorch', 'Deep Learning'],
      cloud: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform']
    };

    const expTextMap = {
      0: 'Fresher',
      1: '1 year',
      2: '2 years',
      3: '3 years',
      5: '5+ years'
    };

    const educationPool = [
      'B.Tech in Computer Science',
      'M.Tech in Artificial Intelligence',
      'B.Sc in Information Technology',
      'MCA (Master of Computer Applications)',
      'B.E in Software Engineering'
    ];

    const candidateUsersData = [];
    const candidatesPipelineData = [];

    // Seed standard demo candidate account
    candidateUsersData.push({
      name: 'Akash Kumar',
      email: 'candidate@example.com',
      password: hashedPassword,
      role: 'candidate',
      phone: '+91 98765 43210',
      location: 'Bangalore, India',
      headline: 'Full Stack Developer | React & Node.js Specialist',
      summary: 'Passionate MERN Stack developer with 3 years of hands-on experience building modern, scalable web platforms.',
      jobRole: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'TypeScript'],
      totalExperience: 3,
      education: [{ degree: 'B.Tech', field: 'Computer Science', institution: 'VTU University', startYear: '2017', endYear: '2021' }],
      resumePath: '/uploads/resumes/sample_resume.pdf',
      atsScore: 88
    });

    candidatesPipelineData.push({
      recruiter: createdRecruiters[0]._id,
      name: 'Akash Kumar',
      email: 'candidate@example.com',
      phone: '+91 98765 43210',
      skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'TypeScript'],
      experience: 3,
      education: ['B.Tech in Computer Science'],
      summary: 'Passionate MERN Stack developer with 3 years of experience.',
      resumePath: '/uploads/resumes/sample_resume.pdf',
      atsScore: 88,
      status: 'Shortlisted'
    });

    for (let i = 1; i < 1055; i++) {
      const fName = randomElem(firstNames);
      const lName = randomElem(lastNames);
      const email = `candidate.${fName.toLowerCase()}.${lName.toLowerCase()}${i}@gmail.com`;
      const loc = randomElem(locations);
      const expYears = randomElem([0, 1, 2, 3, 5, 6, 8]);
      const expLabel = expTextMap[expYears] || `${expYears} years`;

      // Select domain skills
      const domainCategory = randomElem(['frontend', 'backend', 'database', 'ai', 'cloud']);
      const skills = [
        ...randomElems(candidateSkillsPool[domainCategory], 2, 4),
        ...randomElems(candidateSkillsPool.database, 1, 2),
        ...randomElems(candidateSkillsPool.frontend, 1, 2)
      ];
      const uniqueSkills = [...new Set(skills)];

      const jobRolesMap = {
        frontend: 'Frontend Developer',
        backend: 'Backend Engineer',
        database: 'Database Engineer',
        ai: 'AI/ML Engineer',
        cloud: 'DevOps / Cloud Engineer'
      };
      const mainRole = jobRolesMap[domainCategory];

      const userObj = {
        name: `${fName} ${lName}`,
        email: email,
        password: hashedPassword,
        role: 'candidate',
        phone: `+91 ${randomInt(90000, 99999)} ${randomInt(10000, 99999)}`,
        location: loc,
        headline: `${mainRole} | ${uniqueSkills.slice(0, 3).join(', ')}`,
        summary: `Experienced ${mainRole} with ${expLabel} of expertise in building enterprise solutions using ${uniqueSkills.slice(0, 4).join(', ')}.`,
        jobRole: mainRole,
        skills: uniqueSkills,
        totalExperience: expYears,
        education: [{ degree: randomElem(educationPool), field: 'Computer Science', institution: 'State University', startYear: '2016', endYear: '2020' }],
        resumePath: `/uploads/resumes/resume_sample_${(i % 10) + 1}.pdf`,
        atsScore: randomInt(65, 96)
      };

      candidateUsersData.push(userObj);

      // Create matching recruiter pipeline candidate
      candidatesPipelineData.push({
        recruiter: randomElem(createdRecruiters)._id,
        name: userObj.name,
        email: userObj.email,
        phone: userObj.phone,
        skills: uniqueSkills,
        experience: expYears,
        education: [randomElem(educationPool)],
        summary: userObj.summary,
        resumePath: userObj.resumePath,
        atsScore: userObj.atsScore,
        status: randomElem(['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'])
      });
    }

    const createdCandidateUsers = await CandidateUser.insertMany(candidateUsersData);
    const createdCandidates = await Candidate.insertMany(candidatesPipelineData);
    console.log(`Created ${createdCandidateUsers.length} candidate user accounts & ${createdCandidates.length} pipeline candidates.`);

    // ─────────────────────────────────────────────────────────────
    // 4. JOB DATA (1020 Jobs)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 1020+ Job Postings...');

    const jobDomainTemplates = [
      // Software Development
      { title: 'MERN Stack Developer', domain: 'Software Development', skills: ['MongoDB', 'Express.js', 'React', 'Node.js', 'JavaScript'], exp: '2-4 years' },
      { title: 'Full Stack Engineer', domain: 'Software Development', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], exp: '3-5 years' },
      { title: 'Backend Developer', domain: 'Software Development', skills: ['Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Redis'], exp: '2-5 years' },
      { title: 'Java Developer', domain: 'Software Development', skills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'Docker'], exp: '3-6 years' },
      { title: 'Python Developer', domain: 'Software Development', skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Docker'], exp: '2-5 years' },

      // AI / ML
      { title: 'AI Engineer', domain: 'AI', skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Machine Learning'], exp: '3-6 years' },
      { title: 'ML Engineer', domain: 'AI', skills: ['Machine Learning', 'Python', 'Scikit-learn', 'Data Science', 'AWS'], exp: '2-5 years' },
      { title: 'Data Scientist', domain: 'AI', skills: ['Python', 'Data Science', 'Machine Learning', 'SQL', 'NLP'], exp: '3-5 years' },
      { title: 'NLP Engineer', domain: 'AI', skills: ['Python', 'NLP', 'Deep Learning', 'PyTorch', 'Transformers'], exp: '3-7 years' },

      // Cyber Security
      { title: 'Security Analyst', domain: 'Cyber Security', skills: ['Cyber Security', 'Network Security', 'Linux', 'SIEM', 'Python'], exp: '2-4 years' },
      { title: 'SOC Engineer', domain: 'Cyber Security', skills: ['SOC', 'Cyber Security', 'Incident Response', 'Firewalls'], exp: '3-5 years' },
      { title: 'Ethical Hacker', domain: 'Cyber Security', skills: ['Penetration Testing', 'Cyber Security', 'Ethical Hacking', 'Linux'], exp: '3-6 years' },

      // Cloud & DevOps
      { title: 'DevOps Engineer', domain: 'Cloud', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'], exp: '3-6 years' },
      { title: 'Cloud Engineer', domain: 'Cloud', skills: ['AWS', 'Azure', 'Cloud Security', 'Docker', 'Python'], exp: '2-5 years' },

      // Mobile & UI
      { title: 'Android Developer', domain: 'Mobile', skills: ['Kotlin', 'Android SDK', 'Java', 'REST APIs'], exp: '2-5 years' },
      { title: 'Flutter Developer', domain: 'Mobile', skills: ['Flutter', 'Dart', 'Mobile Development', 'REST APIs'], exp: '2-4 years' },
      { title: 'UI/UX Designer', domain: 'Design', skills: ['Figma', 'UI/UX', 'Wireframing', 'Prototyping', 'CSS'], exp: '2-5 years' }
    ];

    const salaryList = [
      '₹12,00,000 - ₹18,00,000 / year',
      '₹18,00,000 - ₹25,00,000 / year',
      '₹25,00,000 - ₹35,00,000 / year',
      '$90,000 - $130,000 / year',
      '$120,000 - $160,000 / year',
      '₹8,00,000 - ₹14,00,000 / year'
    ];

    const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

    const jobsData = [];

    for (let i = 0; i < 1025; i++) {
      const template = randomElem(jobDomainTemplates);
      const recruiter = createdRecruiters[i % createdRecruiters.length];
      const company = createdCompanies[i % createdCompanies.length];
      const loc = randomElem(locations);
      const empType = randomElem(employmentTypes);
      const sal = randomElem(salaryList);

      jobsData.push({
        recruiter: recruiter._id,
        companyId: company._id,
        company: company.companyName,
        title: template.title,
        department: template.domain,
        location: loc,
        salaryRange: sal,
        salary: sal,
        employmentType: empType,
        jobType: empType,
        experience: template.exp,
        requiredSkills: template.skills,
        description: `We are looking for a skilled ${template.title} to join our engineering team at ${company.companyName}. You will build robust, high-performance services and innovate scalable tech architecture.`,
        responsibilities: [
          `Develop scalable ${template.title} features.`,
          `Collaborate with cross-functional software teams.`,
          `Optimize performance, security, and unit test coverage.`
        ],
        benefits: ['Flexible Working Hours', 'Health Insurance', 'Learning Stipend', 'Remote Work Options'],
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'Published',
        createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000)
      });
    }

    const createdJobs = await Job.insertMany(jobsData);
    console.log(`Created ${createdJobs.length} job postings.`);

    // ─────────────────────────────────────────────────────────────
    // 5. APPLICATION DATA (5120 Applications)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 5120+ Job Applications...');

    const statuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
    const applicationsData = [];
    const appPairSet = new Set();

    while (applicationsData.length < 5130) {
      const job = randomElem(createdJobs);
      const candidateUser = randomElem(createdCandidateUsers);
      const candidatePipeline = createdCandidates[applicationsData.length % createdCandidates.length];

      const pairKey = `${job._id}-${candidateUser._id}`;
      if (appPairSet.has(pairKey)) continue;
      appPairSet.add(pairKey);

      const status = randomElem(statuses);
      const appliedDate = new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000);
      const matchScore = randomInt(70, 98);

      applicationsData.push({
        job: job._id,
        jobId: job._id,
        recruiterId: job.recruiter,
        candidate: candidatePipeline._id,
        candidateId: candidateUser._id,
        candidateEmail: candidateUser.email,
        candidateName: candidateUser.name,
        status: status,
        appliedAt: appliedDate,
        appliedDate: appliedDate,
        aiMatchScore: matchScore,
        aiAnalysis: {
          skillScore: randomInt(75, 100),
          experienceScore: randomInt(70, 95),
          educationScore: randomInt(80, 100),
          missingSkills: ['Kubernetes', 'GraphQL'].slice(0, randomInt(0, 2)),
          relevanceExplanation: `Candidate demonstrates strong alignment (${matchScore}%) with job requirements in ${job.title}.`
        },
        statusHistory: [
          { status: 'Applied', changedAt: appliedDate, note: 'Application submitted.' },
          ...(status !== 'Applied' ? [{ status: status, changedAt: new Date(), note: `Updated to ${status}.` }] : [])
        ]
      });
    }

    const createdApplications = await Application.insertMany(applicationsData);
    console.log(`Created ${createdApplications.length} applications.`);

    // ─────────────────────────────────────────────────────────────
    // 6. INTERVIEW DATA (160 Interviews)
    // ─────────────────────────────────────────────────────────────
    console.log('Generating 160+ Scheduled Interviews...');

    // Select applications with status 'Interview Scheduled' or 'Selected' or 'Shortlisted'
    const interviewEligibleApps = createdApplications.filter(a =>
      a.status === 'Interview Scheduled' || a.status === 'Shortlisted' || a.status === 'Selected'
    );

    const interviewModes = ['Online', 'Offline', 'Video Call'];
    const interviewsData = [];

    for (let i = 0; i < Math.min(165, interviewEligibleApps.length); i++) {
      const app = interviewEligibleApps[i];
      const futureDays = randomInt(1, 14);
      const ivDateStr = new Date(Date.now() + futureDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const startHour = randomInt(10, 16);
      const startTimeStr = `${startHour}:00`;
      const endTimeStr = `${startHour + 1}:00`;
      const mode = randomElem(interviewModes);

      interviewsData.push({
        applicationId: app._id,
        recruiterId: app.recruiterId,
        recruiter: app.recruiterId,
        jobId: app.job,
        job: app.job,
        candidate: app.candidate,
        candidateEmail: app.candidateEmail,
        candidateName: app.candidateName,
        interviewDate: ivDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        time: `${startTimeStr} - ${endTimeStr}`,
        dateTime: new Date(`${ivDateStr}T${startTimeStr}`),
        mode: mode,
        meetingLink: mode !== 'Offline' ? `https://meet.google.com/test-iv-${i + 100}` : '',
        notes: `Technical & Domain evaluation round for candidate ${app.candidateName}.`,
        status: 'Scheduled'
      });
    }

    const createdInterviews = await Interview.insertMany(interviewsData);
    console.log(`Created ${createdInterviews.length} interviews.`);

    // ─────────────────────────────────────────────────────────────
    // 7. PRINT SUMMARY SUMMARY REPORT
    // ─────────────────────────────────────────────────────────────
    console.log('\n=============================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log(`Companies created: ${createdCompanies.length}`);
    console.log(`Recruiters created: ${createdRecruiters.length}`);
    console.log(`Candidates created: ${createdCandidateUsers.length}`);
    console.log(`Jobs created: ${createdJobs.length}`);
    console.log(`Applications created: ${createdApplications.length}`);
    console.log(`Interviews created: ${createdInterviews.length}`);
    console.log('=============================================\n');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('Error during seeding database:', err);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err;
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
