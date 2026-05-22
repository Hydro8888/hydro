from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import AudioTrack, Export, Project, Prompt, Shot, VideoJob
from app.services.prompt_generator import SeedancePromptGenerator


class ProductionPipelineService:
    """Create the lightweight post-upload production artifacts.

    The real video provider submission remains opt-in, but after comic analysis
    the project should already have render-ready prompts, provider job drafts,
    subtitle text, and an export package draft.
    """

    def ensure_post_story_pipeline(self, project: Project, db: Session) -> dict[str, int]:
        shots = list(
            db.scalars(
                select(Shot)
                .where(Shot.project_id == project.id)
                .order_by(Shot.created_at, Shot.shot_number)
            ).all()
        )
        if not shots:
            return {"prompts": 0, "video_jobs": 0, "subtitle_tracks": 0, "exports": 0}

        prompt_count = self._ensure_prompts(project, shots, db)
        video_job_count = self._ensure_video_jobs(project, shots, db)
        subtitle_count = self._ensure_subtitle_track(project, shots, db)
        export_count = self._ensure_export_draft(project, db)
        has_output_draft = self._has_output_draft(project.id, db)

        project.status = "EXPORT_READY" if has_output_draft else "VIDEO_RENDER_READY"
        db.add(project)
        db.commit()

        return {
            "prompts": prompt_count,
            "video_jobs": video_job_count,
            "subtitle_tracks": subtitle_count,
            "exports": export_count,
        }

    def _ensure_prompts(self, project: Project, shots: list[Shot], db: Session) -> int:
        existing_shot_ids = {
            prompt.shot_id
            for prompt in db.scalars(select(Prompt).where(Prompt.project_id == project.id)).all()
        }
        generator = SeedancePromptGenerator()
        created = 0
        for shot in shots:
            if shot.id in existing_shot_ids:
                continue
            result = generator.generate(project=project, shot=shot)
            db.add(
                Prompt(
                    project_id=project.id,
                    shot_id=shot.id,
                    provider="seedance",
                    prompt_text=result["prompt_text"],
                    negative_prompt=result["negative_prompt"],
                    aspect_ratio=project.aspect_ratio,
                    duration_seconds=shot.duration_seconds,
                    model_name=settings.seedance_model,
                )
            )
            created += 1
        if created:
            db.flush()
        return created

    def _ensure_video_jobs(self, project: Project, shots: list[Shot], db: Session) -> int:
        existing_shot_ids = {
            job.shot_id
            for job in db.scalars(select(VideoJob).where(VideoJob.project_id == project.id)).all()
        }
        prompts_by_shot: dict[uuid.UUID, Prompt] = {
            prompt.shot_id: prompt
            for prompt in db.scalars(
                select(Prompt)
                .where(Prompt.project_id == project.id)
                .order_by(Prompt.created_at.desc())
            ).all()
        }
        provider_ready = bool(settings.seedance_api_key and settings.seedance_base_url)
        created = 0
        for shot in shots:
            if shot.id in existing_shot_ids:
                continue
            prompt = prompts_by_shot.get(shot.id)
            if prompt is None:
                continue
            db.add(
                VideoJob(
                    project_id=project.id,
                    shot_id=shot.id,
                    prompt_id=prompt.id,
                    provider=prompt.provider,
                    status="ready" if provider_ready else "provider_setup_required",
                    request_payload={
                        "prompt": prompt.prompt_text,
                        "negative_prompt": prompt.negative_prompt,
                        "duration": prompt.duration_seconds,
                        "aspect_ratio": prompt.aspect_ratio,
                        "model": prompt.model_name or settings.seedance_model,
                        "auto_created": True,
                    },
                    error_message=None
                    if provider_ready
                    else "SEEDANCE_BASE_URL and SEEDANCE_API_KEY are required before submitting.",
                )
            )
            created += 1
        if created:
            db.flush()
        return created

    def _ensure_subtitle_track(self, project: Project, shots: list[Shot], db: Session) -> int:
        existing = db.scalar(
            select(AudioTrack).where(
                AudioTrack.project_id == project.id,
                AudioTrack.track_type == "subtitle",
            )
        )
        if existing is not None:
            return 0

        lines = [
            f"{index + 1}. {shot.action_description or shot.shot_type or 'Cinematic story beat'}"
            for index, shot in enumerate(shots)
        ]
        db.add(
            AudioTrack(
                project_id=project.id,
                track_type="subtitle",
                transcript="\n".join(lines),
                metadata_json={
                    "format": "srt_draft",
                    "language": project.language,
                    "generated_from": "storyboard",
                },
            )
        )
        db.flush()
        return 1

    def _has_output_draft(self, project_id: uuid.UUID, db: Session) -> bool:
        export_exists = db.scalar(
            select(Export.id).where(
                Export.project_id == project_id,
                Export.export_type == "mp4",
            )
        )
        if export_exists is not None:
            return True

        subtitle_exists = db.scalar(
            select(AudioTrack.id).where(
                AudioTrack.project_id == project_id,
                AudioTrack.track_type == "subtitle",
            )
        )
        return subtitle_exists is not None

    def _ensure_export_draft(self, project: Project, db: Session) -> int:
        existing = db.scalar(
            select(Export).where(
                Export.project_id == project.id,
                Export.export_type == "mp4",
            )
        )
        if existing is not None:
            return 0

        db.add(
            Export(
                project_id=project.id,
                export_type="mp4",
                status="draft_ready",
                request_payload={
                    "project_id": str(project.id),
                    "includes": ["video_jobs", "subtitle_track", "storyboard", "prompt_package"],
                },
            )
        )
        db.flush()
        return 1
