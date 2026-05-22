"use client";

import { useState } from "react";
import { Copy, Languages, RefreshCcw, WandSparkles } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { TranslationKey } from "@/lib/i18n";

const promptSections = [
  ["prompt.subject", "A pale Korean man in his early 30s, tired eyes, black coat"],
  ["prompt.action", "Sits silently between commuters while watching a shaman broadcast"],
  ["prompt.location", "Interior of Seoul subway line 9 during daytime"],
  ["prompt.camera", "Medium shot, slow left-to-right slider movement, 32mm lens"],
  ["prompt.lighting", "Cold fluorescent subway light, muted reflections"],
  ["prompt.style", "Realistic Korean psychological thriller, subtle film grain"],
  ["prompt.negative", "Avoid cartoon style, distorted face, extra fingers, unreadable text"]
] satisfies Array<[TranslationKey, string]>;

export default function PromptStudioPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  const promptText = promptSections.map(([labelKey, value]) => `${t(labelKey)}: ${value}`).join("\n");

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setMessage({
        tone: "success",
        title: "프롬프트를 복사했습니다.",
        body: "Seedance 또는 다른 영상 생성 provider에 붙여 넣을 수 있습니다."
      });
    } catch {
      setMessage({
        tone: "error",
        title: "클립보드 복사에 실패했습니다.",
        body: "브라우저 권한을 확인하거나 프롬프트 본문을 직접 선택해 복사해주세요."
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex h-8 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
            Prompt Room
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("prompt.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("prompt.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setMessage({
                tone: "success",
                title: "영문 프롬프트 형식입니다.",
                body: "현재 프롬프트는 영상 생성 provider가 읽기 쉬운 영어 구조로 정리되어 있습니다."
              })
            }
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t("prompt.translate")}
          </Button>
          <Button
            type="button"
            onClick={() =>
              setMessage({
                tone: "warning",
                title: "먼저 샷을 선택해주세요.",
                body: "실제 생성은 프로젝트 상세의 샷 리스트에서 특정 shot_id를 선택한 뒤 실행됩니다."
              })
            }
          >
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {t("prompt.generate")}
          </Button>
        </div>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="studio-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">S#01 / Shot 02</h2>
              <p className="text-sm text-muted-foreground">6 sec / 16:9</p>
            </div>
            <Button type="button" variant="ghost" onClick={copyPrompt}>
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="divide-y divide-border/80">
            {promptSections.map(([labelKey, value]) => (
              <div key={labelKey} className="grid gap-2 px-5 py-4 md:grid-cols-[120px_1fr]">
                <div className="text-sm font-semibold">{t(labelKey)}</div>
                <div className="text-sm leading-6 text-muted-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">{t("prompt.presets")}</h2>
            <div className="mt-4 grid gap-2">
              {["Korean thriller", "Muted daylight", "Slow slider", "32mm lens"].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setMessage({
                        tone: "success",
                        title: "프리셋을 적용했습니다.",
                        body: `${preset} 톤이 현재 샷 프롬프트에 반영될 준비가 되었습니다.`
                      })
                    }
                    className="h-10 rounded-md border border-border/80 bg-background/30 px-3 text-left text-sm font-medium transition hover:border-primary/40 hover:bg-muted/70"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </section>

          <section className="studio-panel p-5">
            <h2 className="text-lg font-semibold">{t("prompt.providerFormat")}</h2>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("prompt.provider")}</span>
                <span className="font-medium text-foreground">Seedance</span>
              </div>
              <div className="flex justify-between">
                <span>{t("prompt.model")}</span>
                <span className="font-medium text-foreground">{t("prompt.modelConfigured")}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("prompt.input")}</span>
                <span className="font-medium text-foreground">Text/Image</span>
              </div>
            </div>
          </section>

          <Button
            className="w-full"
            type="button"
            variant="secondary"
            onClick={() =>
              setMessage({
                tone: "warning",
                title: "샷 ID 연결이 필요합니다.",
                body: "실제 재생성은 백엔드의 /api/shots/{shot_id}/generate-prompt API와 연결된 샷에서 실행됩니다."
              })
            }
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t("prompt.regenerate")}
          </Button>
        </aside>
      </section>
    </div>
  );
}
