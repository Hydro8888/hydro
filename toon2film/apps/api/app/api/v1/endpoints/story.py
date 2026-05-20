from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AudioTrack, Character, Export, Project, Scene, Shot, SourceFile, SourcePanel, StoryBible, VideoJob
from app.schemas import (
    CharacterBibleRead,
    PipelineStateRead,
    StoryAnalysisRead,
    StoryBibleRead,
    StorySceneRead,
    StoryboardShotRead,
)
from app.services.production_pipeline import ProductionPipelineService
from app.services.story_architect import StoryArchitectService

router = APIRouter()


def _get_project_or_404(project_id: uuid.UUID, db: Session) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _source_files(project_id: uuid.UUID, db: Session) -> list[SourceFile]:
    return list(
        db.scalars(
            select(SourceFile)
            .where(SourceFile.project_id == project_id)
            .order_by(SourceFile.created_at)
        ).all()
    )


def _panels(project_id: uuid.UUID, db: Session) -> list[SourcePanel]:
    return list(
        db.scalars(
            select(SourcePanel)
            .where(SourcePanel.project_id == project_id)
            .order_by(SourcePanel.created_at)
        ).all()
    )


def _story_bible(project_id: uuid.UUID, db: Session) -> StoryBible | None:
    return db.scalars(
        select(StoryBible)
        .where(StoryBible.project_id == project_id)
        .order_by(StoryBible.created_at.desc())
    ).first()


def _scenes(project_id: uuid.UUID, db: Session) -> list[Scene]:
    return list(
        db.scalars(
            select(Scene).where(Scene.project_id == project_id).order_by(Scene.scene_number)
        ).all()
    )


def _characters(project_id: uuid.UUID, db: Session) -> list[Character]:
    return list(
        db.scalars(
            select(Character).where(Character.project_id == project_id).order_by(Character.created_at)
        ).all()
    )


def _shots(project_id: uuid.UUID, db: Session) -> list[Shot]:
    return list(
        db.scalars(
            select(Shot).where(Shot.project_id == project_id).order_by(Shot.scene_id, Shot.shot_number)
        ).all()
    )


def _video_jobs(project_id: uuid.UUID, db: Session) -> list[VideoJob]:
    return list(
        db.scalars(
            select(VideoJob).where(VideoJob.project_id == project_id).order_by(VideoJob.created_at)
        ).all()
    )


def _exports(project_id: uuid.UUID, db: Session) -> list[Export]:
    return list(
        db.scalars(
            select(Export).where(Export.project_id == project_id).order_by(Export.created_at)
        ).all()
    )


def _subtitle_track_count(project_id: uuid.UUID, db: Session) -> int:
    return len(
        list(
            db.scalars(
                select(AudioTrack).where(
                    AudioTrack.project_id == project_id,
                    AudioTrack.track_type == "subtitle",
                )
            ).all()
        )
    )


def _status_for(
    raw_files: list[SourceFile],
    story_bible: StoryBible | None,
    characters: list[Character],
    storyboard: list[Shot],
    render_jobs: list[VideoJob],
    exports: list[Export],
    subtitle_tracks: int,
) -> str:
    if exports or subtitle_tracks:
        return "EXPORT_READY"
    if render_jobs:
        return "VIDEO_RENDER_READY"
    if storyboard:
        return "STORYBOARD_READY"
    if characters:
        return "CHAR_DESIGNED"
    if story_bible:
        return "STORY_ANALYZED"
    if raw_files:
        return "RAW_UPLOADED"
    return "DRAFT"


def _step_status(done: bool, active: bool = False) -> str:
    if done:
        return "done"
    if active:
        return "processing"
    return "ready"


