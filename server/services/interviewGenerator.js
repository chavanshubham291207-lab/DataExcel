const { generateGeminiContent } = require('./geminiService');
const { buildInterviewPrompt } = require('./promptService');

/**
 * Generates technical/behavioral interview questions and assessment challenges.
 */
async function generateInterviewQuestions(jobTitle = 'Full Stack Developer', candidateData = {}, level = 'Mid-Senior') {
  const prompt = buildInterviewPrompt(jobTitle, candidateData, level);
  const aiResult = await generateGeminiContent(prompt, 'You are a Senior Engineering Manager & Interview Examiner.');

  if (aiResult) {
    return {
      success: true,
      engine: 'gemini',
      contentMarkdown: aiResult
    };
  }

  // Fallback Rule Engine
  const skills = (candidateData.skills || ['React', 'Node.js', 'MongoDB']).join(', ');

  const defaultMarkdown = `### 📋 Interview Assessment Brief for **${jobTitle}** (${level} Level)
*Tailored for Candidate background in: ${skills}*

---

#### 1. Core Technical Round Questions

**Q1. System Architecture & Performance**
> *"You mentioned experience with ${skills}. How do you design an API to gracefully handle 10,000 requests/minute while maintaining database query efficiency?"*
- **Evaluation Rubric:** Look for caching strategies (Redis), index optimization, async non-blocking execution, and pagination.

**Q2. State Management & Asynchronous Workflows**
> *"Describe a scenario where race conditions or memory leaks occurred in your frontend/backend code. How did you diagnose and resolve it?"*
- **Evaluation Rubric:** Evaluates debugging competence, cleanup listeners, and state flow control.

**Q3. Security & Authentication**
> *"How do you secure JWT authentication tokens against XSS and CSRF attacks in production web applications?"*
- **Evaluation Rubric:** Checks HTTP-Only cookies, short-lived access tokens, refresh tokens, and CORS configuration.

---

#### 2. Behavioral & Leadership Questions

**Q1. Technical Disagreement:** *"Tell me about a time you disagreed with a product manager or senior engineer regarding technical debt vs feature deadlines. How did you handle it?"*

---

#### 3. Practical Technical Coding Challenge

> **Task:** Build a rate-limited express endpoint with memory cache middleware that validates payload schemas and returns paginated candidate records.`;

  return {
    success: true,
    engine: 'rule-based',
    contentMarkdown: defaultMarkdown
  };
}

module.exports = { generateInterviewQuestions };
