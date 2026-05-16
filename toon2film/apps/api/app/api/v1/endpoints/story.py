from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Character, Project, Scene, Shot, SourcePanel, StoryBible
from app.schemas import StoryBibleRead
from app.services.story_architect import StoryArchitectService

router = APIRouter()


@router.post(
    "/projects/{project_id}/generate-story-bible",
    response_model=StoryBibleRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_story_bible(project_id: uuid.UUID, db: Session = Depends(get_db)) -> StoryBible:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    panels = list(
        db.scalars(
            select(SourcePanel)
            .where(SourcePanel.project_id == project_id)
            .order_by(SourcePanel.created_at)
        ).all()
    )
    result = StoryArchitectService().build_story_bible(project=project, panels=panels)
    story_bible = StoryBible(project_id=project_id, **result)
    db.add(story_bible)
    db.commit()
    db.refresh(story_bible)
    return story_bible


@router.post("/projects/{project_id}/generate-characters")
def generate_characters(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, int]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    character = Character(
        project_id=project_id,
        name="Unnamed Lead",
        role="protagonist",
        visual_description="Primary recurring character extracted from panels.",
        personality="Reserved, conflicted, cinematic presence.",
        prompt_description="Consistent lead character, realistic film style.",
    )
    db.add(character)
    db.commit()
    return {"created": 1}


@router.post("/projects/{project_id}/generate-scenes")
def generate_scenes(project_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, int]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    scenes = [
        Scene(
            project_id=project_id,
            scene_number=1,
            title="Opening Image",
            location="Primary location from source panels",
            time_of_day="day",
            summary="The protagonist is introduced through a tense visual hook.",
            emotion="unease",
            duration_seconds=15,
        ),
        Scene(
            project_id=project_id,
            scene_number=2,
            title="Inciting Warning",
            location="Interior",
            time_of_day="night",
            summary="A strange message reframes the story conflict.",
            emotion="dread",
            duration_seconds=20,
        ),
    ]
    db.add_all(scenes)
    db.commit()
    return {"created": len(scenes)}


@router.post("/scenes/{scene_id}/generate-shots")
def generate_shots(scene_id: uuid.UUID, db: Session = Depends(get_db)) -> dict[str, int]:
    scene = db.get(Scene, scene_id)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    shots = [
        Shot(
            project_id=scene.project_id,
            scene_id=scene.id,
            shot_number=1,
            shot_type="EWS",
            camera_movement="locked",
            lens="24mm",
            lighting="motivated cinematic light",
            action_description=scene.summary,
            duration_seconds=5,
        ),
        Shot(
            project_id=scene.project_id,
            scene_id=scene.id,
            shot_number=2,
            shot_type="MS",
            camera_movement="slow slider",
            lens="32mm",
            lighting="soft contrast",
            action_description="Character reaction and emotional beat.",
            duration_seconds=6,
        ),
    ]
    db.add_all(shots)
    db.commit()
    return {"created": len(shots)}
