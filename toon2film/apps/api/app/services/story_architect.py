from __future__ import annotations

import json
from typing import Any

from app.models import Character, Project, Scene, SourcePanel, StoryBible
from app.services.openai_client import call_openai_json


STORY_BIBLE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "title",
        "logline",
        "synopsis",
        "theme",
        "world_json",
        "three_act_json",
        "adaptation_notes",
    ],
    "properties": {
        "title": {"type": "string"},
        "logline": {"type": "string"},
        "synopsis": {"type": "string"},
        "theme": {"type": "string"},
        "world_json": {
            "type": "object",
            "additionalProperties": False,
            "required": ["setting", "visual_rules", "tone", "adaptation_constraints"],
            "properties": {
                "setting": {"type": "string"},
                "visual_rules": {"type": "string"},
                "tone": {"type": "string"},
                "adaptation_constraints": {"type": "string"},
            },
        },
        "three_act_json": {
            "type": "object",
            "additionalProperties": False,
            "required": ["act_1", "act_2", "act_3"],
            "properties": {
                "act_1": {"type": "string"},
                "act_2": {"type": "string"},
                "act_3": {"type": "string"},
            },
        },
        "adaptation_notes": {"type": "string"},
    },
}

SCENES_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["scenes"],
    "properties": {
        "scenes": {
            "type": "array",
            "minItems": 1,
            "maxItems": 8,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "scene_id",
                    "title",
                    "summary",
                    "location",
                    "time",
                    "emotion",
                    "duration_seconds",
                ],
                "properties": {
                    "scene_id": {"type": "integer"},
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                    "location": {"type": "string"},
                    "time": {"type": "string"},
                    "emotion": {"type": "string"},
                    "duration_seconds": {"type": "integer"},
                },
            },
        }
    },
}

CHARACTERS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["characters"],
    "properties": {
        "characters": {
            "type": "array",
            "minItems": 1,
            "maxItems": 8,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "name",
                    "role",
                    "appearance_description",
                    "personality",
                    "costume",
                    "reference_image_prompt",
                    "voice_style",
                ],
                "properties": {
                    "name": {"type": "string"},
                    "role": {"type": "string"},
                    "appearance_description": {"type": "string"},
                    "personality": {"type": "string"},
                    "costume": {"type": "string"},
                    "reference_image_prompt": {"type": "string"},
                    "voice_style": {"type": "string"},
                },
            },
        }
    },
}

STORYBOARD_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["storyboard"],
    "properties": {
        "storyboard": {
            "type": "array",
            "minItems": 1,
            "maxItems": 24,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "scene_id",
                    "shot_number",
                    "visual_prompt",
                    "camera_angle",
                    "camera_movement",
                    "lens",
                    "lighting",
                    "dialogue_or_action",
                    "duration_seconds",
                ],
                "properties": {
                    "scene_id": {"type": "integer"},
                    "shot_number": {"type": "integer"},
                    "visual_prompt": {"type": "string"},
                    "camera_angle": {"type": "string"},
                    "camera_movement": {"type": "string"},
                    "lens": {"type": "string"},
                    "lighting": {"type": "string"},
                    "dialogue_or_action": {"type": "string"},
                    "duration_seconds": {"type": "integer"},
                },
            },
        }
    },
}


