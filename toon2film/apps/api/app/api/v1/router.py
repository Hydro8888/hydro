from fastapi import APIRouter

from app.api.v1.endpoints import analysis, exports, projects, prompts, story, uploads, video

api_router = APIRouter()
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(uploads.router, tags=["uploads"])
api_router.include_router(analysis.router, tags=["analysis"])
api_router.include_router(story.router, tags=["story"])
api_router.include_router(prompts.router, tags=["prompts"])
api_router.include_router(video.router, tags=["video"])
api_router.include_router(exports.router, tags=["exports"])
