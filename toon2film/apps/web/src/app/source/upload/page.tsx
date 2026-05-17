"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileArchive, FileImage, FileText, UploadCloud } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";

const fileTypes = [
  { label: "PDF", icon: FileText },
  { label: "JPG / PNG", icon: FileImage },
  { label: "ZIP", icon: FileArchive }
];

export default function SourceUploadPage() {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [projectId, setProjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    setProjectId(new URLSearchParams(window.location.search).get("projectId") || "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rightsConfirmed = ["rightsSource", "rightsLikeness", "rightsCommercial"].every(
      (key) => form.get(key) === "on"
    );

    if (!selectedFile) {
      setMessage({
        tone: "error",
        title: "업로드할 파일을 선택해 주세요.",
        body: "PDF, JPG, PNG, ZIP 또는 긴 웹툰 이미지를 선택해야 분석 단계로 이동할 수 있습니다."
      });
      return;
    }

    if (!rightsConfirmed) {
      setMessage({
        tone: "error",
        title: "권리 확인이 필요합니다.",
        body: "원본 권리와 상업적 이용 가능 여부를 모두 확인해야 업로드를 진행할 수 있습니다."
      });
      return;
    }

    if (!projectId) {
      setMessage({
        tone: "warning",
        title: "프로젝트 ID가 필요합니다.",
        body: "실제 업로드 저장은 /source/upload?projectId=<UUID> 형태로 진입했을 때 백엔드와 연결됩니다. 현재는 파일 검증까지만 완료했습니다."
      });
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.set("rights_confirmed", "true");
    uploadPayload.set("file", selectedFile);
    setIsSubmitting(true);
    const result = await apiJson<{ id: string; original_filename: string }>(
      `/projects/${projectId}/upload`,
      {
        method: "POST",
        body: uploadPayload
      }
    );
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({
        tone: "error",
        title: "업로드에 실패했습니다.",
        body: result.error
      });
      return;
    }

    setMessage({
      tone: "success",
      title: "업로드가 완료되었습니다.",
      body: `${result.data.original_filename || selectedFile.name} 파일이 프로젝트 소스로 저장되었습니다.`
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

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" noValidate onSubmit={handleSubmit}>
        <div className="studio-panel-hot relative overflow-hidden border-dashed p-8 text-center">
          <div className="comic-paper absolute inset-x-8 top-8 h-28 rounded-md border border-primary/20 opacity-30" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="relative mt-5 text-xl font-semibold">{t("source.dropFiles")}</h2>
          <p className="relative mt-2 text-sm text-muted-foreground">
            {t("source.supported")}
          </p>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.zip,image/jpeg,image/png,application/pdf,application/zip"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <Button
            className="relative mt-6"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("source.chooseFiles")}
          </Button>
          {selectedFile ? (
            <p className="relative mt-3 text-sm font-semibold text-foreground">
              {selectedFile.name}
            </p>
          ) : null}
          {projectId ? (
            <p className="relative mt-2 text-xs text-muted-foreground">
              Project ID: {projectId}
            </p>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">{t("source.accepted")}</h2>
            <div className="mt-4 grid gap-3">
              {fileTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.label}
                    className="flex items-center gap-3 rounded-md border border-border/80 bg-background/30 p-3"
                  >
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
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "업로드 중..." : "분석 큐 준비"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
