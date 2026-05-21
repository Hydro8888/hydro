"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  BookOpen,
  Captions,
  CheckCircle2,
  Clapperboard,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  MonitorPlay,
  UploadCloud,
  UserRound,
  XCircle
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type UploadStatus = "ready" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  analysisStatus?: string;
};

type SourceFileResponse = {
  id: string;
  original_filename: string;
  page_count: number | null;
  status: string;
};

const fileTypes = [
  { label: "PDF", icon: FileText },
  { label: "JPG / PNG", icon: FileImage },
  { label: "ZIP", icon: FileArchive }
];

const pipelinePreview = [
  { title: "원본 업로드", body: "만화 / JPG / PDF", icon: UploadCloud },
  { title: "스토리 분석", body: "AI 스토리 생성", icon: BookOpen },
  { title: "캐릭터 설계", body: "캐릭터 바이블", icon: UserRound },
  { title: "콘티 생성", body: "샷 & 시퀀스 구성", icon: Clapperboard },
  { title: "영상 렌더", body: "AI 영상 생성", icon: MonitorPlay },
  { title: "자막 / 출력", body: "편집 & 내보내기", icon: Captions }
];

const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "zip"]);
const maxFileBytes = 200 * 1024 * 1024;

function createId(file: File) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

function makeUploadItem(file: File): UploadItem {
  return {
    id: createId(file),
    file,
    status: "ready",
    progress: 0
  };
}

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAnalysisComplete(status: string) {
  return ["analyzed", "processed", "processed_without_ai"].includes(status);
}

function readableStatus(status?: string) {
  if (!status) return "대기 중";
  return {
    analyzed: "AI 분석 완료",
    processed: "처리 완료",
    processed_without_ai: "AI 없이 저장 완료",
    analysis_failed: "AI 분석 실패",
    uploaded: "업로드 완료"
  }[status] ?? status;
}

