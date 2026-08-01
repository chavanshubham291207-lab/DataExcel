import os
import json
import urllib.request
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from parser import parse_resume
from matcher import calculate_match_score
from search import parse_natural_language_query

app = FastAPI(title="AI Talent Intelligence Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://data-axle-uzzr.vercel.app",
        "https://dataexcel-1.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared upload directory reference
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class MatchRequest(BaseModel):
    candidate: Dict[str, Any]
    job: Dict[str, Any]

class SearchRequest(BaseModel):
    query: str

class CopilotRequest(BaseModel):
    message: str
    candidates: List[Dict[str, Any]]
    job: Optional[Dict[str, Any]] = None

def call_gemini(prompt: str, api_key: str) -> str:
    """Calls Gemini API using standard urllib to avoid extra package dependencies."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return ""

def local_copilot_fallback(message: str, candidates: List[Dict[str, Any]], job: Dict[str, Any] = None) -> str:
    """
    Highly intelligent rule-based agent to answer recruiter questions when Gemini API is not configured.
    """
    msg = message.lower()
    
    # Help guide
    if "help" in msg or "what can you do" in msg:
        return "I am your AI Hiring Copilot. You can ask me to:\n1. **Show top developers** (e.g. 'Show top React developers')\n2. **Identify certifications** (e.g. 'Who is AWS certified?')\n3. **Summarize profile** (e.g. 'Summarize Candidate Name')\n4. **Generate interview questions** (e.g. 'Generate questions for Candidate Name')\n5. **Recommend best candidate** for a job."

    # 1. Who is certified?
    if "certified" in msg or "certification" in msg:
        cert_query = "aws"
        for word in ["aws", "google", "pmp", "scrum", "cloud"]:
            if word in msg:
                cert_query = word
                break
                
        certified_candidates = []
        for cand in candidates:
            certs = [c.lower() for c in cand.get("certifications", [])]
            if any(cert_query in c for c in certs):
                certified_candidates.append(cand)
                
        if certified_candidates:
            res = f"Here are the candidates with **{cert_query.upper()}** certification:\n\n"
            for c in certified_candidates:
                res += f"- **{c['name']}** (Certs: {', '.join(c['certifications'])})\n"
            return res
        else:
            return f"I couldn't find any candidates listing a **{cert_query.upper()}** certification in the current view."

    # 2. Show top developers / skills
    for skill_keyword in ["react", "node", "python", "javascript", "typescript", "aws", "machine learning"]:
        if skill_keyword in msg:
            matched = []
            for cand in candidates:
                skills_lower = [s.lower() for s in cand.get("skills", [])]
                if any(skill_keyword in s for s in skills_lower):
                    matched.append(cand)
            if matched:
                # Sort by experience or ATS/Match score if available
                matched_sorted = sorted(matched, key=lambda x: x.get("atsScore", x.get("experience", 0)), reverse=True)
                res = f"Here are the top candidates possessing **{skill_keyword.title()}** skills:\n\n"
                for i, c in enumerate(matched_sorted[:5]):
                    res += f"{i+1}. **{c['name']}** - {c.get('experience', 0)} years exp (ATS Score: {c.get('atsScore', 70)})\n"
                return res
            else:
                return f"No candidates found in the current pool with **{skill_keyword.title()}** skills."

    # 3. Generate Interview Questions
    if "question" in msg or "interview questions" in msg or "ask" in msg:
        # Find candidate name in query
        target_cand = None
        for cand in candidates:
            if cand['name'].lower() in msg:
                target_cand = cand
                break
        if not target_cand and candidates:
            target_cand = candidates[0] # Default to first candidate
            
        if target_cand:
            skills_str = ", ".join(target_cand.get("skills", [])[:4])
            return f"### Interview Questions for **{target_cand['name']}** ({target_cand.get('experience', 0)} Years Exp)\n" \
                   f"Based on their background in **{skills_str}**:\n\n" \
                   f"1. **Technical Foundation:** You've listed experience with {skills_str}. Can you describe a complex system or project where you implemented these technologies, and the architectural decisions you made?\n" \
                   f"2. **Problem Solving:** What was the most challenging technical bug you encountered in your previous projects, and how did you resolve it?\n" \
                   f"3. **Skill Deep Dive:** In your resume, you listed the project '{target_cand.get('projects', ['Portfolio'])[0]}'. What was your specific contribution, and what challenges did you face?\n" \
                   f"4. **Process & Methodology:** Explain your experience working in collaborative development workflows (like Git, CI/CD pipelines, or Agile sprints)."
        else:
            return "Please provide candidate data or specify a candidate's name to generate custom interview questions."

    # 4. Summarize Profile
    if "summarize" in msg or "summary" in msg or "profile" in msg or "who is" in msg:
        target_cand = None
        for cand in candidates:
            if cand['name'].lower() in msg:
                target_cand = cand
                break
        if not target_cand and candidates:
            target_cand = candidates[0]
            
        if target_cand:
            skills = ", ".join(target_cand.get("skills", []))
            certs = ", ".join(target_cand.get("certifications", []))
            edu = ", ".join(target_cand.get("education", []))
            return f"### Candidate Profile Summary: **{target_cand['name']}**\n" \
                   f"- **Experience:** {target_cand.get('experience', 0)} Years\n" \
                   f"- **ATS Score:** {target_cand.get('atsScore', 'N/A')}/100\n" \
                   f"- **Key Skills:** {skills if skills else 'None parsed'}\n" \
                   f"- **Education:** {edu if edu else 'Not specified'}\n" \
                   f"- **Certifications:** {certs if certs else 'None'}\n" \
                   f"- **Summary:** {target_cand.get('summary', 'No summary available.')}"
        else:
            return "I couldn't identify the candidate you want to summarize. Please specify their name."

    # 5. Recommend Best Candidate / Why Candidate A ranked first
    if "recommend" in msg or "best candidate" in msg or "rank" in msg or "why" in msg:
        if not candidates:
            return "There are no candidates in the pool to analyze."
            
        # Sort candidates by AI Match Score or ATS Score
        sorted_cands = sorted(candidates, key=lambda x: x.get("matchScore", x.get("atsScore", 0)), reverse=True)
        best = sorted_cands[0]
        
        explanation = f"I recommend **{best['name']}** as the best fit candidate for this role.\n\n"
        explanation += f"**Reasoning:**\n"
        explanation += f"- **Highest Score:** They have an AI Match/ATS Score of **{best.get('matchScore', best.get('atsScore', 0))}**.\n"
        explanation += f"- **Experience:** {best.get('experience', 0)} years of relevant experience.\n"
        explanation += f"- **Key Skills:** Fits core requirements with {', '.join(best.get('skills', [])[:5])}.\n"
        
        if len(sorted_cands) > 1:
            second = sorted_cands[1]
            explanation += f"\nFor comparison, the second ranked candidate is **{second['name']}** (Score: {second.get('matchScore', second.get('atsScore', 0))}), but {best['name']} stands out due to "
            if best.get('experience', 0) > second.get('experience', 0):
                explanation += "greater industry experience."
            else:
                explanation += "a higher skill match and credentials."
                
        return explanation

    # Default Fallback
    return "I received your message. I can help you search, summarize profiles, rank candidates, or write interview questions. Ask me things like:\n- *'Recommend the best candidate for this role'* \n- *'Show me React developers'* \n- *'Summarize Candidate Name'*"

@app.post("/parse")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """Upload and parse a resume file (PDF/DOCX)"""
    try:
        # Securely write the file to the shared uploads folder
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".pdf", ".docx", ".doc", ".txt"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX or TXT.")
            
        save_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(save_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Parse resume details
        parsed_data = parse_resume(save_path)
        # Store relative file path for database entry
        parsed_data["resumePath"] = f"/uploads/{file.filename}"
        
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@app.post("/predict")
@app.post("/match")
def match_candidate_endpoint(data: MatchRequest):
    """Calculate match score / predict candidate fit between profile and job description"""
    try:
        result = calculate_match_score(data.candidate, data.job)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
def search_query_endpoint(data: SearchRequest):
    """Convert a natural language query into structured database filters"""
    try:
        filters = parse_natural_language_query(data.query)
        return filters
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/copilot")
def copilot_endpoint(data: CopilotRequest):
    """AI Hiring Copilot chat agent"""
    try:
        # Check if an external Gemini API key is configured
        api_key = os.getenv("GEMINI_API_KEY", "")
        
        if api_key:
            # Construct a rich prompt combining candidate data, job, and user message
            cand_summary = []
            for c in data.candidates:
                cand_summary.append({
                    "name": c.get("name"),
                    "skills": c.get("skills", []),
                    "experience": c.get("experience", 0),
                    "education": c.get("education", []),
                    "certifications": c.get("certifications", []),
                    "atsScore": c.get("atsScore", 0),
                    "matchScore": c.get("matchScore", 0),
                    "summary": c.get("summary", "")
                })
            
            prompt = f"""
            You are 'AI Hiring Copilot', an expert talent intelligence assistant for recruiters.
            You have access to a list of candidate profiles and an optional active job description.
            
            Active Job: {json.dumps(data.job) if data.job else 'None'}
            Candidates Pool: {json.dumps(cand_summary)}
            
            Recruiter's Message: "{data.message}"
            
            Respond directly to the recruiter's message. Be professional, detailed, and format your response beautifully using markdown formatting (bullet points, bold text, etc.). Do not output preambles about your model type.
            """
            
            response_text = call_gemini(prompt, api_key)
            if response_text:
                return {"reply": response_text}
                
        # If API key not present or Gemini call failed, run local rule engine
        reply = local_copilot_fallback(data.message, data.candidates, data.job)
        return {"reply": reply}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"status": "ok", "service": "ai-recruiter-service"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
