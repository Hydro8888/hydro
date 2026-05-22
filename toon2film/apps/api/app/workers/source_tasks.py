from __future__ import annotations

import uuid

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Project, SourceFile
from app.services.comic_analyzer import ComicAnalysisError, ComicAnalyzerService
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_source_file_task(self, source_file_id: str) -> dict[str, str]:
    del self
    db = SessionLocal()
    try:
        source_file = db.get(SourceFile, uuid.UUID(source_file_id))
        if source_file is None:
            raise ValueError("Source file not found")
        project = db.get(Project, source_file.project_id)
        if project is None:
            raise ValueError("Project not found")

        source_file.status = "analyzing"
        db.add(source_file)
        db.commit()

        try:
            ComicAnalyzerService().analyze_source_file(source_file, project, db)
        except ComicAnalysisError:
            source_file.status = "analysis_failed"
            db.add(source_file)
            db.commit()
            raise

        db.refresh(source_file)
        return {"status": source_file.status, "source_file_id": source_file_id}
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
            if source_file.status in {"uploaded", "queued", "analysis_failed"}:
                process_source_file_task.run(str(source_file.id))

        project.status = "analysis_ready"
        db.add(project)
        db.commit()
        return {"status": "analysis_ready", "project_id": project_id}
    finally:
        db.close()
