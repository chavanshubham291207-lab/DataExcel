const { generateGeminiContent } = require('./geminiService');
const { buildCandidatePrompt } = require('./promptService');

/**
 * Generates personalized career advice, learning roadmaps, courses, and project ideas.
 */
async function generateCareerAdvice(candidateProfile, query = 'Give me a career roadmap') {
  const prompt = `Candidate Profile:
${JSON.stringify(candidateProfile, null, 2)}

User Request: "${query}"

Provide:
1. Career Path Roadmap (3-step growth milestone)
2. High-Impact Missing Skills to learn next
3. Recommended Courses / Certifications
4. Recommended Portfolio Project Ideas to build
5. Strategic Advice to land Senior roles.`;

  const aiResult = await generateGeminiContent(prompt, 'You are an executive career strategist.') ||
    `### 🚀 Personalized Career Growth & Skill Roadmap

#### 1. Career Growth Milestones
- **Short-Term (0-6 months):** Master missing cloud & backend skills (**AWS**, **Docker**, **Node.js architecture**).
- **Mid-Term (6-12 months):** Build high-throughput full stack applications and contribute to open-source tools.
- **Long-Term (1-2 years):** Lead technical architectural decisions and step into Senior Full Stack / Tech Lead roles.

#### 2. Top Recommended Learning Courses
- **AWS Certified Cloud Practitioner & Solutions Architect** (*Coursera / AWS Training*)
- **Node.js Microservices & Distributed Systems** (*Udemy / Frontend Masters*)
- **Advanced React & Next.js Performance Engineering** (*Official Docs & Workshops*)

#### 3. Recommended Portfolio Projects
1. **AI Talent Intelligence Dashboard:** Build a real-time recruiter matching dashboard utilizing Python FastAPI & React.
2. **Distributed Microservices Task Engine:** Implement Redis caching, JWT OAuth, and Docker containerization.

#### 4. Resume & Job Strategy
- Highlight measurable business outcomes (e.g. *"Optimized database queries by 40%"*).
- Align resume bullet points directly with target job requirement keywords.`;

  return {
    success: true,
    adviceMarkdown: aiResult
  };
}

module.exports = { generateCareerAdvice };
