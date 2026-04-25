import json as _json
import requests
import os

BASE_URL = "https://app.backboard.io/api"


class BackboardClient:
	def __init__(self):
		self.api_key = os.environ.get("BACKBOARD_API_KEY", "")
		self.headers = {"X-API-Key": self.api_key, "Content-Type": "application/json"}

	def create_thread(self, assistant_id: str) -> str:
		res = requests.post(
			f"{BASE_URL}/assistants/{assistant_id}/threads",
			headers=self.headers,
			json={},
			timeout=10,
		)
		res.raise_for_status()
		return res.json()["thread_id"]

	def get_thread(self, thread_id: str) -> dict:
		res = requests.get(
			f"{BASE_URL}/threads/{thread_id}",
			headers=self.headers,
			timeout=10,
		)
		res.raise_for_status()
		return res.json()

	def add_message(self, thread_id: str, content: str, send_to_llm: bool = False, metadata: dict | None = None) -> dict:
		payload: dict = {
			"content": content,
			"send_to_llm": "false" if not send_to_llm else "true",
		}
		if metadata:
			payload["metadata"] = _json.dumps(metadata)
		res = requests.post(
			f"{BASE_URL}/threads/{thread_id}/messages",
			headers=self.headers,
			json=payload,
			timeout=10,
		)
		res.raise_for_status()
		return res.json()
