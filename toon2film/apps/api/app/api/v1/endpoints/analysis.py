from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, SourcePage, SourcePanel

router = APIRouter()


@router.post("/projects/{project_id}/analyze")
def analyze_project(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.workers.source_tasks import analyze_project_task

    task = analyze_project_task.delay(str(project_id))
    project.status = "analysis_queued"
    db.add(project)
    db.commit()
    return {"task_id": task.id, "status": "queued"}


@router.get("/projects/{project_id}/pages")
def list_pages(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict]:
    pages = db.scalars(
        select(SourcePage).where(SourcePage.project_id == project_id).order_by(SourcePage.page_number)
    ).all()
    return [
        {
            "id": str(page.id),
            "page_number": page.page_number,
            "image_url": page.image_url,
            "analysis_json": page.analysis_json,
        }
        for page in pages
    ]


@router.get("/projects/{project_id}/panels")
def list_panels(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict]:
    panels = db.scalars(
        select(SourcePanel)
        .where(SourcePanel.project_id == project_id)
        .order_by(SourcePanel.created_at)
    ).all()
    return [
        {
            "id": str(panel.id),
            "page_id": str(panel.page_id),
            "panel_number": panel.panel_number,
            "ocr_text": panel.ocr_text,
            "visual_description": panel.visual_description,
            "emotion": panel.emotion,
            "scene_hint": panel.scene_hint,
        }
        for panel in panels
    ]


@router.patch("/panels/{panel_id}")
def update_panel(
    panel_id: uuid.UUID, payload: dict, db: Session = Depends(get_db)
) -> dict[str, str]:
    panel = db.get(SourcePanel, panel_id)
    if panel is None:
        raise HTTPException(status_code=404, detail="Panel not found")

    allowed = {"ocr_text", "visual_description", "detected_characters", "emotion", "scene_hint"}
    for key, value in payload.items():
        if key in allowed:
            setattr(panel, key, value)

    db.add(panel)
    db.commit()
    return {"status": "updated"}
