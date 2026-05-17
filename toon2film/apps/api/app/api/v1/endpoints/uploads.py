from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, SourceFile
from app.schemas import SourceFileRead

router = APIRouter()

ALLOWED_SOURCE_EXTENSIONS = {"jpg", "jpeg", "pdf", "png", "zip"}
MAX_SOURCE_FILE_BYTES = 200 * 1024 * 1024


@router.post(
    "/projects/{project_id}/upload",
    response_model=SourceFileRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_source_file(
    project_id: uuid.UUID,
    rights_confirmed: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> SourceFile:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if not rights_confirmed:
        raise HTTPException(status_code=400, detail="Rights confirmation is required")

    suffix = Path(file.filename or "source").suffix.lower().lstrip(".")
    if suffix not in ALLOWED_SOURCE_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_SOURCE_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed extensions: {allowed}",
        )

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size <= 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if file_size > MAX_SOURCE_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds 200 MB")

    target_dir = Path("uploads") / str(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{uuid.uuid4()}.{suffix}"

    with target_path.open("wb") as target:
        shutil.copyfileobj(file.file, target)

    source_file = SourceFile(
        project_id=project_id,
        file_type=suffix,
        file_url=f"local://{target_path.as_posix()}",
        original_filename=file.filename or target_path.name,
        status="uploaded",
    )
    project.rights_confirmed = True
    db.add_all([project, source_file])
    db.commit()
    db.refresh(source_file)
    return source_file


@router.get("/projects/{project_id}/source-files", response_model=list[SourceFileRead])
def list_source_files(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[SourceFile]:
    return list(
        db.scalars(
            select(SourceFile)
            .where(SourceFile.project_id == project_id)
            .order_by(SourceFile.created_at.desc())
        ).all()
    )


@router.post("/source-files/{file_id}/process")
def process_source_file(file_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, str]:
    source_file = db.get(SourceFile, file_id)
    if source_file is None:
        raise HTTPException(status_code=404, detail="Source file not found")

    from app.workers.source_tasks import process_source_file_task

    task = process_source_file_task.delay(str(file_id))
    source_file.status = "queued"
    db.add(source_file)
    db.commit()
    return {"task_id": task.id, "status": "queued"}
