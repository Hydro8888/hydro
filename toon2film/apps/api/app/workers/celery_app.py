from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "toon2film",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.source_tasks", "app.workers.video_tasks"],
)

celery_app.conf.task_routes = {
    "app.workers.source_tasks.*": {"queue": "analysis"},
    "app.workers.video_tasks.*": {"queue": "video"},
}
celery_app.conf.task_default_retry_delay = 30
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
