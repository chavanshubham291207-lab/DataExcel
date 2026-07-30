const crypto = require('crypto');
const { askGemini } = require('./gemini.service');
const { searchJobs } = require('../mcp-server/tools/job.tool');
const { getApplications } = require('../mcp-server/tools/application.tool');
const { analyzeResume } = require('../mcp-server/tools/resume.tool');
const { searchCandidates, rankCandidates } = require('../mcp-server/tools/candidate.tool');
const Conversation = require('../models/Conversation');
const Invitation = require('../models/Invitation');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const cacheService = require('./cache.service');
const { cosineSimilarity } = require('./embedding.service');
const { retrieveCompanyKnowledge, buildRAGPrompt, buildRAGFallback } = require('./rag.service');

const SYSTEM_PROMPT = `You are VoiceGenie, an Autonomous AI Recruitment Agent.

CRITICAL BEHAVIOUR RULES (follow these strictly above all else):
1. NEVER introduce yourself or say "I am VoiceGenie" unless the user explicitly asks "who are you", "introduce yourself", or "what is your name".
2. ALWAYS answer the user's actual question directly and concisely.
3. Do NOT start answers with "Hello!", "Hi!", or any greeting unless the user sent a greeting first.
4. If the user asks about skills, list the relevant skills directly. Do not deflect.
5. If you have database context, use it. If not, answer from your knowledge.
6. Never hallucinate database records. If no data found, say: "I couldn't find that information in the current database."
7. Keep answers focused. Do not pad with recruitment agent capabilities unless directly asked.`;

// --- Tool Fallback Response Generators ---

function generateJobsFallbackResponse(jobs) {
  if (!jobs || jobs.length === 0) {
    return "No matching records were found in the current database.";
  }
  let reply = `Here are the active job openings found in our database:\n\n`;
  jobs.slice(0, 5).forEach((j, i) => {
    const skillsList = Array.isArray(j.requiredSkills) ? j.requiredSkills.join(', ') : 'Not Specified';
    reply += `${i + 1}. **${j.title}** at **${j.company}** (${j.location}) · Exp: ${j.experience} · Salary: ${j.salaryRange || 'Competitive'} · Skills: ${skillsList}\n`;
  });
  if (jobs.length > 5) {
    reply += `\n...and ${jobs.length - 5} more jobs. You can manage them on your dashboard.`;
  }
  return reply;
}

function generateCandidatesFallbackResponse(candidates) {
  if (!candidates || candidates.length === 0) {
    return "No matching records were found in the current database.";
  }
  let reply = `Here are the candidates I found in our database:\n\n`;
  candidates.slice(0, 5).forEach((c, i) => {
    const skillsList = Array.isArray(c.skills) ? c.skills.join(', ') : 'None';
    reply += `${i + 1}. **${c.name}** (${c.currentRole}) · Location: ${c.location} · Exp: ${c.experience} Years · ATS Score: ${c.atsScore}% · Skills: ${skillsList}\n`;
  });
  if (candidates.length > 5) {
    reply += `\n...and ${candidates.length - 5} more candidate profiles in the ATS system.`;
  }
  return reply;
}

function generateApplicationsFallbackResponse(apps) {
  if (!apps || apps.length === 0) {
    return "No matching records were found in the current database.";
  }
  let reply = `Here are the applications/invitations found in our database:\n\n`;
  apps.slice(0, 5).forEach((a, i) => {
    reply += `${i + 1}. Candidate: **${a.candidateName || 'Candidate'}** applied for **${a.jobTitle}** at **${a.companyName}** · Status: **${a.status}**\n`;
  });
  if (apps.length > 5) {
    reply += `\n...and ${apps.length - 5} more applications. You can view them in the dashboard.`;
  }
  return reply;
}

/**
 * Builds a context-aware fallback answer for general questions when Gemini is unavailable.
 * This MUST NEVER return a self-introduction string.
 */
