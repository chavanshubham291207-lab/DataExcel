import re

def calculate_match_score(candidate, job):
    """
    Calculates the AI Match Score (0-100) between a candidate and a job.
    Uses skill matching, experience alignment, and education checks.
    """
    score_weights = {
        "skills": 0.50,       # 50% based on skill matching
        "experience": 0.35,   # 35% based on experience alignment
        "education": 0.15     # 15% based on education requirements
    }
    
    # 1. Skills Matching
    cand_skills = [s.lower() for s in candidate.get("skills", [])]
    job_skills_raw = job.get("requiredSkills", [])
    if isinstance(job_skills_raw, str):
        # If it's a comma separated string
        job_skills = [s.strip().lower() for s in job_skills_raw.split(",") if s.strip()]
    else:
        job_skills = [s.lower() for s in job_skills_raw if s]
        
    if not job_skills:
        skill_score = 100
        missing_skills = []
    else:
        matched_skills = [s for s in job_skills if any(s in cs or cs in s for cs in cand_skills)]
        skill_score = (len(matched_skills) / len(job_skills)) * 100
        missing_skills = [s.title() for s in job_skills if s not in matched_skills]

    # 2. Experience Alignment
    # Estimate required experience from job fields. Job might have "experience" as a string or number.
    job_exp = job.get("experience", "0")
    req_exp = 0
    # Extract digit from experience string, e.g. "3-5 years" -> 3 or "3+ years" -> 3
    exp_digits = re.findall(r'\d+', str(job_exp))
    if exp_digits:
        req_exp = int(exp_digits[0])
        
    cand_exp = int(candidate.get("experience", 0))
    
    if cand_exp >= req_exp:
        # Candidate has enough experience
        exp_score = 100
        # Give small bonus for extra experience up to +5%, but cap at 100
        if cand_exp > req_exp + 3:
            exp_score = 100
    else:
        # Candidate has less experience
        if req_exp > 0:
            exp_score = (cand_exp / req_exp) * 100
        else:
            exp_score = 100
            
    # 3. Education Match
    job_edu = str(job.get("education", "")).lower()
    cand_edu_list = [str(e).lower() for e in candidate.get("education", [])]
    
    edu_score = 70 # Default starting score if some education details exist
    if not job_edu or job_edu == "any" or job_edu == "none":
        edu_score = 100
    else:
        # Check if degree words match
        edu_keywords = ["bachelor", "master", "phd", "btech", "mtech", "b.tech", "m.tech", "mba", "mca", "bca"]
        matched_edu = False
        for kw in edu_keywords:
            if kw in job_edu:
                # Job requires this keyword. Check if candidate has it
                if any(kw in ce for ce in cand_edu_list):
                    matched_edu = True
                    break
        if matched_edu:
            edu_score = 100
        elif len(cand_edu_list) > 0:
            # Candidate has education but not exact degree match
            edu_score = 80
        else:
            edu_score = 50

    # Calculate weighted score
    final_score = (
        (skill_score * score_weights["skills"]) +
        (exp_score * score_weights["experience"]) +
        (edu_score * score_weights["education"])
    )
    
    # Bound check
    final_score = max(min(round(final_score), 100), 10)
    
    return {
        "matchScore": final_score,
        "skillScore": round(skill_score),
        "experienceScore": round(exp_score),
        "educationScore": round(edu_score),
        "missingSkills": missing_skills,
        "relevanceExplanation": generate_explanation(final_score, cand_exp, req_exp, len(missing_skills))
    }

def generate_explanation(score, cand_exp, req_exp, missing_skills_count):
    if score >= 85:
        return f"Excellent match! Candidate's experience ({cand_exp} years) meets/exceeds the job requirements ({req_exp} years), and they possess almost all required skills."
    elif score >= 70:
        return f"Good match. Strong overlap in core requirements, though candidate is missing {missing_skills_count} skills or has slightly different experience levels."
    elif score >= 50:
        return f"Potential match. Candidate has related skills but lacks key requirements or has less experience ({cand_exp} years vs {req_exp} years required)."
    else:
        return "Low match score. Significant gap in required skills and experience levels."
