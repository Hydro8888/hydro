from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import Project, Prompt, Shot
from app.schemas import PromptRead
from app.services.openai_client import OpenAIAnalysisError
from app.services.prompt_generator import SeedancePromptGenerator

router = APIRouter()


@router.post(
    "/shots/{shot_id}/generate-prompt",
    response_model=PromptRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_prompt(shot_id: uuid.UUID, db: Session = Depends(get_db)) -> Prompt:
    shot = db.get(Shot, shot_id)
    if shot is None:
        raise HTTPException(status_code=404, detail="Shot not found")
    project = db.get(Project, shot.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        result = SeedancePromptGenerator().generate(project=project, shot=shot)
    except OpenAIAnalysisError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    prompt = Prompt(
        project_id=shot.project_id,
        shot_id=shot.id,
        provider="seedance",
        prompt_text=result["prompt_text"],
        negative_prompt=result["negative_prompt"],
        aspect_ratio=project.aspect_ratio,
        duration_seconds=shot.duration_seconds,
        model_name=settings.seedance_model,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.patch("/prompts/{prompt_id}", response_model=PromptRead)
def update_prompt(
    prompt_id: uuid.UUID, payload: dict, db: Session = Depends(get_db)
) -> Prompt:
    prompt = db.get(Prompt, prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")

    allowed = {"prompt_text", "negative_prompt", "input_image_url", "aspect_ratio", "duration_seconds"}
    for key, value in payload.items():
        if key in allowed:
            setattr(prompt, key, value)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.post("/prompts/{prompt_id}/translate")
def translate_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    prompt = db.get(Prompt, prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"prompt_text": prompt.prompt_text, "language": "en"}
