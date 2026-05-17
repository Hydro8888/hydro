from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    original_title: str | None = Field(default=None, max_length=200)
    project_type: str = Field(default="trailer", min_length=1, max_length=50)
    target_duration: int = Field(default=60, ge=1, le=3600)
    style: str = Field(default="cinematic realism", min_length=1, max_length=100)
    language: str = Field(default="Korean", min_length=1, max_length=40)
    aspect_ratio: str = Field(default="16:9", min_length=1, max_length=20)
    rights_confirmed: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    original_title: str | None = Field(default=None, max_length=200)
    project_type: str | None = Field(default=None, min_length=1, max_length=50)
    target_duration: int | None = Field(default=None, ge=1, le=3600)
    style: str | None = Field(default=None, min_length=1, max_length=100)
    language: str | None = Field(default=None, min_length=1, max_length=40)
    aspect_ratio: str | None = Field(default=None, min_length=1, max_length=20)
    status: str | None = Field(default=None, min_length=1, max_length=40)
    rights_confirmed: bool | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
