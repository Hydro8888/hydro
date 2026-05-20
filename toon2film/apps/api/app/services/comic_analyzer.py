from __future__ import annotations

import base64
import io
import json
import uuid
import zipfile
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Character, Project, Scene, Shot, SourceFile, SourcePage, SourcePanel, StoryBible
from app.services.production_pipeline import ProductionPipelineService
from app.workers.source_tasks import normalize_local_url


class ComicAnalysisError(RuntimeError):
    pass


ANALYSIS_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["pages", "story_analysis", "characters", "storyboard"],
    "properties": {
        "pages": {
            "type": "array",
            "maxItems": 12,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["page_number", "panels"],
                "properties": {
                    "page_number": {"type": "integer"},
                    "panels": {
                        "type": "array",
                        "maxItems": 12,
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "panel_number",
                                "bbox",
                                "ocr_text",
                                "visual_description",
                                "detected_characters",
                                "emotion",
                                "scene_hint",
                            ],
                            "properties": {
                                "panel_number": {"type": "integer"},
                                "bbox": {
                                    "type": "object",
                                    "additionalProperties": False,
                                    "required": ["x", "y", "width", "height"],
                                    "properties": {
                                        "x": {"type": "number"},
                                        "y": {"type": "number"},
                                        "width": {"type": "number"},
                                        "height": {"type": "number"},
                                    },
                                },
                                "ocr_text": {"type": "string"},
                                "visual_description": {"type": "string"},
                                "detected_characters": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "maxItems": 8,
                                },
                                "emotion": {"type": "string"},
                                "scene_hint": {"type": "string"},
                            },
                        },
                    },
                },
            },
        },
        "story_analysis": {
            "type": "object",
            "additionalProperties": False,
            "required": ["logline", "synopsis", "theme", "three_act", "scenes"],
            "properties": {
                "logline": {"type": "string"},
                "synopsis": {"type": "string"},
                "theme": {"type": "string"},
                "three_act": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["act_1", "act_2", "act_3"],
                    "properties": {
                        "act_1": {"type": "string"},
                        "act_2": {"type": "string"},
                        "act_3": {"type": "string"},
                    },
                },
                "scenes": {
                    "type": "array",
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
                },
            },
        },
        "characters": {
            "type": "array",
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
                ],
                "properties": {
                    "name": {"type": "string"},
                    "role": {"type": "string"},
                    "appearance_description": {"type": "string"},
                    "personality": {"type": "string"},
                    "costume": {"type": "string"},
                    "reference_image_prompt": {"type": "string"},
                },
            },
        },
        "storyboard": {
            "type": "array",
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
        },
    },
}


