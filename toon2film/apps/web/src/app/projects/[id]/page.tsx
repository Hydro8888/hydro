"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Captions,
  Clapperboard,
  FileText,
  Film,
  Loader2,
  ListChecks,
  MonitorPlay,
  UploadCloud,
  UserRound
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { PipelineMonitor, type MonitorStep } from "@/components/pipeline-monitor";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";
import { pipelineSteps, projects, shots as mockShots } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PipelineStatus } from "@/lib/types";

type PipelineState = {
  project_id: string;
  project_name: string;
  status:
    | "DRAFT"
    | "RAW_UPLOADED"
    | "STORY_ANALYZED"
    | "CHAR_DESIGNED"
    | "STORYBOARD_READY"
    | "VIDEO_RENDER_READY"
    | "EXPORT_READY";
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
  render_jobs: Array<{
    job_id: string;
    shot_id: string;
    provider: string;
    status: string;
  }>;
  exports: Array<{
    export_id: string;
    export_type: string;
    status: string;
  }>;
  subtitle_tracks: number;
  steps: Array<{
    id: string;
    title: string;
    subtitle: string;
    status: PipelineStatus;
    count: number;
  }>;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const statusMap: Record<PipelineState["status"], PipelineStatus> = {
  DRAFT: "ready",
  RAW_UPLOADED: "processing",
  STORY_ANALYZED: "review",
  CHAR_DESIGNED: "processing",
  STORYBOARD_READY: "processing",
  VIDEO_RENDER_READY: "blocked",
  EXPORT_READY: "done"
};

const progressByStatus: Record<PipelineState["status"], number> = {
  DRAFT: 5,
  RAW_UPLOADED: 18,
  STORY_ANALYZED: 38,
  CHAR_DESIGNED: 55,
  STORYBOARD_READY: 72,
  VIDEO_RENDER_READY: 88,
  EXPORT_READY: 100
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
    STORYBOARD_READY: "콘티 생성 완료",
    VIDEO_RENDER_READY: "영상 렌더 준비",
    EXPORT_READY: "자막 / 출력 준비"
  }[status];
}