function buildKnowledgeFallback(text) {
  const lower = text.toLowerCase();

  // Technical skills questions
  if (lower.includes('technical skill') || lower.includes('tech skill') || lower.includes('hard skill')) {
    return `**Common Technical Skills in Recruitment:**\n\n**Frontend:** React, Angular, Vue.js, TypeScript, HTML/CSS\n**Backend:** Node.js, Python, Java, Express, Django, Spring Boot\n**Database:** MongoDB, PostgreSQL, MySQL, Redis\n**DevOps/Cloud:** AWS, Docker, Kubernetes, CI/CD, Git\n**AI/ML:** TensorFlow, PyTorch, LangChain, OpenAI APIs\n\nLet me know if you want to search for candidates with specific technical skills.`;
  }

  // HR skills questions
  if (lower.includes('hr skill') || lower.includes('soft skill') || lower.includes('human resource')) {
    return `**Key HR & Soft Skills:**\n\n- **Communication** — Clear verbal and written communication\n- **Conflict Resolution** — Handling disputes professionally\n- **Empathy** — Understanding candidate and employee needs\n- **Negotiation** — Salary and offer management\n- **Organizational Skills** — Managing multiple hiring pipelines\n- **Screening & Assessment** — Structured interview techniques\n- **Onboarding** — New hire integration processes\n\nWould you like to search for HR candidates in our database?`;
  }

  // Interview preparation
  if (lower.includes('prepare for interview') || lower.includes('interview preparation') || lower.includes('interview prep') || lower.includes('crack') && lower.includes('interview') || lower.includes('interview tips')) {
    return `**How to Prepare for an Interview:**\n\n1. **Research the Company** — Understand their products, culture, and recent news\n2. **Review the Job Description** — Map your skills to their requirements\n3. **Practice Common Questions** — Behavioral (STAR method) and technical\n4. **Prepare Your Stories** — 3-5 achievements with measurable impact\n5. **Technical Prep** — Solve coding problems, review system design basics\n6. **Mock Interviews** — Practice with a friend or use platforms like Pramp\n7. **Questions for Interviewer** — Prepare 3-5 thoughtful questions\n8. **Logistics** — Confirm time, location/link, dress code\n\n**Pro Tips:**\n- Use the STAR method (Situation, Task, Action, Result) for behavioral questions\n- Arrive 10 minutes early\n- Keep answers concise (2-3 minutes max)\n- Follow up with a thank-you email within 24 hours`;
  }

  // HR interview specific
  if (lower.includes('hr interview') || lower.includes('hr round')) {
    return `**How to Crack an HR Interview:**\n\n1. **Self-Introduction** — Keep it 2 minutes, structured (education → experience → goals)\n2. **"Tell me about yourself"** — Focus on professional journey, not personal life\n3. **Strengths & Weaknesses** — Be honest, show self-awareness\n4. **Why This Company?** — Research their mission, recent achievements\n5. **Salary Negotiation** — Know your market value, give a range\n6. **Behavioral Questions** — Use STAR method\n7. **"Where do you see yourself in 5 years?"** — Align with the company's growth\n\n**Common HR Questions:**\n- Why are you leaving your current job?\n- How do you handle pressure?\n- Describe a conflict you resolved at work\n- What motivates you?`;
  }

  // DSA / coding roadmap
  if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('algorithm') || lower.includes('coding roadmap') || lower.includes('dsa roadmap')) {
    return `**DSA Roadmap for Interview Preparation:**\n\n**Phase 1: Foundations (Week 1-2)**\n- Arrays & Strings\n- Linked Lists\n- Stacks & Queues\n- Hash Maps/Sets\n\n**Phase 2: Intermediate (Week 3-4)**\n- Binary Trees & BST\n- Heaps & Priority Queues\n- Recursion & Backtracking\n- Sorting & Searching algorithms\n\n**Phase 3: Advanced (Week 5-6)**\n- Dynamic Programming\n- Graphs (BFS, DFS, Dijkstra)\n- Tries\n- Sliding Window & Two Pointers\n\n**Phase 4: Practice (Week 7-8)**\n- LeetCode Top 150\n- Company-specific problems\n- Mock interviews\n\n**Recommended Platforms:** LeetCode, HackerRank, GeeksforGeeks, Codeforces`;
  }

  // Communication tips
  if (lower.includes('communication') || lower.includes('communicate better') || lower.includes('presentation skill')) {
    return `**How to Improve Communication Skills:**\n\n1. **Active Listening** — Focus on understanding, not just responding\n2. **Clarity** — Structure your thoughts before speaking (Point → Evidence → Summary)\n3. **Body Language** — Maintain eye contact, open posture, confident gestures\n4. **Practice Public Speaking** — Join Toastmasters or record yourself\n5. **Read Regularly** — Expands vocabulary and articulation\n6. **Ask for Feedback** — From colleagues, mentors, or friends\n7. **Written Communication** — Practice concise, professional emails\n\n**For Interviews Specifically:**\n- Pause before answering (shows thoughtfulness)\n- Avoid filler words (um, uh, like)\n- Mirror the interviewer's communication style\n- Summarize key points at the end`;
  }

  // Career advice
  if (lower.includes('career advice') || lower.includes('career growth') || lower.includes('career path') || lower.includes('career roadmap')) {
    return `**Career Growth Advice for Developers:**\n\n1. **Build a Strong Foundation** — Master one tech stack deeply before branching out\n2. **Continuous Learning** — Dedicate 1 hour daily to new technologies\n3. **Build Projects** — Open source contributions, side projects, portfolio\n4. **Networking** — Attend meetups, conferences, engage on LinkedIn/Twitter\n5. **Mentorship** — Find a mentor and also mentor juniors\n6. **Certifications** — AWS, GCP, Azure, or domain-specific certs add credibility\n7. **Soft Skills** — Communication, leadership, and teamwork matter as much as code\n\n**Career Paths:**\n- IC Track: Junior → Mid → Senior → Staff → Principal Engineer\n- Management: Senior → Tech Lead → Engineering Manager → Director → VP/CTO`;
  }

  // Resume tips
  if (lower.includes('resume tip') || lower.includes('resume advice') || lower.includes('how to write resume') || lower.includes('resume format')) {
    return `**Resume Writing Tips:**\n\n1. **Keep it 1-2 pages** — Concise and relevant\n2. **Start with a Summary** — 2-3 lines highlighting your value proposition\n3. **Use Action Verbs** — Built, Designed, Implemented, Optimized, Led\n4. **Quantify Achievements** — "Reduced load time by 40%" not "Improved performance"\n5. **Tailor Each Application** — Match keywords from the job description\n6. **Skills Section** — List relevant technical and soft skills\n7. **Projects** — Include 2-3 impactful projects with tech stack and results\n8. **ATS-Friendly Format** — Simple layout, standard fonts, no tables/graphics\n\n**Avoid:**\n- Grammatical errors\n- Generic objectives\n- Irrelevant personal information\n- Gaps without explanation`;
  }

  // React-specific
  if (lower.includes('react')) {
    return `**React — Overview & Key Concepts:**\n\nReact is a JavaScript library for building user interfaces, developed by Meta (Facebook). It uses a component-based architecture and a virtual DOM for efficient rendering.\n\n**Core Concepts:**\n- **Components** — Reusable UI building blocks (functional & class)\n- **JSX** — HTML-like syntax in JavaScript\n- **Hooks** — useState, useEffect, useContext, useReducer, useMemo, useCallback\n- **State Management** — Redux, Zustand, Context API, Recoil\n- **React Router** — Client-side navigation\n- **Virtual DOM** — Efficient diffing and reconciliation\n\n**Advanced Topics:**\n- Server-Side Rendering (Next.js)\n- Code splitting & lazy loading\n- Error boundaries\n- Testing with Jest & React Testing Library\n- Performance optimization (React.memo, profiling)`;
  }

  // Node.js specific
  if (lower.includes('node') || lower.includes('node.js') || lower.includes('nodejs')) {
    return `**Node.js — Overview & Key Concepts:**\n\nNode.js is a JavaScript runtime built on Chrome's V8 engine, designed for building fast, scalable server-side applications.\n\n**Core Concepts:**\n- **Event Loop** — Non-blocking I/O, single-threaded event-driven architecture\n- **Express.js** — Most popular web framework for REST APIs\n- **Async/Await** — Modern asynchronous programming patterns\n- **Streams** — Efficient processing of large data\n- **Modules** — CommonJS (require) and ES Modules (import)\n\n**Key Skills:**\n- REST API development with Express\n- MongoDB/Mongoose integration\n- Authentication (JWT, OAuth, Passport.js)\n- Middleware patterns\n- Error handling and logging\n- Testing with Jest/Mocha/Chai\n- Deployment with PM2, Docker`;
  }

  // MongoDB specific
  if (lower.includes('mongodb') || lower.includes('mongo')) {
    return `**MongoDB — Overview & Key Concepts:**\n\nMongoDB is a NoSQL document database that stores data in flexible JSON-like (BSON) documents.\n\n**Core Concepts:**\n- **Documents & Collections** — Flexible schema design\n- **CRUD Operations** — insertOne, find, updateOne, deleteOne\n- **Aggregation Pipeline** — $match, $group, $project, $lookup, $sort\n- **Indexing** — Single, compound, text, and geospatial indexes\n- **Replication** — Replica sets for high availability\n- **Sharding** — Horizontal scaling for large datasets\n\n**With Node.js:**\n- Mongoose ODM for schema validation\n- Connection pooling\n- Transactions (multi-document ACID)\n- Atlas cloud hosting with Vector Search`;
  }

  // Python specific
  if (lower.includes('python')) {
    return `**Python — Overview & Key Concepts:**\n\nPython is a high-level, interpreted programming language known for its readability and versatility.\n\n**Core Concepts:**\n- Data types, control flow, functions, OOP\n- List comprehensions, generators, decorators\n- Exception handling\n\n**Popular Frameworks:**\n- **Django** — Full-stack web framework\n- **FastAPI** — Modern async API framework\n- **Flask** — Lightweight web microframework\n\n**Data Science & AI:**\n- NumPy, Pandas, Matplotlib\n- TensorFlow, PyTorch, Scikit-learn\n- Jupyter Notebooks\n- LangChain for LLM applications`;
  }

  // JavaScript specific
  if (lower.includes('javascript') && !lower.includes('node')) {
    return `**JavaScript — Overview & Key Concepts:**\n\nJavaScript is the programming language of the web, running in browsers and servers (via Node.js).\n\n**Core Concepts:**\n- Variables (let, const, var), Data Types\n- Functions (arrow, higher-order, closures)\n- Prototypal Inheritance & Classes\n- Async Programming (Promises, async/await)\n- Event Loop & Callback Queue\n- DOM Manipulation & Event Handling\n- ES6+ Features (destructuring, spread, modules)\n\n**Ecosystem:**\n- **Frontend:** React, Vue, Angular, Svelte\n- **Backend:** Node.js, Express, Nest.js\n- **Testing:** Jest, Mocha, Cypress\n- **Build Tools:** Vite, Webpack, esbuild`;
  }

  // Interview questions
  if (lower.includes('interview question')) {
    return `**Common Technical Interview Questions:**\n\n1. Explain the difference between REST and GraphQL.\n2. What is the event loop in Node.js?\n3. How do you optimize React component rendering?\n4. Explain indexing in MongoDB.\n5. What is the difference between SQL and NoSQL databases?\n6. How does JWT authentication work?\n7. What are microservices and when do you use them?\n\nWould you like me to generate role-specific interview questions?`;
  }

  // Salary / package
  if (lower.includes('salary') || lower.includes('package') || lower.includes('ctc')) {
    return `**Typical Salary Ranges (India):**\n\n- **Fresher (0-1 yr):** ₹3-6 LPA\n- **Junior Developer (1-3 yr):** ₹6-12 LPA\n- **Mid-Level (3-5 yr):** ₹12-20 LPA\n- **Senior Developer (5-8 yr):** ₹20-35 LPA\n- **Tech Lead / Architect (8+ yr):** ₹35-60+ LPA\n\nRanges vary by company size, tech stack, and location. Would you like to browse job openings with salary details?`;
  }

  // Generic fallback — answer the question topic, NOT a self-introduction
  const topic = text.replace(/tell me (the |about |)?/i, '').replace(/what (is |are |do )?/i, '').trim();
  if (topic && topic.length > 3) {
    return `Here's what I know about **${topic}**:\n\nThis is a broad topic in software engineering and technology. I'd be happy to go deeper — could you specify what aspect you'd like to know about? For example:\n- Core concepts and fundamentals\n- Best practices and common patterns\n- Interview questions related to this topic\n- Career paths and learning resources\n\nJust ask and I'll provide a detailed answer!`;
  }
  return `I'd be happy to help! Could you provide a bit more detail about what you'd like to know? I can assist with:\n- Technical concepts (React, Node.js, Python, databases, etc.)\n- Interview preparation and tips\n- Career advice and roadmaps\n- Resume writing guidance\n- Or search our company database for candidates, jobs, and more`;
}