export default function SourceUploadPage() {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  const summary = useMemo(() => {
    const success = items.filter((item) => item.status === "success").length;
    const error = items.filter((item) => item.status === "error").length;
    return { total: items.length, success, error };
  }, [items]);

  useEffect(() => {
    setProjectId(new URLSearchParams(window.location.search).get("projectId") || "");
  }, []);

  function appendFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const valid: UploadItem[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      const extension = extensionOf(file);
      const duplicate = items.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified
      );

      if (duplicate) {
        errors.push(`${file.name}: 이미 선택된 파일입니다.`);
        continue;
      }
      if (!allowedExtensions.has(extension)) {
        errors.push(`${file.name}: PDF, JPG, PNG, ZIP만 업로드할 수 있습니다.`);
        continue;
      }
      if (file.size <= 0) {
        errors.push(`${file.name}: 빈 파일은 업로드할 수 없습니다.`);
        continue;
      }
      if (file.size > maxFileBytes) {
        errors.push(`${file.name}: 파일 크기가 200MB를 초과했습니다.`);
        continue;
      }
      valid.push(makeUploadItem(file));
    }

    if (valid.length > 0) {
      setItems((current) => [...current, ...valid]);
    }
    if (errors.length > 0) {
      setMessage({
        tone: "warning",
        title: "일부 파일을 추가하지 못했습니다.",
        body: errors.join(" ")
      });
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    appendFiles(event.dataTransfer.files);
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rightsConfirmed = ["rightsSource", "rightsLikeness", "rightsCommercial"].every(
      (key) => form.get(key) === "on"
    );

    if (items.length === 0) {
      setMessage({
        tone: "error",
        title: "업로드할 파일을 선택해 주세요.",
        body: "PDF, JPG, PNG, ZIP 원본 파일을 하나 이상 추가해야 합니다."
      });
      return;
    }

    if (!rightsConfirmed) {
      setMessage({
        tone: "error",
        title: "권리 확인이 필요합니다.",
        body: "원본 권리, 초상권, 상업적 이용 가능 여부를 모두 확인해야 업로드를 진행할 수 있습니다."
      });
      return;
    }

    if (!projectId) {
      setMessage({
        tone: "warning",
        title: "프로젝트 ID가 필요합니다.",
        body: "실제 업로드는 새 프로젝트 생성 후 자동 이동된 업로드 화면에서 진행됩니다."
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    let successCount = 0;
    let analyzedCount = 0;

    for (const item of items) {
      if (item.status === "success") {
        successCount += 1;
        if (item.analysisStatus && isAnalysisComplete(item.analysisStatus)) analyzedCount += 1;
        continue;
      }

      updateItem(item.id, {
        status: "uploading",
        progress: 45,
        error: undefined,
        analysisStatus: "AI 분석 중"
      });
      const uploadPayload = new FormData();
      uploadPayload.set("rights_confirmed", "true");
      uploadPayload.set("auto_analyze", "true");
      uploadPayload.set("file", item.file);

      const result = await apiJson<SourceFileResponse>(`/projects/${projectId}/upload`, {
        method: "POST",
        body: uploadPayload
      });

      if (result.ok) {
        successCount += 1;
        if (isAnalysisComplete(result.data.status)) analyzedCount += 1;
        updateItem(item.id, {
          status: result.data.status === "analysis_failed" ? "error" : "success",
          progress: 100,
          analysisStatus: result.data.status,
          error:
            result.data.status === "analysis_failed"
              ? "파일은 저장되었지만 AI 분석에 실패했습니다. API 키 또는 서버 로그를 확인해 주세요."
              : undefined
        });
      } else {
        updateItem(item.id, { status: "error", progress: 100, error: result.error });
      }
    }

    setIsSubmitting(false);
    setMessage({
      tone: analyzedCount === items.length ? "success" : successCount > 0 ? "warning" : "error",
      title:
        analyzedCount === items.length
          ? "업로드와 AI 분석이 완료되었습니다."
          : successCount > 0
            ? "업로드는 완료되었지만 일부 분석 확인이 필요합니다."
            : "파일 업로드가 실패했습니다.",
      body:
        analyzedCount === items.length
          ? "스토리 분석, 캐릭터 바이블, 콘티, 영상 렌더 작업 초안, 자막/출력 초안이 프로젝트에 자동 저장되었습니다."
          : `${items.length}개 중 ${successCount}개 파일이 저장되었고 ${analyzedCount}개 파일이 분석되었습니다.`
    });
  }

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot grid gap-5 overflow-hidden p-5 md:grid-cols-[1fr_300px] md:items-center">
        <div>
          <div className="inline-flex h-8 items-center rounded-md border border-accent/35 bg-accent/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-accent">
            Source Intake
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("source.title")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("source.subtitle")}
          </p>
        </div>
        <div className="film-strip hidden h-36 rounded-lg border border-border/80 p-4 md:block">
          <div className="manga-board h-full rounded border border-foreground/15" />
        </div>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      {!projectId ? (
        <Notice tone="warning" title="프로젝트를 먼저 생성해 주세요.">
          업로드 파일은 프로젝트에 연결되어 저장됩니다. 새 프로젝트 화면에서 프로젝트를 만들면 업로드 화면으로 자동 이동합니다.{" "}
          <Link href="/projects/new" className="font-bold text-primary underline underline-offset-4">
            새 프로젝트 만들기
          </Link>
        </Notice>
      ) : null}

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" noValidate onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div
            className={cn(
              "studio-panel-hot relative overflow-hidden border-dashed p-8 text-center transition",
              isDragging && "border-primary bg-primary/10"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="comic-paper absolute inset-x-8 top-8 h-28 rounded-md border border-primary/20 opacity-30" />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
              <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="relative mt-5 text-xl font-semibold">{t("source.dropFiles")}</h2>
            <p className="relative mt-2 text-sm text-muted-foreground">{t("source.supported")}</p>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.zip,image/jpeg,image/png,application/pdf,application/zip"
              onChange={(event) => {
                if (event.target.files) appendFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <Button className="relative mt-6" type="button" onClick={() => fileInputRef.current?.click()}>
              {t("source.chooseFiles")}
            </Button>
            {projectId ? (
              <p className="relative mt-3 text-xs text-muted-foreground">Project ID: {projectId}</p>
            ) : null}
          </div>

          <section className="studio-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-border/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">업로드 목록</h2>
                <p className="text-sm text-muted-foreground">
                  {summary.total}개 선택 / 성공 {summary.success} / 실패 {summary.error}
                </p>
              </div>
              {items.length > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setItems([])} disabled={isSubmitting}>
                  목록 비우기
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 p-4">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
                  아직 선택된 원본 파일이 없습니다.
                </div>
              ) : (
                items.map((item) => {
                  const Icon = item.status === "success" ? CheckCircle2 : item.status === "error" ? XCircle : FileText;
                  return (
                    <div key={item.id} className="rounded-lg border border-border/80 bg-background/35 p-4">
                      <div className="flex items-start gap-3">
                        <Icon
                          className={cn(
                            "mt-0.5 h-5 w-5 shrink-0",
                            item.status === "success" && "text-success",
                            item.status === "error" && "text-destructive",
                            item.status === "ready" && "text-muted-foreground",
                            item.status === "uploading" && "text-primary"
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="truncate text-sm font-semibold">{item.file.name}</p>
                            <span className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--warning)))] transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          {item.analysisStatus ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              분석 상태: {readableStatus(item.analysisStatus)}
                            </p>
                          ) : null}
                          {item.error ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">AI 제작 파이프라인</h2>
            <div className="mt-4 grid gap-3">
              {pipelinePreview.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-start gap-3 rounded-md border border-border/80 bg-background/30 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold">{index + 1}. {step.title}</div>
                      <div className="text-xs text-muted-foreground">{step.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">{t("source.accepted")}</h2>
            <div className="mt-4 grid gap-3">
              {fileTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.label} className="flex items-center gap-3 rounded-md border border-border/80 bg-background/30 p-3">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">{t("source.rightsCheck")}</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input name="rightsSource" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.source")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input name="rightsLikeness" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.likeness")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input name="rightsCommercial" type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.commercial")}</span>
              </label>
            </div>
          </section>

          <Button className="w-full" type="submit" disabled={isSubmitting || !projectId}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting ? "업로드 및 AI 분석 중..." : "업로드 및 AI 분석"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
