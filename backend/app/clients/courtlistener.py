import os
import re

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

    def get_cluster_judges(self, absolute_url: str) -> list[str] | None:
        match = re.search(r"/opinion/(\d+)/", absolute_url)
        if not match:
            return None
        cluster_id = match.group(1)
        try:
            cluster = self._client.clusters.get(cluster_id, fields=["judges"])
            judges_str = cluster.get("judges", "") or ""
            names = [n.strip() for n in judges_str.split(",") if n.strip()]
            return names or None
        except Exception:
            return None

    def lookup_citations(self, text: str) -> list[dict]:
        return self._client.citation_lookup.lookup_text(text)

    def close(self):
        self._client.close()