def _pipeline_steps(
    raw_files: list[SourceFile],
    story_bible: StoryBible | None,
    characters: list[Character],
    storyboard: list[Shot],
    render_jobs: list[VideoJob],
    exports: list[Export],
    subtitle_tracks: int,
) -> list[dict[str, str | int]]:
    has_raw = bool(raw_files)
    has_story = story_bible is not None
    has_characters = bool(characters)
    has_storyboard = bool(storyboard)
    has_render = bool(render_jobs)
    has_export = bool(exports or subtitle_tracks)
    return [
        {
            "id": "upload",
            "title": "원본 업로드",
            "subtitle": "만화 / JPG / PDF",
            "status": _step_status(has_raw, not has_raw),
            "count": len(raw_files),
        },
        {
            "id": "story",
            "title": "스토리 분석",
            "subtitle": "AI 스토리 생성",
            "status": _step_status(has_story, has_raw and not has_story),
            "count": 1 if has_story else 0,
        },
        {
            "id": "character",
            "title": "캐릭터 설계",
            "subtitle": "캐릭터 바이블",
            "status": _step_status(has_characters, has_story and not has_characters),
            "count": len(characters),
        },
        {
            "id": "storyboard",
            "title": "콘티 생성",
            "subtitle": "샷 & 시퀀스 구성",
            "status": _step_status(has_storyboard, has_characters and not has_storyboard),
            "count": len(storyboard),
        },
        {
            "id": "render",
            "title": "영상 렌더",
            "subtitle": "AI 영상 생성",
            "status": _step_status(has_render, has_storyboard and not has_render),
            "count": len(render_jobs),
        },
        {
            "id": "export",
            "title": "자막 / 출력",
            "subtitle": "편집 & 내보내기",
            "status": _step_status(has_export, has_render and not has_export),
            "count": len(exports) + subtitle_tracks,
        },
    ]


def _scene_read(scene: Scene) -> StorySceneRead:
    return StorySceneRead(
        scene_id=scene.scene_number,
        summary=scene.summary or "",
        location=scene.location,
        time=scene.time_of_day,
    )


def _story_analysis_read(
    story_bible: StoryBible | None, scenes: list[Scene]
) -> StoryAnalysisRead | None:
    if story_bible is None:
        return None
    return StoryAnalysisRead(
        logline=story_bible.logline or "",
        synopsis=story_bible.synopsis or "",
        scenes=[_scene_read(scene) for scene in scenes],
    )


def _character_read(character: Character) -> CharacterBibleRead:
    return CharacterBibleRead(
        character_id=str(character.id),
        name=character.name,
        appearance_description=character.visual_description or "",
        personality=character.personality or "",
        reference_image_prompt=character.prompt_description or "",
    )


def _shot_read(shot: Shot) -> StoryboardShotRead:
    scene_number = shot.scene.scene_number if shot.scene else 0
    visual_prompt = ", ".join(
        value
        for value in [
            shot.action_description,
            shot.lighting,
            shot.lens,
            shot.camera_movement,
        ]
        if value
    )
    return StoryboardShotRead(
        shot_id=str(shot.id),
        scene_id=scene_number,
        visual_prompt=visual_prompt,
        camera_angle=shot.shot_type or "Medium shot",
        dialogue_or_action=shot.action_description or "",
    )


