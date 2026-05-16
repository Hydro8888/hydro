from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.video_providers.base import (
    VideoClipResult,
    VideoJobInput,
    VideoJobResult,
    VideoJobStatus,
)


class SeedanceProvider:
    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        self.base_url = (base_url or settings.seedance_base_url or "").rstrip("/")
        self.api_key = api_key or settings.seedance_api_key
        if not self.base_url:
            raise RuntimeError("SEEDANCE_BASE_URL is required")
        if not self.api_key:
            raise RuntimeError("SEEDANCE_API_KEY is required")

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def create_video_job(self, input: VideoJobInput) -> VideoJobResult:
        payload = {
            "model": input.model_name,
            "prompt": input.prompt,
            "negative_prompt": input.negative_prompt,
            "duration": input.duration_seconds,
            "aspect_ratio": input.aspect_ratio,
            "input_image_url": input.input_image_url,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/video/generations",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        external_job_id = str(data.get("id") or data.get("task_id") or data.get("job_id"))
        return VideoJobResult(
            external_job_id=external_job_id,
            status=str(data.get("status", "queued")),
            request_payload=payload,
            response_payload=data,
            cost_estimate=data.get("cost_estimate"),
        )

    async def get_job_status(self, job_id: str) -> VideoJobStatus:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.base_url}/video/generations/{job_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()

        return VideoJobStatus(
            external_job_id=job_id,
            status=str(data.get("status", "unknown")),
            response_payload=data,
            result_url=data.get("result_url") or data.get("video_url"),
            error_message=data.get("error") or data.get("error_message"),
        )

    async def download_result(self, job_id: str) -> VideoClipResult:
        status = await self.get_job_status(job_id)
        if not status.result_url:
            raise RuntimeError("Video result is not available")
        return VideoClipResult(
            clip_url=status.result_url,
            thumbnail_url=status.response_payload.get("thumbnail_url"),
            duration_seconds=status.response_payload.get("duration"),
        )

    async def cancel_job(self, job_id: str) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/video/generations/{job_id}/cancel",
                headers=self.headers,
            )
            response.raise_for_status()
