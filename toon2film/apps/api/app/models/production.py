from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    hashed_password: Mapped[str | None] = mapped_column(String(255))

    projects: Mapped[list[Project]] = relationship(back_populates="user")


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    title: Mapped[str] = mapped_column(String(200), index=True)
    original_title: Mapped[str | None] = mapped_column(String(200))
    project_type: Mapped[str] = mapped_column(String(50), default="trailer")
    target_duration: Mapped[int] = mapped_column(Integer, default=60)
    style: Mapped[str] = mapped_column(String(100), default="cinematic realism")
    language: Mapped[str] = mapped_column(String(40), default="Korean")
    aspect_ratio: Mapped[str] = mapped_column(String(20), default="16:9")
    status: Mapped[str] = mapped_column(String(40), default="draft", index=True)
    rights_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User | None] = relationship(back_populates="projects")
    source_files: Mapped[list[SourceFile]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    pages: Mapped[list[SourcePage]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    panels: Mapped[list[SourcePanel]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    characters: Mapped[list[Character]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    story_bibles: Mapped[list[StoryBible]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    scenes: Mapped[list[Scene]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    shots: Mapped[list[Shot]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    prompts: Mapped[list[Prompt]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    video_jobs: Mapped[list[VideoJob]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class SourceFile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "source_files"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    file_type: Mapped[str] = mapped_column(String(40))
    file_url: Mapped[str] = mapped_column(Text)
    original_filename: Mapped[str] = mapped_column(String(255))
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(40), default="uploaded")

    project: Mapped[Project] = relationship(back_populates="source_files")
    pages: Mapped[list[SourcePage]] = relationship(back_populates="source_file")


class SourcePage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "source_pages"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    source_file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("source_files.id", ondelete="SET NULL"), index=True
    )
    page_number: Mapped[int] = mapped_column(Integer)
    image_url: Mapped[str] = mapped_column(Text)
    analysis_json: Mapped[dict | None] = mapped_column(JSON)

    project: Mapped[Project] = relationship(back_populates="pages")
    source_file: Mapped[SourceFile | None] = relationship(back_populates="pages")
    panels: Mapped[list[SourcePanel]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )


class SourcePanel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "source_panels"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("source_pages.id", ondelete="CASCADE"), index=True
    )
    panel_number: Mapped[int] = mapped_column(Integer)
    image_url: Mapped[str | None] = mapped_column(Text)
    bbox_json: Mapped[dict | None] = mapped_column(JSON)
    ocr_text: Mapped[str | None] = mapped_column(Text)
    visual_description: Mapped[str | None] = mapped_column(Text)
    detected_characters: Mapped[list[str] | None] = mapped_column(JSON)
    emotion: Mapped[str | None] = mapped_column(String(80))
    scene_hint: Mapped[str | None] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="panels")
    page: Mapped[SourcePage] = relationship(back_populates="panels")


class Character(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "characters"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str | None] = mapped_column(String(80))
    visual_description: Mapped[str | None] = mapped_column(Text)
    personality: Mapped[str | None] = mapped_column(Text)
    voice_style: Mapped[str | None] = mapped_column(Text)
    costume: Mapped[str | None] = mapped_column(Text)
    reference_image_url: Mapped[str | None] = mapped_column(Text)
    prompt_description: Mapped[str | None] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="characters")


class StoryBible(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "story_bibles"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    logline: Mapped[str | None] = mapped_column(Text)
    synopsis: Mapped[str | None] = mapped_column(Text)
    theme: Mapped[str | None] = mapped_column(Text)
    world_json: Mapped[dict | None] = mapped_column(JSON)
    three_act_json: Mapped[dict | None] = mapped_column(JSON)
    adaptation_notes: Mapped[str | None] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="story_bibles")


class Scene(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "scenes"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    scene_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    time_of_day: Mapped[str | None] = mapped_column(String(80))
    summary: Mapped[str | None] = mapped_column(Text)
    emotion: Mapped[str | None] = mapped_column(String(80))
    source_panel_ids: Mapped[list[str] | None] = mapped_column(JSON)
    duration_seconds: Mapped[int | None] = mapped_column(Integer)

    project: Mapped[Project] = relationship(back_populates="scenes")
    shots: Mapped[list[Shot]] = relationship(
        back_populates="scene", cascade="all, delete-orphan"
    )


class Shot(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "shots"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    scene_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), index=True
    )
    shot_number: Mapped[int] = mapped_column(Integer)
    shot_type: Mapped[str | None] = mapped_column(String(40))
    camera_movement: Mapped[str | None] = mapped_column(String(120))
    lens: Mapped[str | None] = mapped_column(String(120))
    lighting: Mapped[str | None] = mapped_column(Text)
    action_description: Mapped[str | None] = mapped_column(Text)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=5)
    status: Mapped[str] = mapped_column(String(40), default="ready", index=True)

    project: Mapped[Project] = relationship(back_populates="shots")
    scene: Mapped[Scene] = relationship(back_populates="shots")
    prompts: Mapped[list[Prompt]] = relationship(
        back_populates="shot", cascade="all, delete-orphan"
    )
    video_jobs: Mapped[list[VideoJob]] = relationship(back_populates="shot")


class Prompt(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "prompts"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    shot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shots.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[str] = mapped_column(String(60), default="seedance")
    prompt_text: Mapped[str] = mapped_column(Text)
    negative_prompt: Mapped[str | None] = mapped_column(Text)
    input_image_url: Mapped[str | None] = mapped_column(Text)
    aspect_ratio: Mapped[str] = mapped_column(String(20), default="16:9")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=5)
    model_name: Mapped[str | None] = mapped_column(String(120))

    project: Mapped[Project] = relationship(back_populates="prompts")
    shot: Mapped[Shot] = relationship(back_populates="prompts")
    video_jobs: Mapped[list[VideoJob]] = relationship(back_populates="prompt")


class VideoJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "video_jobs"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    shot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shots.id", ondelete="CASCADE"), index=True
    )
    prompt_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="SET NULL"), index=True
    )
    provider: Mapped[str] = mapped_column(String(60), default="seedance")
    external_job_id: Mapped[str | None] = mapped_column(String(255), index=True)
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    request_payload: Mapped[dict | None] = mapped_column(JSON)
    response_payload: Mapped[dict | None] = mapped_column(JSON)
    error_message: Mapped[str | None] = mapped_column(Text)
    cost_estimate: Mapped[float | None] = mapped_column(Float)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    project: Mapped[Project] = relationship(back_populates="video_jobs")
    shot: Mapped[Shot] = relationship(back_populates="video_jobs")
    prompt: Mapped[Prompt | None] = relationship(back_populates="video_jobs")
    clips: Mapped[list[VideoClip]] = relationship(
        back_populates="video_job", cascade="all, delete-orphan"
    )


