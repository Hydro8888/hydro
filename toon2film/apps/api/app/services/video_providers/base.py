from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class VideoJobInput:
    prompt: str
    negative_prompt: str | None
    duration_seconds: int
    aspect_ratio: str
    model_name: str
    input_image_url: str | None = None


@dataclass(frozen=True)
class VideoJobResult:
    external_job_id: str
    status: str
    request_payload: dict
    response_payload: dict
    cost_estimate: float | None = None


@dataclass(frozen=True)
class VideoJobStatus:
    external_job_id: str
    status: str
    response_payload: dict
    result_url: str | None = None
    error_message: str | None = None


@dataclass(frozen=True)
class VideoClipResult:
    clip_url: str
    thumbnail_url: str | None
    duration_seconds: int | None


class VideoGenerationProvider(Protocol):
    async def create_video_job(self, input: VideoJobInput) -> VideoJobResult:
        ...

    async def get_job_status(self, job_id: str) -> VideoJobStatus:
        ...

    async def download_result(self, job_id: str) -> VideoClipResult:
        ...

    async def cancel_job(self, job_id: str) -> None:
        ...
