import re

# Standard skills for search mapping
AVAILABLE_SKILLS = [
    "react", "angular", "vue", "node.js", "nodejs", "express", "mongodb", "postgresql", "sql", "nosql",
    "python", "fastapi", "django", "flask", "aws", "gcp", "azure", "docker", "kubernetes", "git",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
    "java", "spring boot", "spring", "javascript", "typescript", "html", "css", "tailwind",
    "data science", "tableau", "power bi", "agile", "scrum", "devops", "ci/cd"
]

CITIES = [
    "pune", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai", "delhi", "noida",
    "gurgaon", "san francisco", "new york", "london", "berlin", "singapore", "toronto", "vancouver"
]

EDUCATION_KEYWORDS = {
    "btech": ["btech", "b.tech", "bachelor of technology"],
    "mtech": ["mtech", "m.tech", "master of technology"],
    "mba": ["mba", "master of business administration"],
    "phd": ["phd", "ph.d", "doctorate"],
    "mca": ["mca", "master of computer applications"],
    "bca": ["bca", "bachelor of computer applications"]
}

def parse_natural_language_query(query: str):
    """
    Parses a natural language search query and converts it into structured search filters.
    """
    query_lower = query.lower()
    
    filters = {
        "skills": [],
        "minExperience": None,
        "maxExperience": None,
        "location": None,
        "education": None,
        "originalQuery": query
    }
    
    # 1. Extract Skills
    for skill in AVAILABLE_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        # Handle special characters
        if skill in ["node.js", "spring boot"]:
            pattern = re.escape(skill)
            
        if re.search(pattern, query_lower):
            # Format skills nicely
            formatted = skill
            if skill == "nodejs": formatted = "Node.js"
            elif skill == "node.js": formatted = "Node.js"
            elif skill == "react": formatted = "React"
            elif skill == "aws": formatted = "AWS"
            elif skill == "gcp": formatted = "GCP"
            elif skill == "mongodb": formatted = "MongoDB"
            else:
                formatted = skill.title()
                
            if formatted not in filters["skills"]:
                filters["skills"].append(formatted)
                
    # 2. Extract Experience levels
    # Freshers
    if any(kwd in query_lower for kwd in ["fresher", "freshers", "entry level", "entry-level", "graduate", "graduates"]):
        filters["minExperience"] = 0
        filters["maxExperience"] = 1
    # Senior / Lead
    elif any(kwd in query_lower for kwd in ["senior", "sr.", "lead", "principal", "expert"]):
        filters["minExperience"] = 5
    # Junior
    elif any(kwd in query_lower for kwd in ["junior", "jr.", "associate"]):
        filters["minExperience"] = 1
        filters["maxExperience"] = 3
        
    # Pattern for years: "X years", "X+ years", "X-Y years"
    range_match = re.search(r'(\d+)\s*[-to]\s*(\d+)\s*(?:years?|yrs?)', query_lower)
    if range_match:
        filters["minExperience"] = int(range_match.group(1))
        filters["maxExperience"] = int(range_match.group(2))
    else:
        plus_match = re.search(r'(\d+)\s*\+?\s*(?:years?|yrs?|yr)\b', query_lower)
        if plus_match:
            val = int(plus_match.group(1))
            if "more than" in query_lower or "at least" in query_lower or "+" in query_lower or "above" in query_lower or "minimum" in query_lower:
                filters["minExperience"] = val
            elif "less than" in query_lower or "under" in query_lower or "maximum" in query_lower:
                filters["maxExperience"] = val
            else:
                # Default to minExperience if just "3 years"
                filters["minExperience"] = val

    # 3. Extract Location
    # Try finding after "in" keyword: e.g., "in Pune"
    in_location_match = re.search(r'\bin\s+([a-zA-Z\s]+)', query_lower)
    if in_location_match:
        loc_candidate = in_location_match.group(1).strip()
        # Clean up details (stop words)
        words = loc_candidate.split()
        for i, word in enumerate(words):
            if word in ["with", "having", "who", "having", "skills", "experience", "and", "or", "for"]:
                words = words[:i]
                break
        loc_candidate = " ".join(words).strip()
        if loc_candidate:
            # Match against known cities or just title-case the result
            matched_city = None
            for city in CITIES:
                if city in loc_candidate:
                    matched_city = city.title()
                    break
            filters["location"] = matched_city if matched_city else loc_candidate.title()
    else:
        # Fallback check against known cities list
        for city in CITIES:
            if re.search(r'\b' + re.escape(city) + r'\b', query_lower):
                filters["location"] = city.title()
                break

    # 4. Extract Education
    for edu_key, aliases in EDUCATION_KEYWORDS.items():
        for alias in aliases:
            if re.search(r'\b' + re.escape(alias) + r'\b', query_lower):
                filters["education"] = edu_key.upper()
                break
        if filters["education"]:
            break
            
    return filters