class ComicAnalyzerService:
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    def analyze_source_file(self, source_file: SourceFile, project: Project, db: Session) -> dict[str, Any]:
        page_paths = self._extract_page_images(source_file, project)
        if not page_paths:
            raise ComicAnalysisError("No readable comic pages were found in the uploaded file.")

        if not settings.openai_api_key:
            analysis = self._fallback_analysis(source_file, project, page_paths)
        else:
            analysis = self._call_openai(project, source_file, page_paths)

        self._persist_analysis(source_file, project, page_paths, analysis, db)
        return analysis

    def _extract_page_images(self, source_file: SourceFile, project: Project) -> list[Path]:
        source_path = normalize_local_url(source_file.file_url)
        output_dir = Path("uploads") / str(project.id) / "analyzed" / str(source_file.id)
        output_dir.mkdir(parents=True, exist_ok=True)

        suffix = source_path.suffix.lower()
        if suffix == ".pdf":
            return self._extract_pdf_pages(source_path, output_dir)
        if suffix == ".zip":
            return self._extract_zip_pages(source_path, output_dir)
        if suffix in self.image_extensions:
            return [self._save_normalized_image(source_path, output_dir / "page-001.jpg")]
        return []

    def _extract_pdf_pages(self, source_path: Path, output_dir: Path) -> list[Path]:
        import fitz
        from PIL import Image

        pages: list[Path] = []
        with fitz.open(source_path) as document:
            page_total = min(document.page_count, settings.openai_max_pages)
            for page_index in range(page_total):
                page = document.load_page(page_index)
                index = page_index + 1
                pixmap = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
                image = Image.open(io.BytesIO(pixmap.tobytes("png")))
                target = output_dir / f"page-{index:03d}.jpg"
                pages.append(self._save_pil_image(image, target))
        return pages

    def _extract_zip_pages(self, source_path: Path, output_dir: Path) -> list[Path]:
        from PIL import Image

        pages: list[Path] = []
        with zipfile.ZipFile(source_path) as archive:
            names = [
                name
                for name in sorted(archive.namelist())
                if Path(name).suffix.lower() in self.image_extensions and not name.endswith("/")
            ][: settings.openai_max_pages]
            for index, name in enumerate(names, start=1):
                with archive.open(name) as source:
                    image = Image.open(io.BytesIO(source.read()))
                    pages.append(self._save_pil_image(image, output_dir / f"page-{index:03d}.jpg"))
        return pages

    def _save_normalized_image(self, source_path: Path, target: Path) -> Path:
        from PIL import Image

        with Image.open(source_path) as image:
            return self._save_pil_image(image, target)

    def _save_pil_image(self, image: Any, target: Path) -> Path:
        from PIL import ImageOps

        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1800, 1800))
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "JPEG", quality=84, optimize=True)
        return target

    def _call_openai(
        self, project: Project, source_file: SourceFile, page_paths: list[Path]
    ) -> dict[str, Any]:
        input_content: list[dict[str, Any]] = [
            {
                "type": "input_text",
                "text": (
                    "Analyze these comic or manga pages in reading order. Return only the JSON "
                    "matching the schema. Extract OCR text when visible, infer panels, story, "
                    "characters, and storyboard shots for AI film production. Keep names stable. "
                    f"Project title: {project.title}. Style: {project.style}. "
                    f"Language: {project.language}. Target duration: {project.target_duration}s. "
                    f"Source filename: {source_file.original_filename}."
                ),
            }
        ]
        for index, path in enumerate(page_paths, start=1):
            input_content.append({"type": "input_text", "text": f"Page {index}"})
            input_content.append({"type": "input_image", "image_url": self._image_data_url(path)})

        payload: dict[str, Any] = {
            "model": settings.openai_model,
            "reasoning": {"effort": settings.openai_reasoning_effort},
            "input": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "You are Toon2Film's AI story architect, character director, "
                                "OCR reviewer, and storyboard artist. You convert uploaded comics "
                                "into production-ready structured data."
                            ),
                        }
                    ],
                },
                {"role": "user", "content": input_content},
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "toon2film_comic_analysis",
                    "strict": True,
                    "schema": ANALYSIS_SCHEMA,
                }
            },
            "max_output_tokens": settings.openai_max_output_tokens,
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
                timeout=180,
            )
        except httpx.HTTPError as exc:
            raise ComicAnalysisError(f"OpenAI analysis request failed: {exc}") from exc
        if response.status_code >= 400:
            raise ComicAnalysisError(
                f"OpenAI analysis failed ({response.status_code}): {response.text[:1200]}"
            )

        text = self._response_text(response.json())
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise ComicAnalysisError("OpenAI returned non-JSON analysis output.") from exc

    def _image_data_url(self, path: Path) -> str:
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"

    def _response_text(self, payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]

        chunks: list[str] = []
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"} and content.get("text"):
                    chunks.append(content["text"])
        if chunks:
            return "\n".join(chunks)
        raise ComicAnalysisError("OpenAI response did not contain output text.")

    def _fallback_analysis(
        self, source_file: SourceFile, project: Project, page_paths: list[Path]
    ) -> dict[str, Any]:
        return {
            "pages": [
                {
                    "page_number": index,
                    "panels": [
                        {
                            "panel_number": 1,
                            "bbox": {"x": 0, "y": 0, "width": 1, "height": 1},
                            "ocr_text": "",
                            "visual_description": (
                                "Uploaded comic page awaiting OpenAI visual analysis. "
                                f"Source file: {source_file.original_filename}."
                            ),
                            "detected_characters": ["Lead Character"],
                            "emotion": "unknown",
                            "scene_hint": "Opening source beat",
                        }
                    ],
                }
                for index, _ in enumerate(page_paths, start=1)
            ],
            "story_analysis": {
                "logline": f"A {project.style} adaptation created from uploaded comic source pages.",
                "synopsis": (
                    "The project contains uploaded comic pages. Set OPENAI_API_KEY to enable "
                    "full multimodal OCR, story analysis, character extraction, and storyboard planning."
                ),
                "theme": "Cinematic transformation from static comic panels.",
                "three_act": {
                    "act_1": "Introduce the source world and lead character.",
                    "act_2": "Escalate conflict through selected comic panels.",
                    "act_3": "Resolve with a strong cinematic hook.",
                },
                "scenes": [
                    {
                        "scene_id": 1,
                        "title": "Opening Source Beat",
                        "summary": "First uploaded pages define the cinematic opening.",
                        "location": "Source location",
                        "time": "day",
                        "emotion": "curiosity",
                        "duration_seconds": 12,
                    }
                ],
            },
            "characters": [
                {
                    "name": "Lead Character",
                    "role": "protagonist",
                    "appearance_description": "Main recurring figure from the uploaded comic pages.",
                    "personality": "Goal-driven and emotionally readable.",
                    "costume": "Consistent costume inferred from the source artwork.",
                    "reference_image_prompt": (
                        f"Lead Character, {project.style}, consistent cinematic character design"
                    ),
                }
            ],
            "storyboard": [
                {
                    "scene_id": 1,
                    "shot_number": 1,
                    "visual_prompt": "Establish the uploaded comic world as a cinematic opening image.",
                    "camera_angle": "Wide shot",
                    "camera_movement": "slow push in",
                    "lens": "24mm cinematic lens",
                    "lighting": "motivated atmospheric light",
                    "dialogue_or_action": "The world is introduced through the source panels.",
                    "duration_seconds": 5,
                }
            ],
        }

    def _persist_analysis(
        self,
        source_file: SourceFile,
        project: Project,
        page_paths: list[Path],
        analysis: dict[str, Any],
        db: Session,
    ) -> None:
        existing_pages = db.scalars(
            select(SourcePage).where(SourcePage.source_file_id == source_file.id)
        ).all()
        for page in existing_pages:
            db.delete(page)
        db.flush()

        page_by_number: dict[int, SourcePage] = {}
        for page_payload in analysis.get("pages", []):
            page_number = int(page_payload.get("page_number") or 1)
            image_path = page_paths[min(page_number - 1, len(page_paths) - 1)]
            page = SourcePage(
                project_id=project.id,
                source_file_id=source_file.id,
                page_number=page_number,
                image_url=f"local://{image_path.as_posix()}",
                analysis_json=page_payload,
            )
            db.add(page)
            db.flush()
            page_by_number[page_number] = page

            for panel_payload in page_payload.get("panels", []):
                db.add(
                    SourcePanel(
                        project_id=project.id,
                        page_id=page.id,
                        panel_number=int(panel_payload.get("panel_number") or 1),
                        image_url=page.image_url,
                        bbox_json=panel_payload.get("bbox") or {},
                        ocr_text=panel_payload.get("ocr_text") or None,
                        visual_description=panel_payload.get("visual_description") or None,
                        detected_characters=panel_payload.get("detected_characters") or [],
                        emotion=panel_payload.get("emotion") or None,
                        scene_hint=panel_payload.get("scene_hint") or None,
                    )
                )

        source_file.page_count = len(page_by_number) or len(page_paths)
        source_file.status = "analyzed" if settings.openai_api_key else "processed_without_ai"

        story_payload = analysis.get("story_analysis") or {}
        story_bible = self._latest_story_bible(project.id, db)
        story_values = {
            "title": project.title,
            "logline": story_payload.get("logline") or "",
            "synopsis": story_payload.get("synopsis") or "",
            "theme": story_payload.get("theme") or "",
            "world_json": {
                "language": project.language,
                "style": project.style,
                "aspect_ratio": project.aspect_ratio,
                "source_file_id": str(source_file.id),
            },
            "three_act_json": story_payload.get("three_act") or {},
            "adaptation_notes": "Generated from uploaded comic pages by the Toon2Film analysis pipeline.",
        }
        if story_bible is None:
            db.add(StoryBible(project_id=project.id, **story_values))
        else:
            for key, value in story_values.items():
                setattr(story_bible, key, value)
            db.add(story_bible)

        scenes = self._upsert_scenes(project, story_payload.get("scenes") or [], db)
        self._upsert_characters(project, analysis.get("characters") or [], db)
        if not self._project_shots(project.id, db):
            self._create_storyboard(project, scenes, analysis.get("storyboard") or [], db)

        project.status = "STORYBOARD_READY" if self._project_shots(project.id, db) else "STORY_ANALYZED"
        db.add_all([project, source_file])
        db.commit()
        if self._project_shots(project.id, db):
            ProductionPipelineService().ensure_post_story_pipeline(project, db)

    def _latest_story_bible(self, project_id: uuid.UUID, db: Session) -> StoryBible | None:
        return db.scalars(
            select(StoryBible)
            .where(StoryBible.project_id == project_id)
            .order_by(StoryBible.created_at.desc())
        ).first()

    def _project_shots(self, project_id: uuid.UUID, db: Session) -> list[Shot]:
        return list(db.scalars(select(Shot).where(Shot.project_id == project_id)).all())

    def _upsert_scenes(
        self, project: Project, scene_payloads: list[dict[str, Any]], db: Session
    ) -> list[Scene]:
        if not scene_payloads:
            scene_payloads = [
                {
                    "scene_id": 1,
                    "title": "Opening Scene",
                    "summary": "The uploaded comic source defines the opening cinematic beat.",
                    "location": "Source location",
                    "time": "day",
                    "emotion": "curiosity",
                    "duration_seconds": 10,
                }
            ]
        existing = {
            scene.scene_number: scene
            for scene in db.scalars(
                select(Scene).where(Scene.project_id == project.id).order_by(Scene.scene_number)
            ).all()
        }
        scenes: list[Scene] = []
        for index, payload in enumerate(scene_payloads[:8], start=1):
            scene_number = int(payload.get("scene_id") or index)
            values = {
                "title": payload.get("title") or f"Scene {scene_number}",
                "location": payload.get("location") or None,
                "time_of_day": payload.get("time") or None,
                "summary": payload.get("summary") or "",
                "emotion": payload.get("emotion") or None,
                "source_panel_ids": [],
                "duration_seconds": int(payload.get("duration_seconds") or 10),
            }
            scene = existing.get(scene_number)
            if scene is None:
                scene = Scene(project_id=project.id, scene_number=scene_number, **values)
            else:
                for key, value in values.items():
                    setattr(scene, key, value)
            db.add(scene)
            db.flush()
            scenes.append(scene)
        return scenes

    def _upsert_characters(
        self, project: Project, character_payloads: list[dict[str, Any]], db: Session
    ) -> None:
        existing = {
            character.name.lower(): character
            for character in db.scalars(select(Character).where(Character.project_id == project.id)).all()
        }
        for payload in character_payloads[:8]:
            name = (payload.get("name") or "Character").strip()
            key = name.lower()
            values = {
                "role": payload.get("role") or "supporting",
                "visual_description": payload.get("appearance_description") or "",
                "personality": payload.get("personality") or "",
                "costume": payload.get("costume") or "",
                "prompt_description": payload.get("reference_image_prompt") or "",
            }
            character = existing.get(key)
            if character is None:
                character = Character(project_id=project.id, name=name, **values)
            else:
                for attr, value in values.items():
                    setattr(character, attr, value)
            db.add(character)

    def _create_storyboard(
        self,
        project: Project,
        scenes: list[Scene],
        storyboard_payloads: list[dict[str, Any]],
        db: Session,
    ) -> None:
        scene_map = {scene.scene_number: scene for scene in scenes}
        for index, payload in enumerate(storyboard_payloads[:24], start=1):
            scene_number = int(payload.get("scene_id") or 1)
            scene = scene_map.get(scene_number) or (scenes[0] if scenes else None)
            if scene is None:
                continue
            db.add(
                Shot(
                    project_id=project.id,
                    scene_id=scene.id,
                    shot_number=int(payload.get("shot_number") or index),
                    shot_type=payload.get("camera_angle") or "Medium shot",
                    camera_movement=payload.get("camera_movement") or "locked",
                    lens=payload.get("lens") or "35mm cinematic lens",
                    lighting=payload.get("lighting") or "",
                    action_description=payload.get("dialogue_or_action")
                    or payload.get("visual_prompt")
                    or "",
                    duration_seconds=int(payload.get("duration_seconds") or 5),
                    status="ready",
                )
            )
