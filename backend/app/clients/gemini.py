import os

from google import genai

MODEL = "gemini-2.0-flash"


class GeminiClient:
    def __init__(self):
        self._client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def generate(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )
        return response.text
