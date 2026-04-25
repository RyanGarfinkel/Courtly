import json
from app.clients.gemini import GeminiClient

SEARCH_PROMPT = """You are an advanced legal research assistant specializing in US Supreme Court jurisprudence.

YOUR TASK:
Find and return a list of US Supreme Court cases that match or are highly relevant to the provided criteria.

SEARCH CRITERIA:
- Main Query (Case name or topic): "{query}"
- Keywords: "{keywords}"
- {filters_text}

{exclude_text}

IMPORTANT GUIDELINES:
1. If keywords are provided, ensure the cases found are highly relevant to those specific legal concepts or facts.
2. If the main query is a single word or partial name, interpret it as a search for the full landmark case.
3. If the main query is empty but keywords are provided, find landmark cases that are defined by those keywords.
4. Provide a diverse and accurate list of up to {limit} cases.
5. DO NOT return any of the cases listed in the exclusion section above.

OUTPUT FORMAT:
Return ONLY a JSON array of objects. Each object must have these exact fields:
- id: a slugified version of the name (e.g., "roe-v-wade")
- name: the full official case name
- year: the year of the decision (as an integer)
- category: the primary legal topic
- summary: a concise 2-3 sentence summary of the case facts and its legal significance.
- citation: the standard legal citation

Respond ONLY with JSON. No markdown blocks.
"""

POPULAR_PROMPT = """You are a legal historian and educator.
Provide a list of {limit} landmark US Supreme Court cases that have shaped American history and law. 
Pick a diverse set of famous cases across different eras.

OUTPUT FORMAT:
Return ONLY a JSON array of objects. Each object must have these exact fields:
- id: a slugified version of the name
- name: full case name
- year: year of decision (integer)
- category: primary legal topic
- summary: a 2-3 sentence summary of the case and its significance.
- citation: the legal citation

Respond ONLY with JSON. No markdown blocks.
"""

DETAILS_PROMPT = """You are a legal expert. 
Provide detailed information for the following US Supreme Court case: "{case_id}"

Return the following information in JSON format:
- id: the original slug "{case_id}"
- name: full case name
- year: year of decision (integer)
- category: one or two words describing the legal issue
- summary: a detailed 3-4 paragraph summary of the case, its background, the legal question, and the Court's ruling.
- citation: the legal citation

Respond ONLY with JSON. No markdown blocks.
"""

def _clean_json_response(response: str) -> str:
    """Helper to remove markdown blocks and extra text from LLM response."""
    cleaned = response.strip()
    if "```" in cleaned:
        if "```json" in cleaned:
            parts = cleaned.split("```json")
            if len(parts) > 1:
                cleaned = parts[1].split("```")[0]
        else:
            parts = cleaned.split("```")
            if len(parts) > 1:
                cleaned = parts[1]
    return cleaned.strip()

def search_cases(query: str, limit: int = 5, category: str = None, year_from: int = None, year_to: int = None, exclude_ids: list[str] = None, keywords: str = None) -> list[dict]:
    client = GeminiClient()
    
    filters = []
    if category:
        filters.append(f"Category: {category}")
    if year_from:
        filters.append(f"Year from: {year_from}")
    if year_to:
        filters.append(f"Year to: {year_to}")
    
    filters_text = "FILTERS:\n- " + "\n- ".join(filters) if filters else ""
    
    exclude_text = ""
    if exclude_ids:
        exclude_text = "EXCLUDE THESE CASE IDs (already found):\n- " + "\n- ".join(exclude_ids)
    
    prompt = SEARCH_PROMPT.format(
        query=query or "None", 
        keywords=keywords or "None",
        limit=limit, 
        filters_text=filters_text, 
        exclude_text=exclude_text
    )
    
    try:
        response = client.generate(prompt)
        cleaned_response = _clean_json_response(response)
        cases = json.loads(cleaned_response)
        if isinstance(cases, list):
            return cases
        return []
    except Exception as e:
        print(f"Error in search_cases: {e}")
        return []

def get_popular_cases(limit: int = 9) -> list[dict]:
    client = GeminiClient()
    prompt = POPULAR_PROMPT.format(limit=limit)
    
    try:
        response = client.generate(prompt)
        cleaned_response = _clean_json_response(response)
        cases = json.loads(cleaned_response)
        if isinstance(cases, list):
            return cases
        return []
    except Exception as e:
        print(f"Error in get_popular_cases: {e}")
        return []

def get_case_details(case_id: str) -> dict | None:
    client = GeminiClient()
    prompt = DETAILS_PROMPT.format(case_id=case_id)
    
    try:
        response = client.generate(prompt)
        cleaned_response = _clean_json_response(response)
        case = json.loads(cleaned_response)
        return case
    except Exception as e:
        print(f"Error in get_case_details: {e}")
        return None