export default function ProjectPage() {
  const { t } = useI18n();
  const router = useRouter();
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
        body: "샘플 프로젝트에서는 미리보기만 제공합니다. 새 프로젝트를 만든 뒤 진입하면 API 단계가 실행됩니다."
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

  function monitorStepResult(stepId: string) {
    if (!pipeline) {
      return stepId === "upload"
        ? "샘플 원본과 제작 문서가 준비된 미리보기입니다."
        : "실제 프로젝트에서는 AI 실행 결과가 여기에 표시됩니다.";
    }

    if (stepId === "upload") {
      return pipeline.raw_files.length
        ? `${pipeline.raw_files.length}개 원본 파일 연결 완료`
        : "아직 업로드된 원본이 없습니다.";
    }
    if (stepId === "story") {
      return pipeline.story_analysis
        ? `${pipeline.story_analysis.scenes.length}개 씬 분석 완료 / ${pipeline.story_analysis.logline || "로그라인 생성"}`
        : "스토리 분석 전입니다.";
    }
    if (stepId === "character" || stepId === "characters") {
      return pipeline.character_bible.length
        ? `${pipeline.character_bible.length}명 캐릭터 설계 완료`
        : "캐릭터 바이블 생성 전입니다.";
    }
    if (stepId === "storyboard" || stepId === "shots") {
      return pipeline.storyboard.length
        ? `${pipeline.storyboard.length}개 콘티 샷 생성 완료`
        : "콘티와 샷 구성 생성 전입니다.";
    }
    if (stepId === "render") {
      return pipeline.render_jobs.length
        ? `${pipeline.render_jobs.length}개 영상 렌더 작업 연결`
        : "콘티 생성 후 영상 렌더 단계로 이동할 수 있습니다.";
    }
    if (stepId === "export") {
      return pipeline.exports.length || pipeline.subtitle_tracks
        ? `자막 ${pipeline.subtitle_tracks}개 / 출력 ${pipeline.exports.length}개 준비`
        : "렌더 이후 자막과 출력 결과가 표시됩니다.";
    }
    return "단계 결과 대기 중입니다.";
  }

  function monitorStepActionLabel(stepId: string) {
    if (stepId === "upload") return "업로드/소스 관리";
    if (stepId === "story") return pipeline?.story_analysis ? "스토리 결과 보기" : "스토리 분석 실행";
    if (stepId === "character" || stepId === "characters") {
      return pipeline?.character_bible.length ? "캐릭터 결과 보기" : "캐릭터 설계 실행";
    }
    if (stepId === "storyboard" || stepId === "shots") {
      return pipeline?.storyboard.length ? "샷 목록 보기" : "콘티 생성 실행";
    }
    if (stepId === "render") return "영상 제작 화면으로";
    if (stepId === "export") return "출력 센터로";
    return "단계 열기";
  }

  async function handleMonitorStepClick(step: MonitorStep) {
    if (isLoading || runningAction) return;

    if (step.id === "upload") {
      router.push(`/source/upload?projectId=${id}`);
      return;
    }

    if (!isApiProject) {
      setMessage({
        tone: "warning",
        title: "샘플 프로젝트입니다.",
        body: "새 프로젝트에서 원본을 업로드해 생성된 실제 프로젝트 화면에서는 이 카드 클릭으로 AI 단계를 바로 실행할 수 있습니다."
      });
      return;
    }

    if (step.id === "story") {
      if (pipeline?.story_analysis) {
        setMessage({
          tone: "success",
          title: "스토리 분석 결과",
          body: `${pipeline.story_analysis.scenes.length}개 씬과 시놉시스가 생성되어 있습니다. 아래 스토리 분석 결과 패널에서 내용을 확인할 수 있습니다.`
        });
        return;
      }
      await runPipelineAction("story");
      return;
    }

    if (step.id === "character" || step.id === "characters") {
      if (!pipeline?.story_analysis) {
        setMessage({
          tone: "warning",
          title: "스토리 분석이 먼저 필요합니다.",
          body: "캐릭터 설계는 스토리 분석 결과를 기반으로 주요 인물과 성격, 외형 프롬프트를 만듭니다."
        });
        return;
      }
      if (pipeline.character_bible.length) {
        setMessage({
          tone: "success",
          title: "캐릭터 설계 결과",
          body: `${pipeline.character_bible.length}명 캐릭터 바이블이 준비되어 있습니다.`
        });
        return;
      }
      await runPipelineAction("characters");
      return;
    }

    if (step.id === "storyboard" || step.id === "shots") {
      if (!pipeline?.character_bible.length) {
        setMessage({
          tone: "warning",
          title: "캐릭터 설계가 먼저 필요합니다.",
          body: "콘티 생성은 캐릭터 바이블과 씬 정보를 함께 사용해 샷과 카메라 연출을 만듭니다."
        });
        return;
      }
      if (pipeline.storyboard.length) {
        setMessage({
          tone: "success",
          title: "콘티 생성 결과",
          body: `${pipeline.storyboard.length}개 콘티 샷이 생성되어 아래 샷 리스트에서 확인할 수 있습니다.`
        });
        return;
      }
      await runPipelineAction("storyboard");
      return;
    }

    if (step.id === "render") {
      router.push("/video-studio");
      return;
    }

    if (step.id === "export") {
      router.push("/export");
    }
  }

  const title = pipeline?.project_name ?? mockProject.title;
  const projectStatus = pipeline ? statusMap[pipeline.status] : mockProject.status;
  const monitorSteps = useMemo<MonitorStep[]>(
    () =>
      pipeline?.steps.map((step) => ({
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        status: step.status,
        count: step.count || undefined,
        result: monitorStepResult(step.id),
        actionLabel: monitorStepActionLabel(step.id),
        disabled: isLoading || Boolean(runningAction)
      })) ??
      pipelineSteps.map((step) => ({
        id: step.id,
        title: t(step.titleKey),
        subtitle: t(step.subtitleKey),
        status: step.status,
        count: step.count,
        result: monitorStepResult(step.id),
        actionLabel: monitorStepActionLabel(step.id),
        disabled: isLoading || Boolean(runningAction)
      })),
    [isLoading, pipeline, runningAction, t]
  );
  const monitorProgress = pipeline ? progressByStatus[pipeline.status] : mockProject.progress;
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
        label: "콘티 생성",
        icon: Clapperboard,
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
      },
      {
        label: "영상 렌더",
        icon: MonitorPlay,
        status: pipeline?.render_jobs.length ? ("blocked" as const) : ("ready" as const),
        value: pipeline?.render_jobs.length
          ? `${pipeline.render_jobs.length}개 AI 영상 렌더 작업 준비`
          : "콘티 생성 다음 단계의 AI 영상 프롬프트를 준비합니다.",
        action: (
          <Link href="/video-studio" className="text-xs font-bold text-primary">
            영상 제작으로 이동
          </Link>
        )
      },
      {
        label: "자막 / 출력",
        icon: Captions,
        status: pipeline?.exports.length || pipeline?.subtitle_tracks ? ("done" as const) : ("ready" as const),
        value:
          pipeline?.exports.length || pipeline?.subtitle_tracks
            ? `자막 ${pipeline.subtitle_tracks}개 / 출력 ${pipeline.exports.length}개 준비`
            : "렌더 작업 이후 편집과 내보내기 초안을 만듭니다.",
        action: (
          <Link href="/export" className="text-xs font-bold text-primary">
            내보내기로 이동
          </Link>
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
              style={{ width: `${monitorProgress}%` }}
            />
          </div>
          {isApiProject ? (
            <p className="mt-3 text-xs text-muted-foreground">
              API 프로젝트: {isLoading ? "상태 확인 중..." : statusLabel(pipeline?.status)}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              샘플 프로젝트 미리보기입니다. 실제 파일 업로드 후 생성된 프로젝트에서는 API 실행 버튼이 활성화됩니다.
            </p>
          )}
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

      <PipelineMonitor
        title="제작 진행 모니터"
        subtitle={
          isApiProject
            ? `서버 파이프라인 상태: ${isLoading ? "확인 중..." : statusLabel(pipeline?.status)}`
            : "샘플 프로젝트의 제작 흐름입니다. 실제 프로젝트는 업로드 이후 서버 상태와 동기화됩니다."
        }
        steps={monitorSteps}
        progress={monitorProgress}
        isLoading={isLoading || Boolean(runningAction)}
        onStepClick={handleMonitorStepClick}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
