const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CandidateUser = require('./models/CandidateUser');

dotenv.config();

const seedCandidates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const demos = [
      {
        name: 'Arjun Mehta',
        email: 'candidate@example.com',
        password: 'password123',
        phone: '+91 98765 43210',
        location: 'Bengaluru',
        headline: 'Senior Full Stack Developer | React + Node.js | 5 Years Experience',
        summary: 'Passionate full-stack developer with 5 years of experience building scalable web applications. Proficient in React, Node.js, MongoDB, and cloud platforms.',
        jobRole: 'Full Stack Developer',
        skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'AWS', 'Docker', 'PostgreSQL'],
        totalExperience: 5,
        expectedCTC: '18 LPA',
        preferredLocation: 'Bengaluru',
        noticePeriod: '30 Days',
        linkedin: 'https://linkedin.com/in/arjunmehta',
        github: 'https://github.com/arjunmehta',
        education: [{
          degree: 'B.Tech',
          field: 'Computer Science',
          institution: 'BITS Pilani',
          startYear: '2015',
          endYear: '2019',
          grade: '8.4 CGPA'
        }],
        workExperience: [{
          title: 'Senior Software Engineer',
          company: 'Infosys',
          location: 'Bengaluru',
          startDate: '2021-06',
          endDate: '',
          current: true,
          description: 'Building microservices and React dashboards for enterprise clients.'
        }],
        atsScore: 82
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'password123',
        phone: '+91 87654 32109',
        location: 'Mumbai',
        headline: 'AI/ML Engineer | Python | TensorFlow | 3 Years',
        summary: 'AI/ML engineer specializing in deep learning, NLP, and computer vision. Strong background in Python, TensorFlow, and PyTorch.',
        jobRole: 'AI/ML Engineer',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NLP', 'Docker', 'AWS'],
        totalExperience: 3,
        expectedCTC: '22 LPA',
        preferredLocation: 'Mumbai',
        noticePeriod: '45 Days',
        linkedin: 'https://linkedin.com/in/priyasharma',
        github: 'https://github.com/priyasharma',
        education: [{
          degree: 'M.Tech',
          field: 'Artificial Intelligence',
          institution: 'IIT Bombay',
          startYear: '2019',
          endYear: '2021',
          grade: '9.1 CGPA'
        }],
        workExperience: [{
          title: 'ML Engineer',
          company: 'Wipro AI Labs',
          location: 'Mumbai',
          startDate: '2021-08',
          endDate: '',
          current: true,
          description: 'Developing NLP models and recommendation systems for enterprise clients.'
        }],
        atsScore: 78
      }
    ];

    for (const demo of demos) {
      const exists = await CandidateUser.findOne({ email: demo.email });
      if (!exists) {
        await CandidateUser.create(demo);
        console.log(`Created: ${demo.email}`);
      } else {
        console.log(`Skipped (exists): ${demo.email}`);
      }
    }

    console.log('\nDemo credentials:');
    console.log('  candidate@example.com / password123');
    console.log('  priya@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seedCandidates();