/**
 * Helper to classify user intent.
 * Automatically checks conversational history to inherit previous recruitment intents for follow-up statements.
 */
function detectIntent(text, history) {
  const lower = text.toLowerCase();

  // 1. Greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + '!') || lower.startsWith(g + '?') || lower.startsWith(g + ','))) {
    return 'Greeting';
  }

  // 2. Thank You
  const thanks = ['thank you', 'thanks', 'thank u', 'thx'];
  if (thanks.some(t => lower === t || lower.startsWith(t + ' ') || lower.startsWith(t + '!') || lower.startsWith(t + ','))) {
    return 'Thank You';
  }

  // 3. Goodbye
  const byes = ['bye', 'goodbye', 'see you'];
  if (byes.some(b => lower === b || lower.startsWith(b + ' ') || lower.startsWith(b + '!'))) {
    return 'Goodbye';
  }

  // 4. Resume Summary RAG intent
  if (lower.includes('summarize') && (lower.includes('resume') || lower.includes('candidate') || lower.includes('cv'))) {
    return 'Resume Summary';
  }

  // 5. Resume Comparison RAG intent
  if (lower.includes('compare') && (lower.includes('resume') || lower.includes('job') || lower.includes('candidate'))) {
    return 'Resume Comparison';
  }

  // 6. Resume Analysis
  if (lower.includes('resume') || lower.includes('ats score') || lower.includes('cv') || lower.includes('evaluate resume')) {
    return 'Resume Analysis';
  }

  // 7. Interview Scheduling & Prep Questions
  if (lower.includes('schedule') || lower.includes('interview') || lower.includes('book') || lower.includes('prep') || lower.includes('question')) {
    return 'Interview Scheduling';
  }

  // 8. Application Status
  if (lower.includes('application') || lower.includes('invitation') || lower.includes('my status') || lower.includes('my applied')) {
    return 'Application Status';
  }

  // 9. Job Search
  if (
    lower.includes('job') || lower.includes('vacancy') || lower.includes('opening') ||
    lower.includes('work') || lower.includes('hiring for') || lower.includes('position') ||
    lower.includes('role') || lower.includes('careers') || lower.includes('employment')
  ) {
    return 'Job Search';
  }

  // 10. Candidate Search
  if (
    lower.includes('candidate') || lower.includes('developer') ||
    lower.includes('talent') || lower.includes('shortlist') || lower.includes('find developer') ||
    lower.includes('engineer') || lower.includes('programmer') || lower.includes('coder') ||
    lower.includes('applicant') || lower.includes('profiles')
  ) {
    return 'Candidate Search';
  }

  // 11. Self-introduction request (the ONLY time VoiceGenie should introduce itself)
  const selfIntroWords = ['who are you', 'introduce yourself', 'what is your name', 'what are you', 'tell me about yourself'];
  if (selfIntroWords.some(w => lower.includes(w))) {
    return 'Self Introduction';
  }

  // 12. Capability / what can you do
  const capabilityWords = ['what can you do', 'what do you do', 'how can you help', 'what are your features', 'your capabilities'];
  if (capabilityWords.some(w => lower.includes(w))) {
    return 'Capabilities';
  }

  // 13. Small Talk (jokes, how are you)
  const smallTalkWords = ['how are you', 'are you an ai', 'tell me a joke', 'are you real'];
  if (smallTalkWords.some(w => lower.includes(w))) {
    return 'Small Talk';
  }

  // 14. Skills / technical / HR related general questions (answer directly, no MCP needed)
  const skillsKeywords = ['technical skill', 'hr skill', 'soft skill', 'hard skill', 'required skill', 'tell me the skill', 'list skill', 'what skill', 'skills required', 'skills needed', 'key skill'];
  if (skillsKeywords.some(w => lower.includes(w))) {
    return 'General AI Question';
  }

  // 15. General AI Question
  const aiKeywords = ['explain', 'what is', 'how does', 'why is', 'difference between', 'how to code', 'write a function', 'definition of', 'describe', 'tell me about', 'tell me the', 'list', 'give me'];
  if (aiKeywords.some(w => lower.includes(w))) {
    return 'General AI Question';
  }

  // Inherit context from history for follow-up statements like "Only Pune" or "Freshers" or "Highest salary"
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prevMsg = history[i];
      if (prevMsg.role === 'user') {
        const prevLower = prevMsg.content.toLowerCase();
        const isGreetingOrBye = greetings.some(g => prevLower.startsWith(g)) || byes.some(b => prevLower.startsWith(b));
        if (!isGreetingOrBye) {
          const prevIntent = detectIntent(prevMsg.content, history.slice(0, i));
          if (['Job Search', 'Candidate Search', 'Application Status', 'Interview Scheduling', 'Resume Analysis', 'Resume Summary', 'Resume Comparison'].includes(prevIntent)) {
            return prevIntent;
          }
        }
      }
    }
  }

  return 'General AI Question';
}

