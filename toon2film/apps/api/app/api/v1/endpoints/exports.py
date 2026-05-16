from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Export, Project

router = APIRouter()


@router.post("/projects/{project_id}/render", status_code=status.HTTP_201_CREATED)
def render_project(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    export = Export(
        project_id=project_id,
        export_type="mp4",
        status="queued",
        request_payload={"project_id": str(project_id)},
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return {"export_id": str(export.id), "status": export.status}


@router.get("/projects/{project_id}/exports")
def list_exports(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict]:
    exports = db.scalars(
        select(Export).where(Export.project_id == project_id).order_by(Export.created_at.desc())
    ).all()
    return [
        {
            "id": str(export.id),
            "export_type": export.export_type,
            "file_url": export.file_url,
            "status": export.status,
        }
        for export in exports
    ]


@router.get("/exports/{export_id}/download")
def download_export(export_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str | None]:
    export = db.get(Export, export_id)
    if export is None:
        raise HTTPException(status_code=404, detail="Export not found")
    return {"file_url": export.file_url, "status": export.status}
