const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Recruiter = require('./models/Recruiter');
const Job = require('./models/Job');
const Candidate = require('./models/Candidate');
const CandidateUser = require('./models/CandidateUser');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/recruiter-dashboard';

// --- SEED SECTIONS ---

const RECRUITER_COMPANIES = [
  { name: 'Apex AI Systems', industry: 'Artificial Intelligence', location: 'Pune', size: '200-500' },
  { name: 'CloudScale Technologies', industry: 'Cloud & DevOps', location: 'Bangalore', size: '500-1000' },
  { name: 'CyberShield InfoSec', industry: 'Cybersecurity', location: 'Mumbai', size: '100-250' },
  { name: 'FinTech Pulse', industry: 'Financial Technology', location: 'Hyderabad', size: '1000+' },
  { name: 'DataMind Analytics', industry: 'Data Science & Big Data', location: 'Pune', size: '50-200' },
  { name: 'NextGen Mobile Labs', industry: 'Mobile App Development', location: 'Delhi NCR', size: '100-250' },
  { name: 'OmniStack Digital', industry: 'Full Stack Web Solutions', location: 'Bangalore', size: '250-500' },
  { name: 'Visionary UI Studios', industry: 'UI/UX & Product Design', location: 'Mumbai', size: '50-100' },
  { name: 'Quantum Byte Solutions', industry: 'Enterprise Software', location: 'Hyderabad', size: '500-1000' },
  { name: 'SmartAutomate Systems', industry: 'QA & Automation Testing', location: 'Pune', size: '100-250' },
  { name: 'HyperVelocity Cloud', industry: 'Cloud Infrastructure', location: 'Bangalore', size: '1000+' },
  { name: 'CodeCraft India', industry: 'Software Consulting', location: 'Delhi NCR', size: '250-500' },
  { name: 'InnoTech Ventures', industry: 'Product Incubator', location: 'Mumbai', size: '50-100' },
  { name: 'LogicWave Systems', industry: 'Embedded Systems & IoT', location: 'Pune', size: '100-250' },
  { name: 'Zenith Talent Hub', industry: 'HR Tech Solutions', location: 'Remote', size: '200-500' }
];

