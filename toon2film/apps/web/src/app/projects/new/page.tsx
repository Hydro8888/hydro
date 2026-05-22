"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clapperboard,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
  UserRound,
  WandSparkles,
  X
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";
import type { TranslationKey } from "@/lib/i18n";
import {
  createSourceFileId,
  isSourceAnalysisComplete,
  readableSourceStatus,
  sourceFileSizeLabel,
  validateSourceFiles
} from "@/lib/source-file-rules";
import { cn } from "@/lib/utils";

type Message = {
  tone: "success" | "warning" | "error";
  title: string;
  body: string;
};

type SelectedSourceFile = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  analysisStatus?: string;
};

type ProjectCreateResponse = {
  id: string;
};

type SourceFileResponse = {
  id: string;
  original_filename: string;
  page_count: number | null;
  status: string;
};

type FlowStep = "editing" | "uploading" | "uploaded" | "story" | "characters" | "storyboard";

const modes = [
  ["quick", "newProject.mode.quick"],
  ["expert", "newProject.mode.expert"],
  ["director", "newProject.mode.director"]
] satisfies Array<[string, TranslationKey]>;

const productionTypes = [
  ["Trailer", "option.trailer"],
  ["Short", "option.short"],
  ["Feature sequence", "option.featureSequence"],
  ["Short-form", "option.shortForm"]
] satisfies Array<[string, TranslationKey]>;

const styles = [
  ["Korean thriller", "option.koreanThriller"],
  ["Live-action cinema", "option.liveActionCinema"],
  ["Noir", "option.noir"],
  ["Horror", "option.horror"],
  ["Fantasy", "option.fantasy"],
  ["Sci-fi", "option.sciFi"]
] satisfies Array<[string, TranslationKey]>;

const projectLanguages = [
  ["Korean", "option.korean"],
  ["English", "option.english"],
  ["Japanese", "option.japanese"],
  ["Chinese", "option.chinese"]
] satisfies Array<[string, TranslationKey]>;

const pipelinePreview = [
  { id: "upload", label: "원본 업로드", description: "만화 / JPG / PDF", icon: UploadCloud },
  { id: "story", label: "스토리 분석", description: "AI 스토리 생성", icon: BookOpen },
  { id: "characters", label: "캐릭터 설계", description: "캐릭터 바이블", icon: UserRound },
  { id: "storyboard", label: "콘티 생성", description: "샷 & 시퀀스 구성", icon: Clapperboard },
  { id: "render", label: "영상 렌더", description: "AI 영상 생성", icon: FileText },
  { id: "export", label: "자막 / 출력", description: "편집 & 내보내기", icon: CheckCircle2 }
] as const;

const flowOrder: FlowStep[] = ["editing", "uploading", "uploaded", "story", "characters", "storyboard"];

function flowRank(step: FlowStep) {
  return flowOrder.indexOf(step);
}

function toUploadItem(file: File): SelectedSourceFile {
  return {
    id: createSourceFileId(file),
    file,
    status: "ready",
    progress: 0
  };
}

