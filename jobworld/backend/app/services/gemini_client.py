"""Centralized Gemini client helper with safe initialization and observability."""
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def get_client():
    """
    Create and return a Gemini client.
    Logs API key presence (boolean only - never logs the key value).
    Returns None if GEMINI_API_KEY is not configured.
    """
    has_key = bool(settings.gemini_api_key)
    logger.info("[Gemini] API key present: %s | model: %s", has_key, settings.gemini_model)

    if not has_key:
        logger.warning("[Gemini] GEMINI_API_KEY not set — AI features disabled")
        return None

    from google import genai
    return genai.Client(api_key=settings.gemini_api_key)


def parse_json_safe(text: str) -> Optional[dict]:
    """
    Robustly parse a JSON response from Gemini.
    Handles: clean JSON, JSON in ```json blocks, partial JSON.
    Returns None on failure.
    """
    import json
    import re

    if not text:
        return None

    text = text.strip()

    # Remove markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting the first JSON object or array in the text
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    logger.warning("[Gemini] Failed to parse JSON from response: %s", text[:200])
    return None