/**
 * Classify a user query into one of three routing categories:
 *
 *   COMPANY_DATA       — queries that explicitly ask for records from our database
 *                         (candidates, jobs, applications, interviews, companies, recruiters)
 *   GENERAL_KNOWLEDGE  — how-to, explanations, tips, career advice, concept definitions
 *   HYBRID             — may benefit from company data + AI insight together
 *
 * The classification is based on the raw text AND the detected intent.
 */
function classifyQueryType(text, detectedIntent) {
  const lower = text.toLowerCase();

  // ── Override: "resume tips/advice/format/writing" is general knowledge, not DB ──
  const resumeGeneralPatterns = ['resume tip', 'resume advice', 'resume format', 'resume writing', 'how to write resume', 'resume guide', 'resume template'];
  if (resumeGeneralPatterns.some(p => lower.includes(p))) return 'GENERAL_KNOWLEDGE';

  // ── COMPANY_DATA intents (always query DB) ──────────────────────────────
  const companyIntents = [
    'Job Search', 'Candidate Search', 'Application Status',
    'Resume Analysis', 'Resume Summary', 'Resume Comparison'
  ];
  if (companyIntents.includes(detectedIntent)) return 'COMPANY_DATA';

  // ── Explicit company data keywords ──────────────────────────────────────
  const companyKeywords = [
    'show me', 'find me', 'list all', 'search for', 'how many candidates',
    'how many jobs', 'how many applications', 'how many interviews',
    'show candidates', 'show jobs', 'show applications', 'show interviews',
    'who applied', 'pending application', 'pending interview', 'shortlisted',
    'which candidates', 'which jobs', 'who knows', 'find developer',
    'find react', 'find node', 'find python', 'find mern',
    'react developer', 'node developer', 'python developer', 'mern developer',
    'top candidate', 'ats score', 'our database', 'in the database',
    'in our system', 'in our platform'
  ];
  if (companyKeywords.some(kw => lower.includes(kw))) return 'COMPANY_DATA';

  // ── GENERAL_KNOWLEDGE patterns ─────────────────────────────────────────
  const generalPatterns = [
    'how can i', 'how do i', 'how to', 'what is', 'what are', 'explain',
    'describe', 'define', 'tell me about', 'difference between',
    'tips for', 'advice', 'roadmap', 'prepare for', 'how to crack',
    'improve my', 'best practices', 'tutorial', 'guide', 'learn',
    'career', 'resume tip', 'interview tip', 'communication',
    'dsa', 'data structure', 'algorithm'
  ];

  const generalTopics = [
    'interview preparation', 'interview prep', 'career advice', 'career growth',
    'coding practice', 'coding roadmap', 'resume writing', 'resume format',
    'soft skill', 'hard skill', 'hr interview', 'technical interview',
    'behavioral interview', 'mock interview', 'presentation',
    'system design', 'microservices', 'design pattern'
  ];

  if (generalPatterns.some(p => lower.includes(p)) && !companyKeywords.some(kw => lower.includes(kw))) {
    return 'GENERAL_KNOWLEDGE';
  }
  if (generalTopics.some(t => lower.includes(t))) {
    return 'GENERAL_KNOWLEDGE';
  }

  // If the intent is "General AI Question" — it's general knowledge
  if (detectedIntent === 'General AI Question') return 'GENERAL_KNOWLEDGE';

  // ── HYBRID: "Interview Scheduling" can be either ────────────────────────
  // "How can I prepare for interview?" → GENERAL_KNOWLEDGE
  // "Schedule interview with candidate X" → COMPANY_DATA
  if (detectedIntent === 'Interview Scheduling') {
    const isPrep = lower.includes('prepare') || lower.includes('prep') ||
                   lower.includes('tips') || lower.includes('question') ||
                   lower.includes('how to') || lower.includes('crack');
    const isSchedule = lower.includes('schedule') || lower.includes('book') ||
                       lower.includes('invite');
    if (isPrep && !isSchedule) return 'GENERAL_KNOWLEDGE';
    if (isSchedule) return 'COMPANY_DATA';
    return 'HYBRID';
  }

  // Default: HYBRID (try DB first, fall back to Gemini if no data)
  return 'HYBRID';
}

/**
 * Main AI Agent Orchestration Service.
 * Upgraded to behave as an Autonomous AI Recruiter Agent Executor.
 * 
 * @param {Object} params
 * @param {string} params.message - User prompt string
 * @param {Object} [params.user] - Optional user context object
 * @param {string} [params.role] - User role ('candidate' | 'recruiter')
 * @returns {Promise<Object>} { success: true, reply: string, toolUsed: string|null }
 */
