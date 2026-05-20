"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, FileText, Loader2, ListChecks, UploadCloud, UserRound } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";
import { projects, shots as mockShots } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PipelineStatus } from "@/lib/types";

type PipelineState = {
  project_id: string;
  project_name: string;
  status: "DRAFT" | "RAW_UPLOADED" | "STORY_ANALYZED" | "CHAR_DESIGNED" | "STORYBOARD_READY";
  raw_files: Array<{
    file_id: string;
    url: string;
    page_num: number;
    original_filename: string;
    status: string;
  }>;
  story_analysis: {
    logline: string;
    synopsis: string;
    scenes: Array<{
      scene_id: number;
      summary: string;
      location?: string | null;
      time?: string | null;
    }>;
  } | null;
  character_bible: Array<{
    character_id: string;
    name: string;
    appearance_description: string;
    personality: string;
    reference_image_prompt: string;
  }>;
  storyboard: Array<{
    shot_id: string;
    scene_id: number;
    visual_prompt: string;
    camera_angle: string;
    dialogue_or_action: string;
  }>;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const statusMap: Record<PipelineState["status"], PipelineStatus> = {
  DRAFT: "ready",
  RAW_UPLOADED: "processing",
  STORY_ANALYZED: "review",
  CHAR_DESIGNED: "processing",
  STORYBOARD_READY: "done"
};

function assetPath(path: string) {
  return `${basePath}${path}`;
}

function statusLabel(status: PipelineState["status"] | undefined) {
  if (!status) return "연결 대기";
  return {
    DRAFT: "초안",
    RAW_UPLOADED: "원본 업로드 완료",
    STORY_ANALYZED: "스토리 분석 완료",
    CHAR_DESIGNED: "캐릭터 설계 완료",
    STORYBOARD_READY: "콘티 준비 완료"
  }[status];
}

export default function ProjectPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isApiProject = uuidPattern.test(id);
  const mockProject = projects.find((item) => item.id === id) ?? projects[0];
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  const loadPipeline = useCallback(async () => {
    if (!isApiProject) return;
    setIsLoading(true);
    const result = await apiJson<PipelineState>(`/projects/${id}/pipeline-state`);
    setIsLoading(false);
    if (result.ok) {
      setPipeline(result.data);
    } else {
      setMessage({
        tone: "warning",
        title: "파이프라인 상태를 불러오지 못했습니다.",
        body: result.error
      });
    }
  }, [id, isApiProject]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  async function runPipelineAction(action: "story" | "characters" | "storyboard") {
    if (!isApiProject) {
      setMessage({
        tone: "warning",
        title: "실제 프로젝트 ID가 필요합니다.",
        body: "샘플 프로젝트에서는 미리보기만 제공됩니다. 새 프로젝트를 만든 뒤 진입하면 API 단계가 실행됩니다."
      });
      return;
    }

    const endpoint =
      action === "story"
        ? `/projects/${id}/generate-story-bible`
        : action === "characters"
          ? `/projects/${id}/generate-characters`
          : `/projects/${id}/generate-storyboard`;

    setRunningAction(action);
    const result = await apiJson<unknown>(endpoint, { method: "POST" });
    setRunningAction(null);

    if (!result.ok) {
      setMessage({
        tone: "error",
        title: "파이프라인 실행에 실패했습니다.",
        body: result.error
      });
      return;
    }

    await loadPipeline();
    setMessage({
      tone: "success",
      title: "파이프라인 단계가 완료되었습니다.",
      body:
        action === "story"
          ? "스토리 분석과 씬 분할이 생성되었습니다."
          : action === "characters"
            ? "캐릭터 바이블이 생성되었습니다."
            : "콘티와 샷 리스트가 생성되었습니다."
    });
  }

  const title = pipeline?.project_name ?? mockProject.title;
  const projectStatus = pipeline ? statusMap[pipeline.status] : mockProject.status;
  const storyboardRows = pipeline?.storyboard.length
    ? pipeline.storyboard.map((shot, index) => ({
        id: shot.shot_id,
        scene: `S#${String(shot.scene_id).padStart(2, "0")}`,
        shot: String(index + 1).padStart(2, "0"),
        framing: shot.camera_angle,
        camera: "AI planned",
        summary: shot.dialogue_or_action || shot.visual_prompt,
        duration: "4-6 sec",
        status: "ready" as PipelineStatus
      }))
    : mockShots;

  const productionDocs = useMemo(
    () => [
      {
        label: "원본 업로드",
        icon: UploadCloud,
        status: pipeline?.raw_files.length ? ("done" as const) : ("ready" as const),
        value: pipeline ? `${pipeline.raw_files.length}개 소스 파일` : "프로젝트 원본 대기",
        action: (
          <Link href={`/source/upload?projectId=${id}`} className="text-xs font-bold text-primary">
            업로드로 이동
          </Link>
        )
      },
      {
        label: t("project.storyBible"),
        icon: FileText,
        status: pipeline?.story_analysis ? ("done" as const) : ("review" as const),
        value: pipeline?.story_analysis
          ? `${pipeline.story_analysis.scenes.length}개 씬 분석 완료`
          : t("project.storyBibleValue"),
        action: (
          <Button
            type="button"
            className="h-9 px-3 text-xs"
            variant="secondary"
            disabled={runningAction === "story"}
            onClick={() => runPipelineAction("story")}
          >
            {runningAction === "story" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            스토리 분석
          </Button>
        )
      },
      {
        label: t("project.characterBible"),
        icon: UserRound,
        status: pipeline?.character_bible.length ? ("done" as const) : ("processing" as const),
        value: pipeline?.character_bible.length
          ? `${pipeline.character_bible.length}명 캐릭터 설계 완료`
          : t("project.characterBibleValue"),
        action: (
          <Button
            type="button"
            className="h-9 px-3 text-xs"
            variant="secondary"
            disabled={runningAction === "characters"}
            onClick={() => runPipelineAction("characters")}
          >
            {runningAction === "characters" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            캐릭터 설계
          </Button>
        )
      },
      {
        label: t("project.shotList"),
        icon: Camera,
        status: pipeline?.storyboard.length ? ("done" as const) : ("processing" as const),
        value: pipeline?.storyboard.length
          ? `${pipeline.storyboard.length}개 콘티 샷 생성 완료`
          : t("project.shotListValue"),
        action: (
          <Button
            type="button"
            className="h-9 px-3 text-xs"
            variant="secondary"
            disabled={runningAction === "storyboard"}
            onClick={() => runPipelineAction("storyboard")}
          >
            {runningAction === "storyboard" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            콘티 생성
          </Button>
        )
      }
    ],
    [id, pipeline, runningAction, t]
  );

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot grid gap-5 overflow-hidden p-5 lg:grid-cols-[1fr_320px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <StatusBadge status={projectStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mockProject.originalTitle} / {mockProject.type} / {mockProject.duration}
          </p>
          <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(271_91%_65%))]"
              style={{
                width: `${pipeline?.status === "STORYBOARD_READY" ? 100 : mockProject.progress}%`
              }}
            />
          </div>
          {isApiProject ? (
            <p className="mt-3 text-xs text-muted-foreground">
              API 프로젝트: {isLoading ? "상태 확인 중..." : statusLabel(pipeline?.status)}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3">
          <div className={cn("poster-frame has-image hidden aspect-video lg:block", `poster-${mockProject.thumbnailTone}`)}>
            <img
              src={assetPath(mockProject.thumbnailImage)}
              alt={`${mockProject.title} poster`}
              className="project-poster-image"
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              type="button"
              variant="secondary"
              onClick={loadPipeline}
              disabled={!isApiProject || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
              상태 갱신
            </Button>
            <Button
              className="flex-1"
              type="button"
              onClick={() => runPipelineAction("storyboard")}
              disabled={runningAction === "storyboard"}
            >
              {runningAction === "storyboard" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              콘티 생성
            </Button>
          </div>
        </div>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div key={doc.label} className="studio-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <StatusBadge status={doc.status} />
              </div>
              <h2 className="mt-4 font-semibold">{doc.label}</h2>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{doc.value}</p>
              <div className="mt-4">{doc.action}</div>
            </div>
          );
        })}
      </section>

      {pipeline?.story_analysis ? (
        <section className="studio-panel p-5">
          <h2 className="text-lg font-semibold">스토리 분석 결과</h2>
          <p className="mt-2 text-sm font-semibold text-primary">{pipeline.story_analysis.logline}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{pipeline.story_analysis.synopsis}</p>
        </section>
      ) : null}

      <section className="studio-panel overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <h2 className="text-lg font-semibold">{t("project.shotList")}</h2>
          <p className="text-sm text-muted-foreground">{t("project.shotPlanning")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/80 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t("project.scene")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.shot")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.framing")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.camera")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.action")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.length")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {storyboardRows.map((shot) => (
                <tr key={shot.id}>
                  <td className="px-5 py-4 font-medium">{shot.scene}</td>
                  <td className="px-5 py-4">{shot.shot}</td>
                  <td className="px-5 py-4">{shot.framing}</td>
                  <td className="px-5 py-4">{shot.camera}</td>
                  <td className="px-5 py-4 text-muted-foreground">{shot.summary}</td>
                  <td className="px-5 py-4">{shot.duration}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={shot.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
