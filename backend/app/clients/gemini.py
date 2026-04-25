import os

from google import genai

MODEL = "gemini-3.1-flash"


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
        response = self._get_client().models.generate_content(
            model=MODEL,
            contents=prompt,
        )
        return response.text
