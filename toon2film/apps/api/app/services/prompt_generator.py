from __future__ import annotations

from app.models import Project, Shot


class SeedancePromptGenerator:
    def generate(self, project: Project, shot: Shot) -> dict[str, str]:
        prompt_parts = [
            f"Cinematic realistic {project.style} film scene.",
            shot.action_description or "A focused dramatic story beat unfolds.",
            f"Shot type: {shot.shot_type or 'medium shot'}.",
            f"Camera movement: {shot.camera_movement or 'subtle controlled movement'}.",
            f"Lens: {shot.lens or '32mm cinematic lens'}.",
            f"Lighting: {shot.lighting or 'motivated cinematic lighting'}.",
            f"Mood: {project.style}, emotionally precise, production-ready.",
            f"Duration: {shot.duration_seconds} seconds.",
            f"Aspect ratio: {project.aspect_ratio}.",
            "Use coherent faces, stable character identity, natural motion, and filmic framing.",
        ]
        negative_prompt = (
            "Avoid cartoon style, distorted faces, extra fingers, unreadable text, "
            "flicker, warped anatomy, abrupt camera jumps, and exaggerated motion."
        )
        return {
            "prompt_text": " ".join(prompt_parts),
            "negative_prompt": negative_prompt,
        }
