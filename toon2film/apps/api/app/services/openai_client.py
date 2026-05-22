from __future__ import annotations

import json
from typing import Any

import httpx

from app.core.config import settings


class OpenAIAnalysisError(RuntimeError):
    pass


def _response_text(payload: dict[str, Any]) -> str:
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"]

    chunks: list[str] = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(content["text"])
    if chunks:
        return "\n".join(chunks)
    raise OpenAIAnalysisError("OpenAI response did not contain output text.")


def call_openai_json(
    *,
    schema_name: str,
    schema: dict[str, Any],
    system_prompt: str,
    user_content: str | list[dict[str, Any]],
    max_output_tokens: int | None = None,
    timeout_seconds: int = 180,
) -> dict[str, Any]:
    if not settings.openai_api_key:
        raise OpenAIAnalysisError(
            "OPENAI_API_KEY is required for Toon2Film AI analysis. "
            "Set it in apps/api/.env or the server environment and redeploy."
        )

    content = (
        [{"type": "input_text", "text": user_content}]
        if isinstance(user_content, str)
        else user_content
    )
    payload: dict[str, Any] = {
        "model": settings.openai_model,
        "reasoning": {"effort": settings.openai_reasoning_effort},
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {"role": "user", "content": content},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": schema,
            }
        },
        "max_output_tokens": max_output_tokens or settings.openai_max_output_tokens,
        "store": False,
    }

    try:
        response = httpx.post(
            f"{settings.openai_base_url.rstrip('/')}/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=timeout_seconds,
        )
    except httpx.HTTPError as exc:
        raise OpenAIAnalysisError(f"OpenAI request failed: {exc}") from exc

    if response.status_code >= 400:
        raise OpenAIAnalysisError(
            f"OpenAI request failed ({response.status_code}): {response.text[:1200]}"
        )

    text = _response_text(response.json())
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise OpenAIAnalysisError("OpenAI returned non-JSON output.") from exc