class StoryArchitectService:
    system_prompt = (
        "You are Toon2Film's senior AI film development room: story architect, "
        "character director, storyboard supervisor, cinematographer, and prompt engineer. "
        "Use only the supplied project and uploaded comic analysis context. Return strict JSON."
    )

    def build_story_bible(self, project: Project, panels: list[SourcePanel]) -> dict[str, Any]:
        result = call_openai_json(
            schema_name="toon2film_story_bible",
            schema=STORY_BIBLE_SCHEMA,
            system_prompt=self.system_prompt,
            user_content=(
                "Create a professional film adaptation story bible from this comic analysis.\n"
                f"{self._project_context(project)}\n"
                f"Panel context JSON:\n{self._panel_context_json(panels)}"
            ),
            timeout_seconds=180,
        )
        return result

    def build_scenes(
        self, project: Project, story_bible: StoryBible, panels: list[SourcePanel]
    ) -> list[dict[str, Any]]:
        result = call_openai_json(
            schema_name="toon2film_scene_breakdown",
            schema=SCENES_SCHEMA,
            system_prompt=self.system_prompt,
            user_content=(
                "Break the story bible into film scenes for the next storyboard step.\n"
                f"{self._project_context(project)}\n"
                f"Story bible JSON:\n{self._story_bible_context_json(story_bible)}\n"
                f"Panel context JSON:\n{self._panel_context_json(panels)}"
            ),
            timeout_seconds=180,
        )
        return list(result.get("scenes") or [])

    def build_characters(
        self, project: Project, story_bible: StoryBible | None, panels: list[SourcePanel]
    ) -> list[dict[str, Any]]:
        result = call_openai_json(
            schema_name="toon2film_character_bible",
            schema=CHARACTERS_SCHEMA,
            system_prompt=self.system_prompt,
            user_content=(
                "Extract and design the recurring character bible from the uploaded comic analysis. "
                "Keep character identity stable for later image-to-video generation.\n"
                f"{self._project_context(project)}\n"
                f"Story bible JSON:\n{self._story_bible_context_json(story_bible)}\n"
                f"Panel context JSON:\n{self._panel_context_json(panels)}"
            ),
            timeout_seconds=180,
        )
        return list(result.get("characters") or [])

    def build_storyboard(
        self,
        project: Project,
        scenes: list[Scene],
        characters: list[Character],
        story_bible: StoryBible | None,
        panels: list[SourcePanel],
        max_shots: int = 24,
    ) -> list[dict[str, Any]]:
        result = call_openai_json(
            schema_name="toon2film_storyboard",
            schema=STORYBOARD_SCHEMA,
            system_prompt=self.system_prompt,
            user_content=(
                "Create a concise production storyboard. Every shot must be usable as a later "
                "video-generation prompt seed, with concrete camera, lens, lighting, and action.\n"
                f"Maximum shots: {max_shots}\n"
                f"{self._project_context(project)}\n"
                f"Story bible JSON:\n{self._story_bible_context_json(story_bible)}\n"
                f"Scenes JSON:\n{self._scene_context_json(scenes)}\n"
                f"Characters JSON:\n{self._character_context_json(characters)}\n"
                f"Panel context JSON:\n{self._panel_context_json(panels)}"
            ),
            timeout_seconds=180,
        )
        return list(result.get("storyboard") or [])[:max_shots]

    def _project_context(self, project: Project) -> str:
        return (
            "Project context: "
            f"title={project.title}; original_title={project.original_title or ''}; "
            f"type={project.project_type}; duration={project.target_duration}s; "
            f"style={project.style}; language={project.language}; aspect_ratio={project.aspect_ratio}."
        )

    def _panel_context_json(self, panels: list[SourcePanel]) -> str:
        panel_payload = [
            {
                "panel_number": panel.panel_number,
                "ocr_text": panel.ocr_text or "",
                "visual_description": panel.visual_description or "",
                "detected_characters": panel.detected_characters or [],
                "emotion": panel.emotion or "",
                "scene_hint": panel.scene_hint or "",
            }
            for panel in panels[:60]
        ]
        return json.dumps(panel_payload, ensure_ascii=False)

    def _story_bible_context_json(self, story_bible: StoryBible | None) -> str:
        if story_bible is None:
            return "{}"
        return json.dumps(
            {
                "title": story_bible.title,
                "logline": story_bible.logline or "",
                "synopsis": story_bible.synopsis or "",
                "theme": story_bible.theme or "",
                "world_json": story_bible.world_json or {},
                "three_act_json": story_bible.three_act_json or {},
                "adaptation_notes": story_bible.adaptation_notes or "",
            },
            ensure_ascii=False,
        )

    def _scene_context_json(self, scenes: list[Scene]) -> str:
        return json.dumps(
            [
                {
                    "scene_id": scene.scene_number,
                    "title": scene.title,
                    "summary": scene.summary or "",
                    "location": scene.location or "",
                    "time": scene.time_of_day or "",
                    "emotion": scene.emotion or "",
                    "duration_seconds": scene.duration_seconds or 0,
                }
                for scene in scenes
            ],
            ensure_ascii=False,
        )

    def _character_context_json(self, characters: list[Character]) -> str:
        return json.dumps(
            [
                {
                    "name": character.name,
                    "role": character.role or "",
                    "appearance": character.visual_description or "",
                    "personality": character.personality or "",
                    "costume": character.costume or "",
                    "prompt": character.prompt_description or "",
                }
                for character in characters
            ],
            ensure_ascii=False,
        )