def _ensure_story_scenes(project: Project, story_bible: StoryBible, db: Session) -> list[Scene]:
    existing = _scenes(project.id, db)
    if existing:
        return existing

    act_notes = story_bible.three_act_json or {}
    scene_payloads = [
        {
            "scene_number": 1,
            "title": "Opening Image",
            "location": "Primary source location",
            "time_of_day": "day",
            "summary": act_notes.get("act_1") or "Introduce the protagonist and source world.",
            "emotion": "curiosity",
            "duration_seconds": max(10, project.target_duration // 4),
        },
        {
            "scene_number": 2,
            "title": "Conflict Turn",
            "location": "Story pressure point",
            "time_of_day": "night",
            "summary": act_notes.get("act_2") or "Escalate the conflict through a cinematic reversal.",
            "emotion": "tension",
            "duration_seconds": max(10, project.target_duration // 3),
        },
        {
            "scene_number": 3,
            "title": "Final Hook",
            "location": "Signature visual",
            "time_of_day": "golden hour",
            "summary": act_notes.get("act_3") or "Close with a strong trailer image.",
            "emotion": "anticipation",
            "duration_seconds": max(8, project.target_duration // 5),
        },
    ]
    scenes = [Scene(project_id=project.id, **payload) for payload in scene_payloads]
    db.add_all(scenes)
    db.flush()
    return scenes


@router.get("/projects/{project_id}/pipeline-state", response_model=PipelineStateRead)
def get_pipeline_state(project_id: uuid.UUID, db: Session = Depends(get_db)) -> PipelineStateRead:
    project = _get_project_or_404(project_id, db)
    raw_files = _source_files(project_id, db)
    story_bible = _story_bible(project_id, db)
    scenes = _scenes(project_id, db)
    characters = _characters(project_id, db)
    storyboard = _shots(project_id, db)
    render_jobs = _video_jobs(project_id, db)
    exports = _exports(project_id, db)
    subtitle_tracks = _subtitle_track_count(project_id, db)

    return PipelineStateRead(
        project_id=str(project.id),
        project_name=project.title,
        status=_status_for(
            raw_files,
            story_bible,
            characters,
            storyboard,
            render_jobs,
            exports,
            subtitle_tracks,
        ),
        raw_files=[
            {
                "file_id": str(source.id),
                "url": source.file_url,
                "page_num": source.page_count or 1,
                "original_filename": source.original_filename,
                "status": source.status,
            }
            for source in raw_files
        ],
        story_analysis=_story_analysis_read(story_bible, scenes),
        character_bible=[_character_read(character) for character in characters],
        storyboard=[_shot_read(shot) for shot in storyboard],
        render_jobs=[
            {
                "job_id": str(job.id),
                "shot_id": str(job.shot_id),
                "provider": job.provider,
                "status": job.status,
            }
            for job in render_jobs
        ],
        exports=[
            {
                "export_id": str(export.id),
                "export_type": export.export_type,
                "status": export.status,
            }
            for export in exports
        ],
        subtitle_tracks=subtitle_tracks,
        steps=_pipeline_steps(
            raw_files,
            story_bible,
            characters,
            storyboard,
            render_jobs,
            exports,
            subtitle_tracks,
        ),
    )


@router.post(
    "/projects/{project_id}/generate-story-bible",
    response_model=StoryAnalysisRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_story_bible(project_id: uuid.UUID, db: Session = Depends(get_db)) -> StoryAnalysisRead:
    project = _get_project_or_404(project_id, db)
    existing = _story_bible(project_id, db)
    if existing is None:
        result = StoryArchitectService().build_story_bible(project=project, panels=_panels(project_id, db))
        existing = StoryBible(project_id=project_id, **result)
        db.add(existing)
        db.flush()

    scenes = _ensure_story_scenes(project, existing, db)
    project.status = "STORY_ANALYZED"
    db.add(project)
    db.commit()
    db.refresh(existing)
    return _story_analysis_read(existing, scenes) or StoryAnalysisRead(logline="", synopsis="", scenes=[])


@router.get("/projects/{project_id}/story-bible", response_model=StoryBibleRead)
def get_story_bible(project_id: uuid.UUID, db: Session = Depends(get_db)) -> StoryBible:
    _get_project_or_404(project_id, db)
    story_bible = _story_bible(project_id, db)
    if story_bible is None:
        raise HTTPException(status_code=404, detail="Story bible not found")
    return story_bible


@router.post("/projects/{project_id}/generate-characters", response_model=list[CharacterBibleRead])
def generate_characters(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[CharacterBibleRead]:
    project = _get_project_or_404(project_id, db)
    existing = _characters(project_id, db)
    if existing:
        return [_character_read(character) for character in existing]

    panels = _panels(project_id, db)
    detected_names: list[str] = []
    for panel in panels:
        for name in panel.detected_characters or []:
            if name and name not in detected_names:
                detected_names.append(name)

    names = detected_names[:3] or ["Lead Character", "Supporting Character"]
    characters = [
        Character(
            project_id=project_id,
            name=name,
            role="protagonist" if index == 0 else "supporting",
            visual_description=(
                f"Recurring {project.style} character inferred from uploaded toon panels."
            ),
            personality=(
                "Goal-driven, emotionally readable, designed for consistent cinematic staging."
            ),
            prompt_description=(
                f"{name}, consistent live-action character design, {project.style}, "
                "clear facial features, production-ready costume, cinematic lighting"
            ),
        )
        for index, name in enumerate(names)
    ]
    db.add_all(characters)
    project.status = "CHAR_DESIGNED"
    db.add(project)
    db.commit()
    for character in characters:
        db.refresh(character)
    return [_character_read(character) for character in characters]


@router.get("/projects/{project_id}/characters", response_model=list[CharacterBibleRead])
def list_characters(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[CharacterBibleRead]:
    _get_project_or_404(project_id, db)
    return [_character_read(character) for character in _characters(project_id, db)]


@router.post("/projects/{project_id}/generate-scenes", response_model=list[StorySceneRead])
def generate_scenes(project_id: uuid.UUID, db: Session = Depends(get_db)) -> list[StorySceneRead]:
    project = _get_project_or_404(project_id, db)
    story_bible = _story_bible(project_id, db)
    if story_bible is None:
        raise HTTPException(status_code=400, detail="Generate story analysis before scenes")
    scenes = _ensure_story_scenes(project, story_bible, db)
    project.status = "STORY_ANALYZED"
    db.add(project)
    db.commit()
    return [_scene_read(scene) for scene in scenes]


def _create_shots_for_scene(scene: Scene) -> list[Shot]:
    shot_templates = [
        {
            "shot_number": 1,
            "shot_type": "Wide shot",
            "camera_movement": "slow establishing push",
            "lens": "24mm cinematic lens",
            "lighting": "environmental light with strong atmosphere",
            "action_description": f"Establish {scene.location or 'the scene'}: {scene.summary or scene.title}",
            "duration_seconds": 5,
        },
        {
            "shot_number": 2,
            "shot_type": "Medium shot",
            "camera_movement": "controlled slider move",
            "lens": "35mm cinematic lens",
            "lighting": "soft key light, motivated contrast",
            "action_description": f"Character action beat for {scene.title}.",
            "duration_seconds": 6,
        },
        {
            "shot_number": 3,
            "shot_type": "Close-up",
            "camera_movement": "subtle push-in",
            "lens": "50mm shallow depth of field",
            "lighting": "expressive highlight on the face or key object",
            "action_description": f"Emotional reaction: {scene.emotion or 'cinematic tension'}.",
            "duration_seconds": 4,
        },
    ]
    return [Shot(project_id=scene.project_id, scene_id=scene.id, **template) for template in shot_templates]


@router.post("/scenes/{scene_id}/generate-shots", response_model=list[StoryboardShotRead])
def generate_shots(scene_id: uuid.UUID, db: Session = Depends(get_db)) -> list[StoryboardShotRead]:
    scene = db.get(Scene, scene_id)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    existing = list(
        db.scalars(select(Shot).where(Shot.scene_id == scene_id).order_by(Shot.shot_number)).all()
    )
    if existing:
        return [_shot_read(shot) for shot in existing]

    shots = _create_shots_for_scene(scene)
    db.add_all(shots)
    db.commit()
    for shot in shots:
        db.refresh(shot)
    return [_shot_read(shot) for shot in shots]


@router.post("/projects/{project_id}/generate-storyboard", response_model=list[StoryboardShotRead])
def generate_storyboard(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[StoryboardShotRead]:
    project = _get_project_or_404(project_id, db)
    scenes = _scenes(project_id, db)
    if not scenes:
        story_bible = _story_bible(project_id, db)
        if story_bible is None:
            raise HTTPException(status_code=400, detail="Generate story analysis before storyboard")
        scenes = _ensure_story_scenes(project, story_bible, db)

    existing = _shots(project_id, db)
    if existing:
        ProductionPipelineService().ensure_post_story_pipeline(project, db)
        return [_shot_read(shot) for shot in existing]

    shots: list[Shot] = []
    for scene in scenes:
        shots.extend(_create_shots_for_scene(scene))
    db.add_all(shots)
    project.status = "STORYBOARD_READY"
    db.add(project)
    db.commit()
    for shot in shots:
        db.refresh(shot)
    ProductionPipelineService().ensure_post_story_pipeline(project, db)
    return [_shot_read(shot) for shot in shots]


@router.get("/projects/{project_id}/storyboard", response_model=list[StoryboardShotRead])
def list_storyboard(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[StoryboardShotRead]:
    _get_project_or_404(project_id, db)
    return [_shot_read(shot) for shot in _shots(project_id, db)]
