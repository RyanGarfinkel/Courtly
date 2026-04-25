import os

from courtlistener import CourtListener
from courtlistener.resource import ResourceIterator

DEFAULT_COURT = "scotus"
DEFAULT_LIMIT = 5


class CourtListenerClient:
    def __init__(self):
        self._client = CourtListener(api_token=os.getenv("COURTLISTENER_API_TOKEN"))

    def search_opinions(
        self,
        query: str,
        court: str = DEFAULT_COURT,
        limit: int = DEFAULT_LIMIT,
    ) -> list[dict]:
        iterator: ResourceIterator = self._client.search.list(
            type="o",
            q=query,
            court=court,
            order_by="score desc",
        )
        results = []
        for result in iterator:
            results.append(result)
            if len(results) >= limit:
                break
        return results

    def lookup_citations(self, text: str) -> list[dict]:
        return self._client.citation_lookup.lookup_text(text)

    def close(self):
        self._client.close()