export default function NewProjectPage() {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sourceFiles, setSourceFiles] = useState<SelectedSourceFile[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState("");
  const [flowStep, setFlowStep] = useState<FlowStep>("editing");
  const canRetryUpload = Boolean(createdProjectId) && flowStep === "editing";
  const canContinuePipeline = Boolean(createdProjectId) && !["editing", "uploading"].includes(flowStep);

  function appendFiles(fileList: FileList | File[]) {
    if (createdProjectId && !canRetryUpload) {
      setMessage({
        tone: "warning",
        title: "프로젝트가 이미 생성되었습니다.",
        body: "추가 원본은 프로젝트 상세 화면의 소스 관리에서 업로드해 주세요."
      });
      return;
    }

    const incoming = Array.from(fileList);
    const { accepted, errors } = validateSourceFiles(
      incoming,
      sourceFiles.map((item) => item.file)
    );

    if (accepted.length > 0) {
      setSourceFiles((current) => [...current, ...accepted.map(toUploadItem)]);
    }

    if (errors.length > 0) {
      setMessage({
        tone: "warning",
        title: "일부 파일을 추가하지 못했습니다.",
        body: errors.join(" ")
      });
    }
  }

  function removeFile(id: string) {
    setSourceFiles((current) => current.filter((item) => item.id !== id));
  }

  function updateFile(id: string, patch: Partial<SelectedSourceFile>) {
    setSourceFiles((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadSelectedFiles(projectId: string) {
    let savedCount = 0;
    let analyzedCount = 0;
    const errors: string[] = [];

    for (const item of sourceFiles) {
      updateFile(item.id, {
        status: "uploading",
        progress: 45,
        error: undefined,
        analysisStatus: "analyzing"
      });

      const uploadPayload = new FormData();
      uploadPayload.set("rights_confirmed", "true");
      uploadPayload.set("auto_analyze", "true");
      uploadPayload.set("file", item.file);

      const uploadResult = await apiJson<SourceFileResponse>(`/projects/${projectId}/upload`, {
        method: "POST",
        body: uploadPayload
      });

      if (uploadResult.ok) {
        savedCount += 1;
        if (isSourceAnalysisComplete(uploadResult.data.status)) analyzedCount += 1;
        updateFile(item.id, {
          status: uploadResult.data.status === "analysis_failed" ? "error" : "success",
          progress: 100,
          analysisStatus: uploadResult.data.status,
          error:
            uploadResult.data.status === "analysis_failed"
              ? "파일은 저장됐지만 AI 분석이 실패했습니다. API 키와 서버 로그를 확인해 주세요."
              : undefined
        });
      } else {
        errors.push(`${item.file.name}: ${uploadResult.error}`);
        updateFile(item.id, {
          status: "error",
          progress: 100,
          error: uploadResult.error,
          analysisStatus: "upload_failed"
        });
      }
    }

    return { savedCount, analyzedCount, errors };
  }

  function applyUploadSummary(uploadSummary: { savedCount: number; analyzedCount: number; errors: string[] }) {
    setIsSubmitting(false);

    if (uploadSummary.savedCount === sourceFiles.length && uploadSummary.errors.length === 0) {
      setFlowStep("uploaded");
      setMessage({
        tone: "success",
        title:
          uploadSummary.analyzedCount === sourceFiles.length
            ? "프로젝트 생성과 원본 분석 준비가 완료되었습니다."
            : "프로젝트와 원본 파일이 저장되었습니다.",
        body:
          uploadSummary.analyzedCount === sourceFiles.length
            ? "파일 업로드와 원본 분석이 끝났습니다. 아래의 스토리 분석 시작 버튼으로 다음 단계를 진행하세요."
            : "파일 업로드가 끝났습니다. 이제 스토리 분석 시작 버튼으로 다음 단계를 진행하세요."
      });
      return;
    }

    if (uploadSummary.savedCount > 0) {
      setFlowStep("uploaded");
    } else {
      setFlowStep("editing");
    }

    setMessage({
      tone: "warning",
      title: "프로젝트는 생성됐지만 일부 업로드 확인이 필요합니다.",
      body:
        uploadSummary.savedCount > 0
          ? `${sourceFiles.length}개 중 ${uploadSummary.savedCount}개 파일을 저장했습니다. 저장된 원본으로 스토리 분석을 이어갈 수 있습니다. ${uploadSummary.errors.join(" ")}`
          : `${sourceFiles.length}개 중 저장된 파일이 없습니다. 업로드 오류를 확인한 뒤 다시 시도해 주세요. ${uploadSummary.errors.join(" ")}`
    });
  }

  function nextPipelineButtonLabel() {
    if (flowStep === "uploaded") return "스토리 분석 시작";
    if (flowStep === "story") return "캐릭터 설계 시작";
    if (flowStep === "characters") return "콘티 생성 시작";
    if (flowStep === "storyboard") return "프로젝트 상세로 이동";
    return "다음 단계 시작";
  }

  async function runNextPipelineStep() {
    if (!createdProjectId) {
      setMessage({
        tone: "error",
        title: "먼저 프로젝트와 원본을 업로드해 주세요.",
        body: "프로젝트 생성과 파일 업로드가 끝나야 스토리 분석을 시작할 수 있습니다."
      });
      return;
    }

    if (flowStep === "storyboard") {
      router.push(`/projects/${createdProjectId}`);
      return;
    }

    const action =
      flowStep === "uploaded"
        ? {
            endpoint: `/projects/${createdProjectId}/generate-story-bible`,
            next: "story" as const,
            title: "스토리 분석이 완료되었습니다.",
            body: "업로드된 만화 원본을 바탕으로 로그라인, 시놉시스, 장면 구성을 만들었습니다. 이제 캐릭터 바이블을 생성할 수 있습니다."
          }
        : flowStep === "story"
          ? {
              endpoint: `/projects/${createdProjectId}/generate-characters`,
              next: "characters" as const,
              title: "캐릭터 설계가 완료되었습니다.",
              body: "주요 인물의 역할, 외형, 성격, 영상 생성용 기준 프롬프트를 준비했습니다. 이제 콘티와 샷 구성을 생성할 수 있습니다."
            }
          : flowStep === "characters"
            ? {
                endpoint: `/projects/${createdProjectId}/generate-storyboard`,
                next: "storyboard" as const,
                title: "콘티 생성이 완료되었습니다.",
                body: "장면별 샷, 카메라, 렌즈, 조명 기준이 생성되었습니다. 프로젝트 상세에서 영상 렌더 단계로 이어갈 수 있습니다."
              }
            : null;

    if (!action) return;

    setIsPipelineRunning(true);
    setMessage(null);
    const result = await apiJson<unknown>(action.endpoint, { method: "POST" });
    setIsPipelineRunning(false);

    if (!result.ok) {
      setMessage({
        tone: "error",
        title: `${nextPipelineButtonLabel()}에 실패했습니다.`,
        body: result.error
      });
      return;
    }

    setFlowStep(action.next);
    setMessage({
      tone: "success",
      title: action.title,
      body: action.body
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectName = String(form.get("projectName") || "").trim();
    const rights = ["rightsSource", "rightsLikeness", "rightsCommercial"].every(
      (key) => form.get(key) === "on"
    );

    if (projectName.length < 2) {
      setMessage({
        tone: "error",
        title: "프로젝트명을 입력해 주세요.",
        body: "프로젝트명은 최소 2자 이상 필요합니다."
      });
      return;
    }

    if (sourceFiles.length === 0) {
      setMessage({
        tone: "error",
        title: "만화 원본 파일을 선택해 주세요.",
        body: "새 프로젝트를 만들 때 PDF, JPG, PNG, ZIP 원본을 하나 이상 함께 업로드해야 합니다."
      });
      return;
    }

    if (!rights) {
      setMessage({
        tone: "error",
        title: "권리 확인이 필요합니다.",
        body: "원본 권리, 초상권, 상업적 이용 허가 항목을 모두 확인해야 프로젝트를 시작할 수 있습니다."
      });
      return;
    }

    setIsSubmitting(true);
    setFlowStep("uploading");
    setMessage(null);

    if (createdProjectId) {
      const uploadSummary = await uploadSelectedFiles(createdProjectId);
      applyUploadSummary(uploadSummary);
      return;
    }

    const duration = Number(String(form.get("targetLength") || "60 sec").replace(/\D/g, "")) || 60;
    const result = await apiJson<ProjectCreateResponse>("/projects", {
      method: "POST",
      body: JSON.stringify({
        title: projectName,
        original_title: String(form.get("originalTitle") || "").trim() || null,
        project_type: String(form.get("productionType") || "Trailer").toLowerCase(),
        target_duration: duration,
        style: String(form.get("style") || "Korean thriller"),
        language: String(form.get("language") || "Korean"),
        aspect_ratio: String(form.get("aspectRatio") || "16:9"),
        rights_confirmed: true
      })
    });

    if (!result.ok) {
      const draft = {
        title: projectName,
        originalTitle: String(form.get("originalTitle") || "").trim(),
        files: sourceFiles.map((item) => item.file.name),
        savedAt: new Date().toISOString()
      };
      window.localStorage.setItem("toon2film.projectDraft", JSON.stringify(draft));
      setMessage({
        tone: "warning",
        title: "API 연결은 실패했지만 초안을 보존했습니다.",
        body: `${result.error} 입력값과 파일명은 브라우저의 로컬 초안으로 저장했습니다. 서버 설정이 정상화되면 같은 내용으로 다시 생성할 수 있습니다.`
      });
      setIsSubmitting(false);
      setFlowStep("editing");
      return;
    }

    setCreatedProjectId(result.data.id);
    const uploadSummary = await uploadSelectedFiles(result.data.id);
    applyUploadSummary(uploadSummary);
  }

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot grid gap-5 overflow-hidden p-5 md:grid-cols-[1fr_300px] md:items-center">
        <div>
          <div className="inline-flex h-8 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
            Start Project
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("newProject.title")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            프로젝트 정보와 만화 원본을 한 번에 등록하면 AI가 스토리 분석부터 콘티 생성까지 바로 이어갑니다.
          </p>
        </div>
        <div className="manga-board hidden h-36 rounded-lg border border-primary/20 p-3 md:block">
          <div className="grid h-full grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className="rounded border border-background/30 bg-background/25" />
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" noValidate onSubmit={handleSubmit}>
        <div className="space-y-5">
          <section className="studio-panel p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("newProject.projectName")}>
                <TextInput name="projectName" placeholder="Muyang" required minLength={2} />
              </Field>
              <Field label={t("newProject.originalTitle")}>
                <TextInput name="originalTitle" placeholder="Line 9 Shaman" />
              </Field>
              <Field label={t("newProject.productionType")}>
                <SelectInput name="productionType" defaultValue="Trailer">
                  {productionTypes.map(([value, labelKey]) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("newProject.targetLength")}>
                <SelectInput name="targetLength" defaultValue="60 sec">
                  <option>30 sec</option>
                  <option>60 sec</option>
                  <option>3 min</option>
                  <option>5 min</option>
                  <option>10 min</option>
                </SelectInput>
              </Field>
              <Field label={t("newProject.style")}>
                <SelectInput name="style" defaultValue="Korean thriller">
                  {styles.map(([value, labelKey]) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("newProject.language")}>
                <SelectInput name="language" defaultValue="Korean">
                  {projectLanguages.map(([value, labelKey]) => (
                    <option key={value} value={value}>
                      {t(labelKey)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("newProject.aspectRatio")}>
                <SelectInput name="aspectRatio" defaultValue="16:9">
                  <option>16:9</option>
                  <option>9:16</option>
                  <option>1:1</option>
                </SelectInput>
              </Field>
              <Field label={t("newProject.ratingGuardrail")}>
                <SelectInput name="ratingGuardrail" defaultValue="15+">
                  <option value="All ages">{t("option.allAges")}</option>
                  <option>12+</option>
                  <option>15+</option>
                  <option value="No adult content">{t("option.noAdultContent")}</option>
                </SelectInput>
              </Field>
            </div>
          </section>

          <section className="studio-panel p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black">만화 원본 업로드</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  PDF, JPG, PNG, ZIP 파일을 프로젝트 생성과 동시에 업로드합니다.
                </p>
              </div>
              <span className="status-pill border-primary/35 bg-primary/10 text-primary">
                필수 단계
              </span>
            </div>

            <div
              className={cn(
                "mt-4 rounded-xl border border-dashed border-border/80 bg-background/30 p-6 text-center transition",
                isDragging && "border-primary bg-primary/10"
              )}
              data-testid="source-dropzone"
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                setIsDragging(false);
                appendFiles(event.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                multiple
                data-testid="source-file-input"
                disabled={Boolean(createdProjectId) && !canRetryUpload}
                accept=".pdf,.jpg,.jpeg,.png,.zip,image/jpeg,image/png,application/pdf,application/zip"
                onChange={(event) => {
                  if (event.target.files) appendFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
                <UploadCloud className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold">파일을 끌어오거나 선택하세요</h3>
              <p className="mt-2 text-sm text-muted-foreground">최대 200MB, PDF/JPG/PNG/ZIP 지원</p>
              <Button
                className="mt-5"
                type="button"
                disabled={Boolean(createdProjectId) && !canRetryUpload}
                onClick={() => fileInputRef.current?.click()}
              >
                {createdProjectId && !canRetryUpload ? "업로드 완료" : "파일 선택"}
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              {sourceFiles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                  아직 선택된 만화 원본이 없습니다.
                </div>
              ) : (
                sourceFiles.map((item) => {
                  const Icon =
                    item.status === "success" ? CheckCircle2 : item.file.name.toLowerCase().endsWith(".zip") ? FileArchive : item.file.type.startsWith("image/") ? FileImage : FileText;
                  return (
                    <div key={item.id} className="rounded-lg border border-border/80 bg-background/35 p-4">
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="truncate text-sm font-semibold">{item.file.name}</p>
                            <span className="text-xs text-muted-foreground">{sourceFileSizeLabel(item.file.size)}</span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--warning)))] transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          {item.analysisStatus ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              상태: {readableSourceStatus(item.analysisStatus)}
                            </p>
                          ) : null}
                          {item.error ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                          disabled={isSubmitting || (Boolean(createdProjectId) && !canRetryUpload)}
                          onClick={() => removeFile(item.id)}
                          aria-label={`${item.file.name} 제거`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="studio-panel-hot overflow-hidden p-5">
            <div className="poster-frame poster-sunset mb-5 aspect-video" />
            <h2 className="text-lg font-semibold">{t("newProject.mode")}</h2>
            <div className="mt-4 grid gap-2">
              {modes.map(([value, modeKey], index) => (
                <label
                  key={modeKey}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border/80 bg-background/30 p-3 transition hover:border-primary/40 hover:bg-muted/70"
                >
                  <input
                    name="mode"
                    type="radio"
                    value={value}
                    defaultChecked={index === 1}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium">{t(modeKey)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">제작 파이프라인</h2>
            <div className="mt-4 grid gap-2">
              {pipelinePreview.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-3 transition",
                    (index === 0 && flowRank(flowStep) >= flowRank("uploaded")) ||
                      (index === 1 && flowRank(flowStep) >= flowRank("story")) ||
                      (index === 2 && flowRank(flowStep) >= flowRank("characters")) ||
                      (index === 3 && flowRank(flowStep) >= flowRank("storyboard"))
                      ? "border-success/35 bg-success/10"
                      : (index === 0 && ["editing", "uploading"].includes(flowStep)) ||
                          (index === 1 && flowStep === "uploaded") ||
                          (index === 2 && flowStep === "story") ||
                          (index === 3 && flowStep === "characters") ||
                          (index === 4 && flowStep === "storyboard")
                        ? "border-primary/45 bg-primary/10"
                        : "border-border/80 bg-background/30"
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-black text-primary">
                    {(index === 0 && flowRank(flowStep) >= flowRank("uploaded")) ||
                    (index === 1 && flowRank(flowStep) >= flowRank("story")) ||
                    (index === 2 && flowRank(flowStep) >= flowRank("characters")) ||
                    (index === 3 && flowRank(flowStep) >= flowRank("storyboard")) ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <step.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{step.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
              {t("newProject.rights")}
            </h2>
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input name="rightsSource" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.source")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input name="rightsLikeness" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.likeness")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input name="rightsCommercial" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.commercial")}</span>
              </label>
            </div>
          </section>

          <Button
            className="w-full"
            disabled={isSubmitting || (Boolean(createdProjectId) && !canRetryUpload)}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting
              ? "프로젝트 생성 및 업로드 중..."
              : canRetryUpload
                ? "업로드 다시 시도"
                : createdProjectId
                ? "프로젝트 생성 완료"
                : "프로젝트 만들고 업로드"}
          </Button>
          {canContinuePipeline ? (
            <Button
              className="w-full"
              type="button"
              variant={flowStep === "storyboard" ? "secondary" : "primary"}
              disabled={isPipelineRunning || isSubmitting}
              data-testid="next-pipeline-step"
              onClick={runNextPipelineStep}
            >
              {isPipelineRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : flowStep === "storyboard" ? (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {isPipelineRunning ? "AI가 다음 단계를 작성 중..." : nextPipelineButtonLabel()}
            </Button>
          ) : null}
          <Button
            className="w-full"
            type="button"
            variant="secondary"
            disabled={Boolean(createdProjectId)}
            onClick={() =>
              setMessage({
                tone: "success",
                title: "소스 기반 초안이 준비됩니다.",
                body: "이 화면에서 원본을 추가하면 Story Architect 단계까지 한 번에 이어집니다."
              })
            }
          >
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {t("newProject.draft")}
          </Button>
        </aside>
      </form>
    </div>
  );
}
