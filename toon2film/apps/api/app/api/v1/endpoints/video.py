from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Prompt, VideoJob
from app.schemas import VideoJobRead

router = APIRouter()


@router.post(
    "/shots/{shot_id}/generate-video",
    response_model=VideoJobRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_video(
    shot_id: uuid.UUID, prompt_id: uuid.UUID | None = None, db: Session = Depends(get_db)
) -> VideoJob:
    prompt = None
    if prompt_id is not None:
        prompt = db.get(Prompt, prompt_id)
        if prompt is None:
            raise HTTPException(status_code=404, detail="Prompt not found")
    else:
        prompt = db.scalar(
            select(Prompt)
            .where(Prompt.shot_id == shot_id)
            .order_by(Prompt.created_at.desc())
        )

    if prompt is None:
        raise HTTPException(status_code=400, detail="A prompt is required before video generation")

    video_job = VideoJob(
        project_id=prompt.project_id,
        shot_id=shot_id,
        prompt_id=prompt.id,
        provider=prompt.provider,
        status="queued",
        request_payload={
            "prompt": prompt.prompt_text,
            "negative_prompt": prompt.negative_prompt,
            "duration": prompt.duration_seconds,
            "aspect_ratio": prompt.aspect_ratio,
        },
    )
    db.add(video_job)
    db.commit()
    db.refresh(video_job)

    from app.workers.video_tasks import create_video_job_task

    create_video_job_task.delay(str(video_job.id))
    return video_job


@router.get("/video-jobs/{job_id}", response_model=VideoJobRead)
def get_video_job(job_id: uuid.UUID, db: Session = Depends(get_db)) -> VideoJob:
    video_job = db.get(VideoJob, job_id)
    if video_job is None:
        raise HTTPException(status_code=404, detail="Video job not found")
    return video_job


@router.post("/video-jobs/{job_id}/retry", response_model=VideoJobRead)
def retry_video_job(job_id: uuid.UUID, db: Session = Depends(get_db)) -> VideoJob:
    video_job = db.get(VideoJob, job_id)
    if video_job is None:
        raise HTTPException(status_code=404, detail="Video job not found")
    video_job.status = "queued"
    video_job.error_message = None
    db.add(video_job)
    db.commit()
    db.refresh(video_job)
    return video_job


@router.post("/video-jobs/{job_id}/cancel", response_model=VideoJobRead)
def cancel_video_job(job_id: uuid.UUID, db: Session = Depends(get_db)) -> VideoJob:
    video_job = db.get(VideoJob, job_id)
    if video_job is None:
        raise HTTPException(status_code=404, detail="Video job not found")
    video_job.status = "cancelled"
    db.add(video_job)
    db.commit()
    db.refresh(video_job)
    return video_job


@router.get("/projects/{project_id}/clips")
def list_clips(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(
        select(VideoJob).where(VideoJob.project_id == project_id).order_by(VideoJob.created_at.desc())
    ).scalars()
    return [
        {
            "job_id": str(job.id),
            "status": job.status,
            "external_job_id": job.external_job_id,
        }
        for job in rows
    ]
