# Toon2Film

Toon2Film is an MVP scaffold for an AI film-production SaaS that turns comics, manga pages, and webtoon source images into structured cinematic production data.

```text
Source Upload -> AI Analysis -> Story Bible -> Character Bible -> Scene/Shot Builder -> Prompt Studio -> Video Generation -> Timeline Export
```

The goal is not to send comic images directly to a video model. Toon2Film first creates the intermediate production artifacts that keep story, character identity, shot design, and prompts consistent.

## Repository

```text
apps/web  - Next.js, TypeScript, Tailwind CSS
apps/api  - FastAPI, SQLAlchemy, Celery, provider adapters
```

## MVP Scope

- Project dashboard and new project flow
- Source upload contract with rights confirmation
- Source page, panel, character, story, scene, shot, prompt, video job, clip, timeline, export models
- Story Architect and Seedance prompt generator service skeletons
- Provider interface for Seedance and future video models
- Celery worker skeleton for analysis and generation queues
- Review, audio, timeline/export surface placeholders

## Local Development

Copy the environment template:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose up -d postgres redis minio
```

Run the API:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Run the web app:

```bash
npm install
npm run dev:web
```

Open:

```text
http://localhost:3000
```

## Safety Notes

- API keys must stay in environment variables or encrypted user storage.
- Uploaded source material requires explicit rights confirmation before processing.
- Video providers are isolated behind an interface so Seedance, Runway, Kling, Veo, Sora, or future APIs can be swapped without rewriting production workflow data.