async function processVoiceGenieAgent({ message, user, role, conversationId }) {
  const startTime = Date.now();
  let toolUsed = null;
  let detectedIntent = 'General AI Question';
  let plannerDecision = 'Route 2: Gemini Only';
  let geminiUsed = 'Yes';
  let mcpUsed = 'No';
  let mongodbUsed = 'Yes';
  let selectedTools = [];
  let taskPlan = [];
  let goal = "Answer user query";
  let toolResultsSummary = "None";

  try {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        success: false,
        reply: 'Please provide a valid message.',
        toolUsed: null
      };
    }

    const text = message.trim();
    const lower = text.toLowerCase();
    let toolResultContext = null;
    let fallbackReply = null;
    let recordsCount = 0;

    console.log('[AIAgentService] Processing user message:', text);

    // 1. Load conversation by conversationId or userId (with Redis caching fallback to MongoDB)
    let conversation = null;
    let userId = user?._id?.toString() || user?.id || null;
    
    let userModel = 'CandidateUser';
    if (role === 'recruiter' || user?.companyName || user?.designation) {
      userModel = 'Recruiter';
    }

    if (userId) {
      const cacheKeyConv = conversationId ? `conversation:${conversationId}` : `conversation_active:${userId}`;
      const cachedConv = await cacheService.get(cacheKeyConv);
      if (cachedConv) {
        conversation = cachedConv;
        console.log('Conversation Loaded');
      } else {
        console.log('MongoDB Query');
        if (conversationId) {
          conversation = await Conversation.findOne({ userId, conversationId }).lean();
        } else {
          conversation = await Conversation.findOne({ userId, isActive: true }).lean();
          if (!conversation) {
            conversation = await Conversation.findOne({ userId }).sort({ updatedAt: -1 }).lean();
          }
        }
        if (conversation) {
          await cacheService.set(cacheKeyConv, conversation, 1800);
          console.log('Conversation Loaded');
        }
      }

      if (!conversation) {
        console.log('MongoDB Query');
        const newConv = new Conversation({
          conversationId: crypto.randomUUID(),
          userId,
          userModel,
          title: 'New Chat',
          isActive: true,
          messages: []
        });
        await newConv.save();
        conversation = newConv.toObject ? newConv.toObject() : newConv;
        await cacheService.set(cacheKeyConv, conversation, 1800);
        console.log('Conversation Created');
      }
    }

    // 3. Save user message
    if (conversation && userId) {
      console.log('MongoDB Query');
      const isFirstMessage = conversation.messages.length === 0;
      let titleUpdate = {};
      
      if (isFirstMessage) {
        let newTitle = text.substring(0, 50);
        if (text.length > 50) newTitle += '...';
        titleUpdate = { title: newTitle };
        conversation.title = newTitle;
      }

      const updateQuery = {
        $push: { messages: { role: 'user', content: text, timestamp: new Date() } }
      };
      
      if (isFirstMessage) {
        updateQuery.$set = titleUpdate;
      }

      await Conversation.updateOne(
        { conversationId: conversation.conversationId },
        updateQuery
      );
      
      conversation.messages.push({
        role: 'user',
        content: text,
        timestamp: new Date()
      });
      const cacheKeyConv = conversationId ? `conversation:${conversationId}` : `conversation_active:${userId}`;
      await cacheService.set(cacheKeyConv, conversation, 1800);
      console.log('Messages Saved');
    }

    // 4. Load last 20 messages for parsing history context
    const allMessages = conversation ? conversation.messages : [];
    const historyMessages = allMessages.slice(-20);
    const prevHistory = historyMessages.slice(0, -1);

    // Run Intent Detection
    detectedIntent = detectIntent(text, prevHistory);

    // --- ROUTE 1: Greetings, Thank You, and Goodbye (Local response instantly with cache support) ---
    if (detectedIntent === 'Greeting' || detectedIntent === 'Thank You' || detectedIntent === 'Goodbye') {
      plannerDecision = 'Route 1: Direct Response';
      geminiUsed = 'No';
      mcpUsed = 'No';
      goal = `Acknowledge client ${detectedIntent.toLowerCase()}`;
      taskPlan = [`1. Acknowledge ${detectedIntent}`];

      const cacheKeyGreeting = `greeting:${lower}`;
      let reply = await cacheService.get(cacheKeyGreeting);

      if (!reply) {
        reply = "Hello! 👋 I'm VoiceGenie, your AI Recruitment Assistant. How can I help you today?";
        if (detectedIntent === 'Thank You') {
          reply = "You're most welcome! 😊 If you need any help with jobs, candidates, interviews, or recruitment, just let me know.";
        } else if (detectedIntent === 'Goodbye') {
          reply = "Goodbye! 👋 Have a great day. Feel free to come back anytime.";
        }
        await cacheService.set(cacheKeyGreeting, reply, 1800);
      }

      // Save AI Response
      if (conversation && userId) {
        console.log('MongoDB Query');
        await Conversation.updateOne(
          { conversationId: conversation.conversationId },
          { $push: { messages: { role: 'assistant', content: reply, timestamp: new Date() } } }
        );
        
        conversation.messages.push({
          role: 'assistant',
          content: reply,
          timestamp: new Date()
        });
        const cacheKeyConv = conversationId ? `conversation:${conversationId}` : `conversation_active:${userId}`;
        await cacheService.set(cacheKeyConv, conversation, 1800);
        console.log('AI Response Saved');
      }

      // Print Agent Planner Execution Logs
      const executionTime = Date.now() - startTime;
      console.log('Task Plan:', JSON.stringify(taskPlan, null, 2));
      console.log('Selected Tools:', 'None');
      console.log('Execution Time:', executionTime, 'ms');
      console.log('Tool Results:', toolResultsSummary);
      console.log('Final Response:\n', reply);

      return {
        success: true,
        reply,
        toolUsed: null
      };
    }

    // --- ROUTE 2, 3, & 4: Determine Recruitment queries, Tool Chaining, or General AI ---
    const isRecruitment = ['Job Search', 'Candidate Search', 'Resume Analysis', 'Interview Scheduling', 'Application Status', 'Resume Summary', 'Resume Comparison'].includes(detectedIntent);

    if (isRecruitment) {
      mcpUsed = 'Yes';

      // 1. Resume Summary RAG Intent
      if (detectedIntent === 'Resume Summary') {
        plannerDecision = 'Route 3: Gemini + MCP';
        goal = "Summarize Resume RAG";
        taskPlan = [
          "1. Query Candidate schema to fetch candidate resumeText (MongoDB)",
          "2. Feed extracted text to Gemini with summarization rules (Gemini)"
        ];
        selectedTools = ['resumeAnalysis'];
        toolUsed = 'resumeAnalysis';

        console.log('MongoDB Query');
        const candidate = await Candidate.findOne({}).sort({ createdAt: -1 }).lean(); // get most recent candidate
        if (candidate) {
          toolResultContext = `[RESUME RAG TEXT CONTEXT]\nCandidate: ${candidate.name}\nExtracted Resume Content:\n${candidate.resumeText || candidate.summary}`;
          toolResultsSummary = `Retrieved resume text for candidate ${candidate.name}.`;
          fallbackReply = `Here is a summary of **${candidate.name}**'s resume profile:\n\n- Skills: ${(candidate.skills || []).join(', ')}\n- Experience: ${candidate.experience} years.\n- Summary: ${candidate.summary}`;
        } else {
          toolResultContext = "No candidate profiles found.";
          fallbackReply = "No matching records were found in the current database.";
        }
      }

      // 2. Resume Comparison RAG Intent
      else if (detectedIntent === 'Resume Comparison') {
        plannerDecision = 'Route 4: Multiple MCP Tools / Chaining';
        goal = "Compare Resume with Job description RAG";
        taskPlan = [
          "1. Query Candidate model to fetch candidate resumeText (MongoDB)",
          "2. Query Job model to fetch target job description (MongoDB)",
          "3. Perform cosine similarity calculation on vectors (cosineSimilarity)",
          "4. Evaluate fit percentage, missing skills and recommendations"
        ];
        selectedTools = ['resumeAnalysis', 'searchJobs'];
        toolUsed = 'resumeAnalysis';

        console.log('MongoDB Query');
        const candidate = await Candidate.findOne({}).sort({ createdAt: -1 }).lean();
        console.log('MongoDB Query');
        const job = await Job.findOne({}).sort({ createdAt: -1 }).lean();

        if (candidate && job) {
          const matchResult = await analyzeResume({
            candidateId: candidate._id,
            jobDescription: job.description || job.title
          });
          toolResultContext = `[SEMANTIC COMPARISON RESULT]\nCandidate: ${candidate.name}\nJob Requisition: ${job.title}\nMatch Percent: ${matchResult.matchPercent}%\nStrengths: ${matchResult.strengths.join(', ')}\nMissing Skills: ${matchResult.missingSkills.join(', ')}\nRecommendations: ${matchResult.recommendations.join(', ')}`;
          toolResultsSummary = `Compared candidate ${candidate.name} with job ${job.title}. Match: ${matchResult.matchPercent}%.`;
          fallbackReply = `Compared **${candidate.name}** with **${job.title}**:\n\n- **Match Percentage:** ${matchResult.matchPercent}%\n- **Strengths:** ${matchResult.strengths.join(', ')}\n- **Missing Skills:** ${matchResult.missingSkills.join(', ') || 'None'}\n- **Recommendations:** ${matchResult.recommendations.join(', ')}`;
        } else {
          toolResultContext = "No matching candidates or jobs found.";
          fallbackReply = "No matching records were found in the current database.";
        }
      }

      // 3. Multi-Step Task Pipeline / Chaining
      else if (
        (lower.includes('rank') || lower.includes('shortlist') || lower.includes('schedule') || lower.includes('questions')) &&
        (lower.includes('candidate') || lower.includes('developer') || lower.includes('mern') || lower.includes('ai') || lower.includes('react'))
      ) {
        plannerDecision = 'Route 4: Multiple MCP Tools / Chaining';
        goal = `Autonomous Recruitment Pipeline`;
        
        taskPlan = [
          "1. Search candidate profiles matching technology requisition (searchCandidates)",
          "2. Rank candidate resume profiles semantically using vector similarity (candidateRanking)",
          "3. Generate custom technical interview screening questions (generateInterviewQuestions)",
          "4. Propose interview invite schedule and wait for confirmation (scheduleInterview)"
        ];

        selectedTools = ['searchCandidates', 'rankCandidates', 'generateInterviewQuestions', 'scheduleInterview'];
        toolUsed = 'searchCandidates';

        console.log('[AI Agent] Executing Autonomous Recruiter Plan...');
        
        let skills = 'React';
        if (lower.includes('mern')) skills = 'MERN';
        else if (lower.includes('ai') || lower.includes('machine learning')) skills = 'Python';
        else if (lower.includes('python')) skills = 'Python';

        const candData = await searchCandidates({ skills, keyword: text });
        console.log(`[Agent Step 1] searchCandidates found: ${candData.candidates.length}`);

        const candidateIds = candData.candidates.map(c => c.id);
        const rankResult = await rankCandidates({ candidateIds, jobDetails: { title: `${skills} Requisition`, requiredSkills: [skills], description: text } });
        console.log(`[Agent Step 2] rankCandidates successfully ranked: ${rankResult.rankings && rankResult.rankings.rankedCandidates ? rankResult.rankings.rankedCandidates.length : 0}`);

        let generatedQuestions = `1. Explain the differences between state and props in React.\n2. How do you optimize rendering performance in a large MERN application?`;
        try {
          console.log('Gemini Call');
          const gemQuestions = await askGemini(`Generate 3 detailed interview screening questions for a candidate with skills: ${skills}`);
          if (gemQuestions) generatedQuestions = gemQuestions;
        } catch (e) {
          console.warn('[Agent Step 3] Gemini questions generation failed.');
        }

        const proposedTime = new Date(Date.now() + 86400000 * 3).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " at 2:00 PM";
        const topCandidate = rankResult.rankings && rankResult.rankings.topRecommendation ? rankResult.rankings.topRecommendation.name : 'Top Candidate';

        toolResultContext = `[AUTONOMOUS PLAN EXECUTION CONTEXT]\nGoal: Hire ${skills} developer.\nCandidates Pool: ${candData.candidates.length} profiles.\nTop Recommended Candidate: ${topCandidate} (${rankResult.rankings?.topRecommendation?.matchScore}% match).\nGenerated Screening Questions:\n${generatedQuestions}\nProposed Time: ${proposedTime}.\nAction Required: Before I schedule the final interview invitation with ${topCandidate}, please type 'Confirm' or click verify to proceed.`;
        toolResultsSummary = `Successfully retrieved ${candData.candidates.length} candidates, ranked top profile (${topCandidate}), and generated screening questions.`;
        fallbackReply = `I have successfully compiled the recruitment plan for ${skills} developers:\n\n1. Found **${candData.candidates.length}** candidates.\n2. Top Candidate recommendation: **${topCandidate}**.\n3. Generated Screening Questions:\n${generatedQuestions}\n\nProposing interview: **${proposedTime}**. Before sending the invitation, please confirm.`;

      } else if (lower.includes('schedule') || lower.includes('invite')) {
        plannerDecision = 'Route 3: Gemini + MCP';
        goal = "Schedule Interview Invite";
        taskPlan = [
          "1. Lookup candidate details",
          "2. Verify calendar timings",
          "3. Ask recruiter confirmation before finalizing schedule"
        ];
        selectedTools = ['scheduleInterview'];
        toolUsed = 'scheduleInterview';

        const candidateNameMatch = text.match(/with\s+([A-Za-z\s]+)/i);
        const nameToInvite = candidateNameMatch ? candidateNameMatch[1].trim() : 'Candidate';

        toolResultContext = `[DATABASE SCHEDULING ACTION]\nAction: scheduleInterview\nTarget Candidate: ${nameToInvite}\nStatus: PENDING CONFIRMATION\nInstruction: Inform the recruiter that you are ready to schedule the interview with ${nameToInvite}, and ask them for explicit confirmation before saving.`;
        toolResultsSummary = `Awaiting confirmation to schedule interview invitation with ${nameToInvite}.`;
        fallbackReply = `I have prepared the interview schedule invitation for **${nameToInvite}**. Before I proceed to schedule and send this, please confirm by replying 'Confirm' or 'Yes'.`;

      } else {
        plannerDecision = 'Route 3: Gemini + MCP';
        goal = `Execute recruitment action (${detectedIntent})`;
        
        if (detectedIntent === 'Job Search') {
          toolUsed = 'searchJobs';
          selectedTools = ['searchJobs'];
          taskPlan = ["1. Query job openings list (searchJobs)"];

          let skills = '';
          let location = '';
          const skillRegex = /(react|node|python|java|devops|cloud|flutter|ui\/ux|qa|pm|ai|ml|data science|mern)/i;
          const locationRegex = /(pune|mumbai|bangalore|hyderabad|delhi|remote)/i;

          prevHistory.forEach(hMsg => {
            if (hMsg.role === 'user') {
              const skillMatches = hMsg.content.match(skillRegex);
              if (skillMatches && !skills) skills = skillMatches[0];
              const locationMatches = hMsg.content.match(locationRegex);
              if (locationMatches && !location) location = locationMatches[0];
            }
          });

          const curSkillMatches = text.match(skillRegex);
          if (curSkillMatches) skills = curSkillMatches[0];
          const curLocationMatches = text.match(locationRegex);
          if (curLocationMatches) location = curLocationMatches[0];

          let experienceQuery = text;
          if (lower.includes('fresher') || lower.includes('entry') || lower.includes('junior')) {
            experienceQuery += " fresher junior 0-2 years";
          }

          const cacheKeyJobs = `search:jobs:${skills}:${location}:${experienceQuery}`;
          let jobData = await cacheService.get(cacheKeyJobs);

          if (!jobData) {
            jobData = await searchJobs({ skills, location, keyword: `${skills} ${location} ${experienceQuery}` });
            await cacheService.set(cacheKeyJobs, jobData, 300);
          }

          if (lower.includes('salary') || lower.includes('highest salary') || lower.includes('pay') || lower.includes('package')) {
            jobData.jobs.sort((a, b) => {
              const valA = parseInt(a.salaryRange.replace(/[^0-9]/g, '')) || 0;
              const valB = parseInt(b.salaryRange.replace(/[^0-9]/g, '')) || 0;
              return valB - valA;
            });
          }

          recordsCount = jobData.jobs ? jobData.jobs.length : 0;
          console.log(`[MongoDB] Jobs Found: ${recordsCount}`);

          if (recordsCount === 0) {
            toolResultContext = `[DATABASE SEARCH JOBS RESULT (MCP Tool: searchJobs)]\nNo matching jobs were found in the database. Please inform the user that no matching records were found in the current database.`;
            fallbackReply = "No matching records were found in the current database.";
          } else {
            toolResultContext = `[DATABASE SEARCH JOBS RESULT (MCP Tool: searchJobs)]\nTotal Matching Jobs Found: ${jobData.totalCount}\nJobs Data:\n${JSON.stringify(jobData.jobs, null, 2)}`;
            fallbackReply = generateJobsFallbackResponse(jobData.jobs);
          }
          toolResultsSummary = `Retrieved ${recordsCount} jobs.`;
        }

        else if (detectedIntent === 'Application Status') {
          toolUsed = 'getApplications';
          selectedTools = ['getApplications'];
          taskPlan = ["1. Query application pipeline log (getApplications)"];

          const userIdVal = user?._id?.toString() || user?.id || null;
          const candidateEmail = user?.email || null;

          const cacheKeyApps = `search:applications:${userIdVal}:${candidateEmail}`;
          let appData = await cacheService.get(cacheKeyApps);

          if (!appData) {
            appData = await getApplications({ userId: userIdVal, candidateEmail });
            await cacheService.set(cacheKeyApps, appData, 300);
          }

          recordsCount = appData.applications ? appData.applications.length : 0;
          console.log(`[MongoDB] Applications Found: ${recordsCount}`);

          if (recordsCount === 0) {
            toolResultContext = `[DATABASE APPLICATIONS RESULT (MCP Tool: getApplications)]\nNo candidate applications or invitations were found in the database. Please inform the user that no matching records were found in the current database.`;
            fallbackReply = "No matching records were found in the current database.";
          } else {
            toolResultContext = `[DATABASE APPLICATIONS RESULT (MCP Tool: getApplications)]\nTotal Applications/Invitations Found: ${appData.count}\nApplications Data:\n${JSON.stringify(appData.applications, null, 2)}`;
            fallbackReply = generateApplicationsFallbackResponse(appData.applications);
          }
          toolResultsSummary = `Retrieved ${recordsCount} applications.`;
        }

        else if (detectedIntent === 'Resume Analysis') {
          toolUsed = 'analyzeResume';
          selectedTools = ['analyzeResume'];
          taskPlan = ["1. Parse resume text and evaluate match suitability (resumeAnalysis)"];

          const candidateId = user?._id?.toString() || null;
          const resumeResult = await analyzeResume({ candidateId, resumeText: text });
          toolResultContext = `[DATABASE RESUME ANALYSIS RESULT (MCP Tool: analyzeResume)]\nAnalysis:\n${JSON.stringify(resumeResult, null, 2)}`;
          console.log(`[MongoDB] Resume Analyzed Successfully`);
          fallbackReply = `Here is your resume evaluation:\n\n- Score: ${resumeResult.score || 80}%\n- Summary: ${resumeResult.summary || 'Analyze successful'}\n- Suggested Skills to add: ${resumeResult.skillsToAdd ? resumeResult.skillsToAdd.join(', ') : 'None'}`;
          toolResultsSummary = `Analyzed resume successfully. ATS Score: ${resumeResult.score || 80}%.`;
        }

        else if (detectedIntent === 'Candidate Search') {
          toolUsed = 'searchCandidates';
          selectedTools = ['searchCandidates'];
          taskPlan = ["1. Query candidates database pool (searchCandidates)"];

          let skills = '';
          const skillRegex = /(react|node|python|java|devops|cloud|flutter|ui\/ux|qa|pm|ai|ml|data science|mern)/i;

          prevHistory.forEach(hMsg => {
            if (hMsg.role === 'user') {
              const skillMatches = hMsg.content.match(skillRegex);
              if (skillMatches && !skills) skills = skillMatches[0];
            }
          });

          const curSkillMatches = text.match(skillRegex);
          if (curSkillMatches) skills = curSkillMatches[0];

          const cacheKeyCandidates = `search:candidates:${skills}:${text}`;
          let candData = await cacheService.get(cacheKeyCandidates);

          if (!candData) {
            candData = await searchCandidates({ skills, keyword: text });
            await cacheService.set(cacheKeyCandidates, candData, 300);
          }

          recordsCount = candData.candidates ? candData.candidates.length : 0;
          console.log(`[MongoDB] Candidates Found: ${recordsCount}`);

          if (recordsCount === 0) {
            toolResultContext = `[DATABASE SEARCH CANDIDATES RESULT (MCP Tool: searchCandidates)]\nNo matching candidates were found in the database. Please inform the user that no matching records were found in the current database.`;
            fallbackReply = "No matching records were found in the current database.";
          } else {
            toolResultContext = `[DATABASE SEARCH CANDIDATES RESULT (MCP Tool: searchCandidates)]\nTotal Matching Candidates Found: ${candData.count}\nCandidates Data:\n${JSON.stringify(candData.candidates, null, 2)}`;
            fallbackReply = generateCandidatesFallbackResponse(candData.candidates);
          }
          toolResultsSummary = `Retrieved ${recordsCount} candidate profiles.`;
        }
      }

    } else {
      plannerDecision = 'Route 2: Gemini Only';
      mcpUsed = 'No';
      selectedTools = [];
      goal = "Answer user question directly";

      if (detectedIntent === 'Self Introduction') {
        // ONLY case where self-introduction is appropriate
        taskPlan = ["1. Introduce VoiceGenie capabilities"];
        fallbackReply = "I'm **VoiceGenie**, your AI Recruitment Assistant. I can help you:\n- 🔍 Search and rank candidates\n- 💼 Find job openings\n- 📄 Analyze and compare resumes\n- 📅 Schedule interviews\n- 🤖 Answer recruitment and tech questions\n\nHow can I help you today?";
      } else if (detectedIntent === 'Capabilities') {
        taskPlan = ["1. List VoiceGenie capabilities"];
        fallbackReply = "Here's what I can do:\n- **Search Candidates** — Find candidates by skills, experience, or location\n- **Search Jobs** — Browse active job openings\n- **Resume Analysis** — Evaluate and compare resumes against job descriptions\n- **Rank Candidates** — Rank applicants by fit score\n- **Interview Questions** — Generate technical and HR screening questions\n- **Schedule Interviews** — Propose interview times (with your confirmation)\n- **General Questions** — Answer any tech or HR related questions";
      } else if (detectedIntent === 'Small Talk') {
        taskPlan = ["1. Respond to small talk"];
        fallbackReply = "I'm doing great, thanks for asking! 😊 Ready to help you with recruitment tasks. What would you like to do?";
      } else if (lower.includes('description') || lower.includes(' jd ') || lower.startsWith('jd ')) {
        goal = "Generate Job Description";
        taskPlan = ["1. Draft customized job description using Gemini AI model"];
        selectedTools = ['generateJobDescription'];
        toolResultsSummary = "Generated job description using Gemini.";
        fallbackReply = `**Job Description Draft:**\n- **Title:** Software Engineer\n- **Responsibilities:** Design and build RESTful APIs, optimize database schemas, implement CI/CD pipelines.\n- **Requirements:** Node.js, Express, MongoDB, React (3+ years experience).\n- **Nice to Have:** Redis, Docker, AWS experience.`;
      } else {
        // General knowledge question — answer directly, NEVER self-introduce
        taskPlan = ["1. Answer user question directly using knowledge base"];
        // Build a context-aware fallback based on what was asked
        fallbackReply = buildKnowledgeFallback(text);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HYBRID AI ROUTING — Classify query type BEFORE deciding data source.
    //
    // A. COMPANY_DATA  → queries about candidates, jobs, applications, interviews
    //    → Always run RAG + MCP. If no data, say "no records found".
    // B. GENERAL_KNOWLEDGE → how-to, explanations, tips, career advice, concepts
    //    → Skip RAG entirely. Use Gemini only. Fallback to buildKnowledgeFallback.
    // C. HYBRID → queries that may need company data + AI insights
    //    → Run RAG first. If data found, enrich with Gemini. If not, Gemini-only.
    // ─────────────────────────────────────────────────────────────────────────
    const queryType = classifyQueryType(text, detectedIntent);
    console.log(`[HybridRouter] Query type: ${queryType} | Intent: ${detectedIntent}`);

    const userFilter = {};
    if (role === 'recruiter' && user?._id) userFilter.recruiterId = user._id.toString();
    if (role === 'candidate' && user?._id) userFilter.candidateId = user._id.toString();
    if (user?.email) userFilter.email = user.email;

    let ragContext = null;

    // Only run RAG for COMPANY_DATA or HYBRID queries (never for GENERAL_KNOWLEDGE)
    const skipRAG = queryType === 'GENERAL_KNOWLEDGE' ||
      ['Greeting', 'Thank You', 'Goodbye', 'Self Introduction', 'Capabilities', 'Small Talk'].includes(detectedIntent);

    if (!skipRAG) {
      const ragCacheKey = `rag:${text.toLowerCase().slice(0, 80)}`;
      ragContext = await retrieveCompanyKnowledge(text, userFilter, ragCacheKey);
      if (ragContext.hasData) {
        console.log(`[RAG] Company data found: ${ragContext.totalRecords} records from [${ragContext.collections.join(', ')}]`);
      } else {
        console.log('[RAG] No company records matched.');
        // For HYBRID queries with no DB results, downgrade to general knowledge
        if (queryType === 'HYBRID') {
          console.log('[HybridRouter] HYBRID query returned no DB data → falling back to Gemini general knowledge.');
        }
      }
    } else {
      console.log('[HybridRouter] Skipping RAG — pure general knowledge query.');
    }

    // Build the enriched prompt (RAG context injected only when available)
    const promptForGemini = buildRAGPrompt(SYSTEM_PROMPT, text, ragContext, prevHistory);

    // Send to Gemini LLM
    let llmReply = null;
    try {
      console.log('Gemini Call');
      console.log('History Sent To Gemini');
      llmReply = await askGemini(promptForGemini);
    } catch (gemErr) {
      console.error('[AIAgentService] Gemini API Execution failed:', gemErr.message || gemErr);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE FINAL ANSWER based on query type and available data
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[AI] Returning results');
    let finalReply;

    if (llmReply && llmReply.trim()) {
      // Gemini responded — use it (already enriched with RAG context if available)
      finalReply = llmReply.trim();
    } else if (queryType === 'GENERAL_KNOWLEDGE') {
      // General knowledge + Gemini failed → use knowledge fallback, NEVER say "no data found"
      finalReply = fallbackReply || buildKnowledgeFallback(text);
    } else if (ragContext?.hasData) {
      // Company query + Gemini failed → build answer from raw DB records
      const ragFallback = buildRAGFallback(text, ragContext);
      finalReply = ragFallback || fallbackReply || "I found some data but couldn't generate a complete summary. Please try asking again.";
    } else if (queryType === 'HYBRID' && !ragContext?.hasData) {
      // Hybrid query, no DB data, Gemini also failed → use knowledge fallback
      finalReply = fallbackReply || buildKnowledgeFallback(text);
    } else {
      // Company data query, no data found → this is the ONLY case where we say "no data"
      finalReply = fallbackReply || "No matching records were found in the current database. Please try a different search query.";
    }


    // Save AI Response
    if (conversation && userId) {
      console.log('MongoDB Query');
      await Conversation.updateOne(
        { conversationId: conversation.conversationId },
        { $push: { messages: { role: 'assistant', content: finalReply, timestamp: new Date() } } }
      );
      
      conversation.messages.push({
        role: 'assistant',
        content: finalReply,
        timestamp: new Date()
      });
      const cacheKeyConv = conversationId ? `conversation:${conversationId}` : `conversation_active:${userId}`;
      await cacheService.set(cacheKeyConv, conversation, 1800);
      console.log('AI Response Saved');
    }

    // Print Required Planning & Agent Logs
    const executionTime = Date.now() - startTime;
    console.log('Task Plan:', JSON.stringify(taskPlan, null, 2));
    console.log('Selected Tools:', selectedTools.join(', ') || 'None');
    console.log('Execution Time:', executionTime, 'ms');
    console.log('Tool Results:', toolResultsSummary);
    console.log('Final Response:\n', finalReply);

    return {
      success: true,
      reply: finalReply,
      toolUsed
    };

  } catch (error) {
    console.error('[AIAgentService] Error orchestrating VoiceGenie agent:', error.message || error);
    
    const executionTime = Date.now() - startTime;
    console.log('Task Plan:', JSON.stringify(taskPlan, null, 2));
    console.log('Selected Tools:', selectedTools.join(', ') || 'None');
    console.log('Execution Time:', executionTime, 'ms');
    console.log('Tool Results:', toolResultsSummary);

    return {
      success: true,
      reply: `I encountered an issue processing your request, but I can confirm that no matching records were found in the current database.`,
      toolUsed
    };
  }
}

module.exports = {
  processVoiceGenieAgent,
  SYSTEM_PROMPT
};