const JOB_TITLES_DATA = [
  { title: 'Senior React Developer', domain: 'Frontend Developer', skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Tailwind'], exp: '3+ years', loc: 'Pune' },
  { title: 'Frontend Engineer (React & Next.js)', domain: 'Frontend Developer', skills: ['React', 'Next.js', 'HTML5', 'CSS3', 'Tailwind'], exp: '2+ years', loc: 'Bangalore' },
  { title: 'UI Architect (React & Web Performance)', domain: 'Frontend Developer', skills: ['React', 'TypeScript', 'Webpack', 'Performance Optimization'], exp: '5+ years', loc: 'Mumbai' },
  { title: 'Junior React Developer', domain: 'Frontend Developer', skills: ['React', 'JavaScript', 'CSS3', 'Git'], exp: 'Fresher', loc: 'Pune' },

  { title: 'Node.js Backend Developer', domain: 'Backend Developer', skills: ['Node.js', 'Express', 'MongoDB', 'REST API', 'JWT'], exp: '3+ years', loc: 'Pune' },
  { title: 'Senior Node.js & Microservices Engineer', domain: 'Backend Developer', skills: ['Node.js', 'Express', 'Redis', 'Docker', 'PostgreSQL'], exp: '5+ years', loc: 'Hyderabad' },
  { title: 'Backend Software Engineer (Node.js)', domain: 'Backend Developer', skills: ['Node.js', 'MongoDB', 'Express', 'GraphQL'], exp: '2+ years', loc: 'Bangalore' },
  { title: 'Node.js API Specialist', domain: 'Backend Developer', skills: ['Node.js', 'Fastify', 'SQL', 'MongoDB'], exp: '1+ years', loc: 'Remote' },

  { title: 'Full Stack MERN Developer', domain: 'Full Stack Developer', skills: ['MongoDB', 'Express', 'React', 'Node.js', 'Tailwind'], exp: '3+ years', loc: 'Pune' },
  { title: 'Senior Full Stack Engineer (React + Node)', domain: 'Full Stack Developer', skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'], exp: '5+ years', loc: 'Mumbai' },
  { title: 'Full Stack Web Developer', domain: 'Full Stack Developer', skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'], exp: '2+ years', loc: 'Delhi' },
  { title: 'Full Stack Developer (Fresher)', domain: 'Full Stack Developer', skills: ['React', 'Node.js', 'JavaScript', 'HTML/CSS'], exp: 'Fresher', loc: 'Pune' },

  { title: 'Java Spring Boot Developer', domain: 'Java Developer', skills: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'REST'], exp: '3+ years', loc: 'Hyderabad' },
  { title: 'Senior Java Enterprise Architect', domain: 'Java Developer', skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Docker'], exp: '5+ years', loc: 'Bangalore' },
  { title: 'Core Java Engineer', domain: 'Java Developer', skills: ['Java', 'Multithreading', 'SQL', 'Spring'], exp: '2+ years', loc: 'Pune' },

  { title: 'Python Backend Developer', domain: 'Python Developer', skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL'], exp: '3+ years', loc: 'Pune' },
  { title: 'Senior Python & FastAPI Engineer', domain: 'Python Developer', skills: ['Python', 'FastAPI', 'AsyncIO', 'Docker', 'Redis'], exp: '5+ years', loc: 'Remote' },
  { title: 'Python Developer (Automation & Web)', domain: 'Python Developer', skills: ['Python', 'Flask', 'SQL', 'Scrapy'], exp: '1+ years', loc: 'Mumbai' },

  { title: 'AI & Generative AI Engineer', domain: 'AI Engineer', skills: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'Gemini API'], exp: '3+ years', loc: 'Bangalore' },
  { title: 'Senior AI Agent Architect', domain: 'AI Engineer', skills: ['Python', 'TensorFlow', 'LLMs', 'Vector Databases', 'Docker'], exp: '5+ years', loc: 'Pune' },

  { title: 'Machine Learning Engineer', domain: 'ML Engineer', skills: ['Python', 'Scikit-Learn', 'Pandas', 'NumPy', 'TensorFlow'], exp: '2+ years', loc: 'Hyderabad' },
  { title: 'Lead ML Ops Specialist', domain: 'ML Engineer', skills: ['Python', 'MLflow', 'Kubeflow', 'AWS', 'Docker'], exp: '5+ years', loc: 'Bangalore' },

  { title: 'Data Scientist', domain: 'Data Scientist', skills: ['Python', 'SQL', 'R', 'Power BI', 'Statistical Modeling'], exp: '3+ years', loc: 'Pune' },
  { title: 'Senior Data Analytics Engineer', domain: 'Data Scientist', skills: ['Python', 'SQL', 'Spark', 'Tableau', 'BigQuery'], exp: '5+ years', loc: 'Delhi' },

  { title: 'DevOps & CI/CD Engineer', domain: 'DevOps Engineer', skills: ['Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'GitLab CI'], exp: '3+ years', loc: 'Bangalore' },
  { title: 'Senior Cloud DevOps Specialist', domain: 'DevOps Engineer', skills: ['AWS', 'Kubernetes', 'Ansible', 'Prometheus', 'Bash'], exp: '5+ years', loc: 'Pune' },

  { title: 'AWS Cloud Solutions Architect', domain: 'Cloud Engineer', skills: ['AWS', 'EC2', 'S3', 'Lambda', 'Terraform', 'CloudWatch'], exp: '5+ years', loc: 'Hyderabad' },
  { title: 'Azure Cloud Infrastructure Engineer', domain: 'Cloud Engineer', skills: ['Azure', 'ARM Templates', 'Docker', 'PowerShell'], exp: '3+ years', loc: 'Mumbai' },

  { title: 'UI/UX Product Designer', domain: 'UI UX Designer', skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'], exp: '2+ years', loc: 'Pune' },
  { title: 'Lead UI/UX Visual Designer', domain: 'UI UX Designer', skills: ['Figma', 'Adobe XD', 'Micro-interactions', 'Design Systems'], exp: '5+ years', loc: 'Bangalore' },

  { title: 'Flutter Mobile App Developer', domain: 'Flutter Developer', skills: ['Flutter', 'Dart', 'State Management', 'REST API', 'Firebase'], exp: '2+ years', loc: 'Remote' },
  { title: 'Android Native Developer', domain: 'Android Developer', skills: ['Kotlin', 'Java', 'Android SDK', 'Jetpack Compose'], exp: '3+ years', loc: 'Pune' },

  { title: 'Cyber Security Analyst', domain: 'Cyber Security', skills: ['Penetration Testing', 'SIEM', 'Network Security', 'Wireshark'], exp: '3+ years', loc: 'Mumbai' },
  { title: 'QA Automation Engineer (Selenium)', domain: 'QA Engineer', skills: ['Java', 'Selenium', 'TestNG', 'Cucumber', 'Jira'], exp: '2+ years', loc: 'Pune' },
  { title: 'Business Analyst (IT & SaaS)', domain: 'Business Analyst', skills: ['Requirements Gathering', 'UML', 'SQL', 'Jira', 'Agile'], exp: '3+ years', loc: 'Hyderabad' },
  { title: 'Technical Product Manager', domain: 'Product Manager', skills: ['Product Roadmap', 'Agile', 'User Stories', 'KPI Tracking'], exp: '5+ years', loc: 'Bangalore' }
];

const FIRST_NAMES = ['Aarav', 'Ananya', 'Rohan', 'Pooja', 'Vikram', 'Neha', 'Aditya', 'Sneha', 'Rahul', 'Kavya', 'Siddharth', 'Isha', 'Amit', 'Priya', 'Rajesh', 'Shweta', 'Manish', 'Ritu', 'Gaurav', 'Tanvi', 'Karan', 'Meera', 'Deepak', 'Divya', 'Suresh', 'Simran', 'Akash', 'Swati', 'Tarun', 'Archana'];
const LAST_NAMES = ['Sharma', 'Deshmukh', 'Mehta', 'Patil', 'Verma', 'Kulkarni', 'Joshi', 'Chawla', 'Nair', 'Gupta', 'Singh', 'Rao', 'Bhat', 'Saxena', 'Trivedi', 'Hegde', 'Chaudhary', 'Iyer', 'Agarwal', 'Reddy'];

const CITIES_LIST = ['Pune', 'Mumbai', 'Bangalore', 'Hyderabad', 'Delhi NCR', 'Remote'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// --- SEEDER FUNCTION ---

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Seeding...');

    const isClearOnly = process.argv.includes('--clear');

    if (isClearOnly) {
      console.log('Clearing all demo data...');
      await Recruiter.deleteMany({});
      await Job.deleteMany({});
      await Candidate.deleteMany({});
      await CandidateUser.deleteMany({});
      console.log('Successfully cleared all demo data from MongoDB!');
      process.exit(0);
    }

    // Clean existing records before fresh seed
    await Recruiter.deleteMany({});
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await CandidateUser.deleteMany({});

    console.log('Generating 15 Recruiters...');
    const recruiters = [];
    for (let i = 0; i < RECRUITER_COMPANIES.length; i++) {
      const comp = RECRUITER_COMPANIES[i];
      const firstName = getRandomItem(FIRST_NAMES);
      const lastName = getRandomItem(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `recruiter_${i + 1}@${comp.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;

      const recruiter = await Recruiter.create({
        name,
        email: i === 0 ? 'recruiter@example.com' : email, // Keep default login working
        password: 'password123',
        companyName: comp.name,
        companyWebsite: `https://www.${comp.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        role: 'recruiter'
      });
      recruiters.push(recruiter);
    }
    console.log(`Created ${recruiters.length} Recruiters.`);

    console.log('Generating 60+ Jobs...');
    const jobs = [];
    for (let i = 0; i < 65; i++) {
      const jobData = JOB_TITLES_DATA[i % JOB_TITLES_DATA.length];
      const recruiter = getRandomItem(recruiters);
      const expYears = jobData.exp;
      const salary = `${Math.floor(Math.random() * 12 + 6)} - ${Math.floor(Math.random() * 15 + 18)} LPA`;

      const job = await Job.create({
        recruiter: recruiter._id,
        title: `${jobData.title} ${i > 35 ? '(Hiring Urgently)' : ''}`,
        company: recruiter.companyName,
        department: jobData.domain,
        location: jobData.loc,
        salaryRange: salary,
        employmentType: jobData.loc === 'Remote' ? 'Remote' : 'Full-time',
        experience: expYears,
        requiredSkills: jobData.skills,
        education: 'Bachelor of Technology / Computer Science / MCA',
        description: `We are actively hiring a talented ${jobData.title} to join our high-performance engineering team at ${recruiter.companyName}. You will drive technical architecture, build scalable features, and collaborate in agile sprints.`,
        responsibilities: [
          `Design and implement robust software solutions using ${jobData.skills.slice(0, 2).join(' and ')}.`,
          'Write clean, maintainable, and well-tested codebase following SOLID principles.',
          'Collaborate with product managers and UI/UX designers to deliver high quality user experiences.'
        ],
        benefits: ['Health Insurance', 'Performance Bonus', 'Flexible Working Hours', 'Learning Allowance'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Published'
      });
      jobs.push(job);
    }
    console.log(`Created ${jobs.length} Jobs.`);

    console.log('Generating 150+ Realistic Candidates...');
    const candidateDocs = [];
    const candidateUserDocs = [];

    for (let i = 0; i < 155; i++) {
      const firstName = getRandomItem(FIRST_NAMES);
      const lastName = getRandomItem(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const uniqueSuffix = `${i + 1}_${Math.floor(Math.random() * 8999 + 1000)}`;
      const email = i === 0 ? 'candidate@example.com' : `candidate_${uniqueSuffix}@example.com`;
      const city = getRandomItem(CITIES_LIST);
      const recruiter = getRandomItem(recruiters);
      const expYears = Math.floor(Math.random() * 8 + 1);

      const sampleJob = JOB_TITLES_DATA[i % JOB_TITLES_DATA.length];
      const skills = sampleJob.skills;
      const atsScore = Math.floor(Math.random() * 30 + 70); // 70-99 ATS Score

      candidateDocs.push({
        recruiter: recruiter._id,
        name,
        email,
        phone: `+91 98${Math.floor(Math.random() * 8999998 + 1000000)}`,
        skills,
        experience: expYears,
        education: ['B.Tech Computer Science - Pune University'],
        projects: [`${skills[0]} E-Commerce Platform`, 'AI Dashboard System'],
        certifications: [`${skills[0]} Certified Professional`, 'AWS Cloud Practitioner'],
        summary: `Experienced ${sampleJob.domain} with ${expYears} years in building scalable software systems. Skilled in ${skills.join(', ')}.`,
        atsScore,
        status: getRandomItem(['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired'])
      });

      candidateUserDocs.push({
        name,
        email,
        password: 'password123',
        role: 'candidate',
        phone: `+91 98${Math.floor(Math.random() * 8999998 + 1000000)}`,
        location: city,
        headline: `${sampleJob.domain} (${expYears} Yrs Exp)`,
        summary: `Passionate ${sampleJob.domain} specializing in ${skills.slice(0, 3).join(', ')}.`,
        jobRole: sampleJob.domain,
        skills,
        totalExperience: expYears,
        atsScore,
        expectedCTC: `${expYears * 3 + 5} LPA`,
        preferredLocation: city,
        noticePeriod: '30 Days',
        linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '')}`,
        github: `https://github.com/${name.toLowerCase().replace(/\s+/g, '')}`
      });
    }

    const insertedCandidates = await Candidate.insertMany(candidateDocs);
    const insertedUsers = await CandidateUser.insertMany(candidateUserDocs);

    console.log(`Created ${insertedCandidates.length} Pipeline Candidates and ${insertedUsers.length} Candidate User accounts.`);
    console.log('\n✅ Demo Data Seeding Completed Successfully!');
    console.log(`Total Recruiters: ${recruiters.length}`);
    console.log(`Total Jobs: ${jobs.length}`);
    console.log(`Total Candidates: ${insertedCandidates.length}`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error Seeding Data:', err);
    process.exit(1);
  }
}

seedData();
