from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SourceFileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    file_type: str
    file_url: str
    original_filename: str
    page_count: int | None
    status: str
    created_at: datetime


class StoryBibleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    title: str
    logline: str | None
    synopsis: str | None
    theme: str | None
    world_json: dict | None
    three_act_json: dict | None
    adaptation_notes: str | None
    created_at: datetime


class PromptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    shot_id: uuid.UUID
    provider: str
    prompt_text: str
    negative_prompt: str | None
    input_image_url: str | None
    aspect_ratio: str
    duration_seconds: int
    model_name: str | None
    created_at: datetime


class VideoJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    shot_id: uuid.UUID
    prompt_id: uuid.UUID | None
    provider: str
    external_job_id: str | None
    status: str
    request_payload: dict | None
    response_payload: dict | None
    error_message: str | None
    cost_estimate: float | None
    completed_at: datetime | None
    created_at: datetime
