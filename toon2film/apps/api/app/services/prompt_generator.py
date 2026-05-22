from __future__ import annotations

from typing import Any

from app.models import Project, Shot
from app.services.openai_client import call_openai_json


PROMPT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["prompt_text", "negative_prompt"],
    "properties": {
        "prompt_text": {"type": "string"},
        "negative_prompt": {"type": "string"},
    },
}


class SeedancePromptGenerator:
    def generate(self, project: Project, shot: Shot) -> dict[str, str]:
        result = call_openai_json(
            schema_name="toon2film_seedance_prompt",
            schema=PROMPT_SCHEMA,
            system_prompt=(
                "You are Toon2Film's AI video prompt engineer. Create production-ready "
                "English prompts for Seedance-style cinematic video generation. Return strict JSON."
            ),
            user_content=(
                "Generate a professional cinematic video prompt and negative prompt.\n"
                f"Project title: {project.title}\n"
                f"Style: {project.style}\n"
                f"Language: {project.language}\n"
                f"Aspect ratio: {project.aspect_ratio}\n"
                f"Shot type: {shot.shot_type or 'medium shot'}\n"
                f"Camera movement: {shot.camera_movement or 'subtle controlled movement'}\n"
                f"Lens: {shot.lens or '32mm cinematic lens'}\n"
                f"Lighting: {shot.lighting or 'motivated cinematic lighting'}\n"
                f"Action: {shot.action_description or 'A focused dramatic story beat unfolds.'}\n"
                f"Duration: {shot.duration_seconds} seconds\n"
                "The prompt must include subject, character consistency, action, location, "
                "mood, camera, lens, lighting, visual style, duration, and aspect ratio."
            ),
            timeout_seconds=120,
        )
        return {
            "prompt_text": str(result["prompt_text"]),
            "negative_prompt": str(result["negative_prompt"]),
        }
