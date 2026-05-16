from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    original_title: str | None = Field(default=None, max_length=200)
    project_type: str = "trailer"
    target_duration: int = 60
    style: str = "cinematic realism"
    language: str = "Korean"
    aspect_ratio: str = "16:9"
    rights_confirmed: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    original_title: str | None = Field(default=None, max_length=200)
    project_type: str | None = None
    target_duration: int | None = None
    style: str | None = None
    language: str | None = None
    aspect_ratio: str | None = None
    status: str | None = None
    rights_confirmed: bool | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
