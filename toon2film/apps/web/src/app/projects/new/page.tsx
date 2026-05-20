"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, WandSparkles } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { apiJson } from "@/lib/api-client";
import type { TranslationKey } from "@/lib/i18n";

const modes = [
  "newProject.mode.quick",
  "newProject.mode.expert",
  "newProject.mode.director"
] satisfies TranslationKey[];

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

export default function NewProjectPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectName = String(form.get("projectName") || "").trim();
    const rights = ["rightsSource", "rightsLikeness", "rightsCommercial"].every(
      (key) => form.get(key) === "on"
    );

    if (!projectName) {
      setMessage({
        tone: "error",
        title: "프로젝트명을 입력해주세요.",
        body: "새 프로젝트를 만들려면 최소한 프로젝트명이 필요합니다."
      });
      return;
    }

    if (!rights) {
      setMessage({
        tone: "error",
        title: "권리 확인이 필요합니다.",
        body: "원본 권리, 초상권, 상업적 이용 허가 항목을 모두 확인해야 제작을 시작할 수 있습니다."
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const duration = Number(String(form.get("targetLength") || "60 sec").replace(/\D/g, "")) || 60;
    const result = await apiJson<{ id: string }>("/projects", {
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

    if (result.ok) {
      setMessage({
        tone: "success",
        title: "프로젝트가 생성되었습니다.",
        body: "원본 업로드 화면으로 이동합니다."
      });
      router.push(`/source/upload?projectId=${result.data.id}`);
    } else {
      const draft = {
        title: projectName,
        originalTitle: String(form.get("originalTitle") || "").trim(),
        savedAt: new Date().toISOString()
      };
      window.localStorage.setItem("toon2film.projectDraft", JSON.stringify(draft));
      setMessage({
        tone: "warning",
        title: "서버 저장소 확인이 필요합니다.",
        body: `${result.error} 입력값은 이 브라우저에 임시 초안으로 보존했습니다. 서버 반영 후 같은 내용으로 다시 생성할 수 있습니다.`
      });
    }

    setIsSubmitting(false);
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
            {t("newProject.subtitle")}
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
        <section className="studio-panel p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("newProject.projectName")}>
              <TextInput name="projectName" placeholder="Muyang" required minLength={1} />
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

        <aside className="space-y-4">
          <section className="studio-panel-hot overflow-hidden p-5">
            <div className="poster-frame poster-sunset mb-5 aspect-video" />
            <h2 className="text-lg font-semibold">{t("newProject.mode")}</h2>
            <div className="mt-4 grid gap-2">
              {modes.map((modeKey, index) => (
                <label
                  key={modeKey}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border/80 bg-background/30 p-3 transition hover:border-primary/40 hover:bg-muted/70"
                >
                  <input
                    name="mode"
                    type="radio"
                    defaultChecked={index === 1}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium">{t(modeKey)}</span>
                </label>
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

          <Button className="w-full" disabled={isSubmitting} type="submit">
            <Check className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "생성 중..." : t("newProject.create")}
          </Button>
          <Button
            className="w-full"
            type="button"
            variant="secondary"
            onClick={() =>
              setMessage({
                tone: "success",
                title: "소스 기반 초안이 준비되었습니다.",
                body: "업로드 화면에서 원본을 추가하면 Story Architect 단계로 이어집니다."
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
