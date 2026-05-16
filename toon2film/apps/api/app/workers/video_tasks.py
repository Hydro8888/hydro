from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import Prompt, VideoJob
from app.services.video_providers import SeedanceProvider, VideoJobInput
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def create_video_job_task(self, video_job_id: str) -> dict[str, str | None]:
    del self
    db = SessionLocal()
    try:
        video_job = db.get(VideoJob, uuid.UUID(video_job_id))
        if video_job is None:
            raise ValueError("Video job not found")
        prompt = db.get(Prompt, video_job.prompt_id) if video_job.prompt_id else None
        if prompt is None:
            raise ValueError("Prompt not found")

        video_job.status = "submitting"
        db.add(video_job)
        db.commit()

        try:
            provider = SeedanceProvider()
            result = asyncio.run(
                provider.create_video_job(
                    VideoJobInput(
                        prompt=prompt.prompt_text,
                        negative_prompt=prompt.negative_prompt,
                        duration_seconds=prompt.duration_seconds,
                        aspect_ratio=prompt.aspect_ratio,
                        model_name=prompt.model_name or settings.seedance_model,
                        input_image_url=prompt.input_image_url,
                    )
                )
            )
        except RuntimeError as exc:
            video_job.status = "blocked"
            video_job.error_message = str(exc)
            db.add(video_job)
            db.commit()
            return {"status": "blocked", "error": str(exc)}

        video_job.external_job_id = result.external_job_id
        video_job.status = result.status
        video_job.request_payload = result.request_payload
        video_job.response_payload = result.response_payload
        video_job.cost_estimate = result.cost_estimate
        if result.status in {"completed", "succeeded"}:
            video_job.completed_at = datetime.now(UTC)
        db.add(video_job)
        db.commit()
        return {"status": video_job.status, "external_job_id": video_job.external_job_id}
    finally:
        db.close()
