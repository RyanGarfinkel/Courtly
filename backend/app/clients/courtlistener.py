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
        offset: int = 0,
    ) -> list[dict]:
        iterator: ResourceIterator = self._client.search.list(
            type="o",
            q=query,
            court=court,
            order_by="score desc",
        )
        results = []
        idx = 0
        for result in iterator:
            if idx < offset:
                idx += 1
                continue
            results.append(result)
            idx += 1
            if len(results) >= limit:
                break
        return results

    def lookup_citations(self, text: str) -> list[dict]:
        return self._client.citation_lookup.lookup_text(text)

    def close(self):
        self._client.close()
