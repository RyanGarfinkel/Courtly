from google.genai.errors import ServerError
from google import genai
import time
import os


MAX_RETRIES = 3
MODEL = "gemini-3.1-flash-lite-preview"

class GeminiClient:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            api_key = os.getenv("GEMINI_API_KEY")

            if not api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY is not set. Set it before calling Gemini-backed features."
                )

            self._client = genai.Client(api_key=api_key)

        return self._client

    def generate(self, prompt: str) -> str:
        for attempt in range(MAX_RETRIES):
            try:
                response = self._get_client().models.generate_content(
                    model=MODEL,
                    contents=prompt,
                )
                return response.text
            except ServerError as e:
                if e.status_code == 503 and attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise
