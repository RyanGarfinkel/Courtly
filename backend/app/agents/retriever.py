from app.clients.courtlistener import CourtListenerClient
from app.clients.gemini import GeminiClient
from app.models.legal import Citation, LegalSource

QUOTE_PROMPT = """You are a legal research assistant. Given a legal query and a case snippet, extract the single most relevant quote from the snippet that directly supports or addresses the query.

Query: {query}

Case: {case_name}
Snippet: {snippet}

Respond in this exact format:
QUOTE: <the exact quote from the snippet>
EXPLANATION: <one sentence on why this quote is relevant to the query>

If the snippet has no relevant content, respond:
QUOTE: none
EXPLANATION: none"""


def run(query: str, court: str = "scotus", limit: int = 5) -> list[LegalSource]:
    cl_client = CourtListenerClient()
    gemini_client = GeminiClient()

    try:
        results = cl_client.search_opinions(query, court=court, limit=limit)
        sources = []

        for result in results:
            snippet = result.get("snippet", "").strip()
            case_name = result.get("caseName", "Unknown")
            citations = result.get("citation", [])
            date_filed = result.get("dateFiled", "")
            url = result.get("absolute_url", "")

            year = None
            if date_filed:
                try:
                    year = int(date_filed[:4])
                except ValueError:
                    pass

            citation = Citation(
                case_name=case_name,
                citation=citations[0] if citations else None,
                court=result.get("court_id"),
                year=year,
                url=f"https://www.courtlistener.com{url}" if url else None,
            )

            if not snippet:
                sources.append(LegalSource(
                    citation=citation,
                    relevant_quote="",
                    relevance_explanation="No snippet available.",
                ))
                continue

            prompt = QUOTE_PROMPT.format(
                query=query,
                case_name=case_name,
                snippet=snippet,
            )
            response = gemini_client.generate(prompt)

            quote = ""
            explanation = ""
            for line in response.splitlines():
                if line.startswith("QUOTE:"):
                    quote = line[len("QUOTE:"):].strip()
                elif line.startswith("EXPLANATION:"):
                    explanation = line[len("EXPLANATION:"):].strip()

            if quote == "none":
                quote = ""
                explanation = "No relevant content found in snippet."

            sources.append(LegalSource(
                citation=citation,
                relevant_quote=quote,
                relevance_explanation=explanation,
            ))

        return sources
    finally:
        cl_client.close()
