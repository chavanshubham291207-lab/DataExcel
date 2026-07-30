const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { processVoiceGenieAgent } = require('./services/ai-agent.service');
const CandidateUser = require('./models/CandidateUser');
const Conversation = require('./models/Conversation');

async function test() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/recruiter-dashboard';
  await mongoose.connect(mongoUri);

  // Load a test candidate user
  const user = await CandidateUser.findOne({});
  if (!user) {
    console.error('No candidate user found in database!');
    process.exit(1);
  }
  console.log('Testing Planner with User:', user.name);

  // Clear previous conversation to start fresh
  await Conversation.deleteOne({ userId: user._id });

  const testInputs = [
    "Hi",
    "Explain React",
    "Find React jobs",
    "Only Pune",
    "Schedule interview",
    "Generate interview questions",
    "Find AI candidates and rank shortlisted"
  ];

  for (const input of testInputs) {
    console.log(`\n=================== INPUT: "${input}" ===================`);
    const start = Date.now();
    const result = await processVoiceGenieAgent({
      message: input,
      user: user,
      role: 'candidate'
    });
    const end = Date.now();
    console.log('Time Taken:', end - start, 'ms');
  }

  process.exit(0);
}

test().catch(console.error);
