const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Candidate = require('./models/Candidate');
const Recruiter = require('./models/Recruiter');

dotenv.config();

const seed100 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    let recruiter = await Recruiter.findOne({});
    if (!recruiter) {
      console.log('No recruiter found');
      process.exit(1);
    }

    const rawData = fs.readFileSync(path.join(__dirname, '../candidates_100.json'), 'utf-8');
    const candidatesList = JSON.parse(rawData);

    let added = 0;
    for (let c of candidatesList) {
      const existing = await Candidate.findOne({ email: c.email });
      if (!existing) {
        await Candidate.create({
          recruiter: recruiter._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          skills: c.skills,
          experience: c.experience,
          education: [c.education],
          summary: c.summary,
          atsScore: Math.floor(Math.random() * 35) + 65,
          tags: [c.jobRole, c.location],
          status: 'Applied'
        });
        added++;
      }
    }
    console.log(`Successfully inserted ${added} new candidates into MongoDB!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed100();
