from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Project, SourceFile, SourcePage, SourcePanel
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_source_file_task(self, source_file_id: str) -> dict[str, str]:
    del self
    db = SessionLocal()
    try:
        source_file = db.get(SourceFile, uuid.UUID(source_file_id))
        if source_file is None:
            raise ValueError("Source file not found")
        source_file.status = "processing"
        db.add(source_file)
        db.commit()

        page = SourcePage(
            project_id=source_file.project_id,
            source_file_id=source_file.id,
            page_number=1,
            image_url=source_file.file_url,
            analysis_json={"status": "pending_panel_detection"},
        )
        db.add(page)
        db.flush()

        panel = SourcePanel(
            project_id=source_file.project_id,
            page_id=page.id,
            panel_number=1,
            image_url=source_file.file_url,
            bbox_json={"x": 0, "y": 0, "width": 1, "height": 1},
            ocr_text=None,
            visual_description="Initial placeholder panel awaiting OCR and Vision analysis.",
            detected_characters=[],
            emotion="unknown",
            scene_hint="opening beat",
        )
        db.add(panel)
        source_file.page_count = 1
        source_file.status = "processed"
        db.commit()
        return {"status": "processed", "source_file_id": source_file_id}
    finally:
        db.close()


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def analyze_project_task(self, project_id: str) -> dict[str, str]:
    del self
    db = SessionLocal()
    try:
        project = db.get(Project, uuid.UUID(project_id))
        if project is None:
            raise ValueError("Project not found")
        project.status = "analyzing"
        db.add(project)
        db.commit()

        source_files = db.scalars(
            select(SourceFile).where(SourceFile.project_id == project.id)
        ).all()
        for source_file in source_files:
            if source_file.status in {"uploaded", "queued"}:
                process_source_file_task.run(str(source_file.id))

        project.status = "analysis_ready"
        db.add(project)
        db.commit()
        return {"status": "analysis_ready", "project_id": project_id}
    finally:
        db.close()


def normalize_local_url(file_url: str) -> Path:
    if file_url.startswith("local://"):
        return Path(file_url.removeprefix("local://"))
    return Path(file_url)
