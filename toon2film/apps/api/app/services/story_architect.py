from __future__ import annotations

from app.models import Project, SourcePanel


class StoryArchitectService:
    def build_story_bible(self, project: Project, panels: list[SourcePanel]) -> dict:
        panel_beats = [
            panel.visual_description or panel.ocr_text or panel.scene_hint
            for panel in panels
            if panel.visual_description or panel.ocr_text or panel.scene_hint
        ]
        source_summary = " ".join(panel_beats[:8]) or "Source panels are awaiting analysis."

        return {
            "title": project.title,
            "logline": (
                f"A {project.style} {project.project_type} adapted from toon source material."
            ),
            "synopsis": source_summary[:1800],
            "theme": "Identity, conflict, and cinematic transformation from static panels.",
            "world_json": {
                "language": project.language,
                "style": project.style,
                "aspect_ratio": project.aspect_ratio,
            },
            "three_act_json": {
                "act_1": "Introduce the protagonist, visual rules, and central disturbance.",
                "act_2": "Escalate conflict through selected panels and emotional reversals.",
                "act_3": "Resolve the trailer beat with a strong final image.",
            },
            "adaptation_notes": (
                "Prioritize scenes with clear action, readable character continuity, and strong "
                "cinematic motion potential."
            ),
        }