class VideoClip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "video_clips"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    shot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shots.id", ondelete="CASCADE"), index=True
    )
    video_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("video_jobs.id", ondelete="CASCADE"), index=True
    )
    clip_url: Mapped[str] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    quality_score: Mapped[float | None] = mapped_column(Float)
    selected_take: Mapped[bool] = mapped_column(Boolean, default=False)

    video_job: Mapped[VideoJob] = relationship(back_populates="clips")


class AudioTrack(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "audio_tracks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    track_type: Mapped[str] = mapped_column(String(40))
    file_url: Mapped[str | None] = mapped_column(Text)
    transcript: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)


class TimelineItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "timeline_items"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    item_type: Mapped[str] = mapped_column(String(40))
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    start_seconds: Mapped[float] = mapped_column(Float)
    duration_seconds: Mapped[float] = mapped_column(Float)
    layer: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)


class Export(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "exports"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    export_type: Mapped[str] = mapped_column(String(60))
    file_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="queued")
    request_payload: Mapped[dict | None] = mapped_column(JSON)
    error_message: Mapped[str | None] = mapped_column(Text)


class ApiUsageLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "api_usage_logs"

    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    provider: Mapped[str] = mapped_column(String(60))
    operation: Mapped[str] = mapped_column(String(120))
    units: Mapped[int | None] = mapped_column(Integer)
    cost: Mapped[float | None] = mapped_column(Numeric(12, 4))
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
