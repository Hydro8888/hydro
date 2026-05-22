from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    AudioTrack,
    Character,
    Export,
    Project,
    Scene,
    Shot,
    SourceFile,
    SourcePanel,
    StoryBible,
    VideoJob,
)
from app.schemas import (
    CharacterBibleRead,
    PipelineStateRead,
    StoryAnalysisRead,
    StoryBibleRead,
    StorySceneRead,
    StoryboardShotRead,
)
from app.services.openai_client import OpenAIAnalysisError
from app.services.production_pipeline import ProductionPipelineService
from app.services.story_architect import StoryArchitectService

router = APIRouter()


def _ai_http_error(exc: OpenAIAnalysisError) -> HTTPException:
    return HTTPException(status_code=503, detail=str(exc))


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


def _require_ai_analyzed_panels(project_id: uuid.UUID, db: Session) -> list[SourcePanel]:
    source_files = _source_files(project_id, db)
    panels = _panels(project_id, db)
    has_analyzed_source = any(source.status == "analyzed" for source in source_files)
    if not has_analyzed_source or not panels:
        raise HTTPException(
            status_code=400,
            detail="Upload a comic source file and complete AI comic analysis before this step.",
        )
    return panels


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
            select(Character)
            .where(Character.project_id == project_id)
            .order_by(Character.created_at)
        ).all()
    )


def _shots(project_id: uuid.UUID, db: Session) -> list[Shot]:
    return list(
        db.scalars(
            select(Shot)
            .where(Shot.project_id == project_id)
            .order_by(Shot.scene_id, Shot.shot_number)
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

    try:
        scene_payloads = StoryArchitectService().build_scenes(
            project=project,
            story_bible=story_bible,
            panels=_require_ai_analyzed_panels(project.id, db),
        )
    except OpenAIAnalysisError as exc:
        raise _ai_http_error(exc) from exc

    scenes = [
        Scene(
            project_id=project.id,
            scene_number=int(payload.get("scene_id") or index),
            title=payload.get("title") or f"Scene {index}",
            location=payload.get("location") or "",
            time_of_day=payload.get("time") or "",
            summary=payload.get("summary") or "",
            emotion=payload.get("emotion") or "",
            duration_seconds=int(payload.get("duration_seconds") or 8),
            source_panel_ids=[],
        )
        for index, payload in enumerate(scene_payloads, start=1)
    ]
    if not scenes:
        raise HTTPException(status_code=502, detail="AI did not return any scenes")
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
        try:
            result = StoryArchitectService().build_story_bible(
                project=project,
                panels=_require_ai_analyzed_panels(project_id, db),
            )
        except OpenAIAnalysisError as exc:
            raise _ai_http_error(exc) from exc
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

    story_bible = _story_bible(project_id, db)
    if story_bible is None:
        raise HTTPException(status_code=400, detail="Generate story analysis before characters")
    panels = _require_ai_analyzed_panels(project_id, db)
    try:
        character_payloads = StoryArchitectService().build_characters(
            project=project,
            story_bible=story_bible,
            panels=panels,
        )
    except OpenAIAnalysisError as exc:
        raise _ai_http_error(exc) from exc

    characters = [
        Character(
            project_id=project_id,
            name=payload.get("name") or f"Character {index}",
            role=payload.get("role") or ("protagonist" if index == 1 else "supporting"),
            visual_description=payload.get("appearance_description") or "",
            personality=payload.get("personality") or "",
            costume=payload.get("costume") or "",
            voice_style=payload.get("voice_style") or "",
            prompt_description=payload.get("reference_image_prompt") or "",
        )
        for index, payload in enumerate(character_payloads[:8], start=1)
    ]
    if not characters:
        raise HTTPException(status_code=502, detail="AI did not return any characters")
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


def _shots_from_ai_payloads(
    project: Project,
    scenes: list[Scene],
    storyboard_payloads: list[dict],
) -> list[Shot]:
    scene_map = {scene.scene_number: scene for scene in scenes}
    shots: list[Shot] = []
    for index, payload in enumerate(storyboard_payloads, start=1):
        scene = scene_map.get(int(payload.get("scene_id") or 0)) or (scenes[0] if scenes else None)
        if scene is None:
            continue
        visual_prompt = payload.get("visual_prompt") or ""
        action = payload.get("dialogue_or_action") or ""
        action_description = (
            f"{visual_prompt}\nAction/Dialog: {action}" if visual_prompt and action else visual_prompt or action
        )
        shots.append(
            Shot(
                project_id=project.id,
                scene_id=scene.id,
                shot_number=int(payload.get("shot_number") or index),
                shot_type=payload.get("camera_angle") or "Medium shot",
                camera_movement=payload.get("camera_movement") or "",
                lens=payload.get("lens") or "",
                lighting=payload.get("lighting") or "",
                action_description=action_description,
                duration_seconds=int(payload.get("duration_seconds") or 5),
                status="ready",
            )
        )
    return shots


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

    project = _get_project_or_404(scene.project_id, db)
    story_bible = _story_bible(project.id, db)
    try:
        payloads = StoryArchitectService().build_storyboard(
            project=project,
            scenes=[scene],
            characters=_characters(project.id, db),
            story_bible=story_bible,
            panels=_require_ai_analyzed_panels(project.id, db),
            max_shots=3,
        )
    except OpenAIAnalysisError as exc:
        raise _ai_http_error(exc) from exc

    shots = _shots_from_ai_payloads(project, [scene], payloads)
    if not shots:
        raise HTTPException(status_code=502, detail="AI did not return any shots")
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
        try:
            ProductionPipelineService().ensure_post_story_pipeline(project, db)
        except OpenAIAnalysisError as exc:
            raise _ai_http_error(exc) from exc
        return [_shot_read(shot) for shot in existing]

    try:
        payloads = StoryArchitectService().build_storyboard(
            project=project,
            scenes=scenes,
            characters=_characters(project_id, db),
            story_bible=_story_bible(project_id, db),
            panels=_require_ai_analyzed_panels(project_id, db),
        )
    except OpenAIAnalysisError as exc:
        raise _ai_http_error(exc) from exc

    shots = _shots_from_ai_payloads(project, scenes, payloads)
    if not shots:
        raise HTTPException(status_code=502, detail="AI did not return any storyboard shots")
    db.add_all(shots)
    project.status = "STORYBOARD_READY"
    db.add(project)
    db.commit()
    for shot in shots:
        db.refresh(shot)
    try:
        ProductionPipelineService().ensure_post_story_pipeline(project, db)
    except OpenAIAnalysisError as exc:
        raise _ai_http_error(exc) from exc
    return [_shot_read(shot) for shot in shots]


@router.get("/projects/{project_id}/storyboard", response_model=list[StoryboardShotRead])
def list_storyboard(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[StoryboardShotRead]:
    _get_project_or_404(project_id, db)
    return [_shot_read(shot) for shot in _shots(project_id, db)]
