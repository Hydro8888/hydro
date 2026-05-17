"use client";

import { Copy, Languages, RefreshCcw, WandSparkles } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{t("prompt.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("prompt.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t("prompt.translate")}
          </Button>
          <Button>
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {t("prompt.generate")}
          </Button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="cinema-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">S#01 / Shot 02</h2>
              <p className="text-sm text-muted-foreground">6 sec / 16:9</p>
            </div>
            <Button variant="ghost">
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
          <section className="cinema-card p-5">
            <h2 className="text-lg font-semibold">{t("prompt.presets")}</h2>
            <div className="mt-4 grid gap-2">
              {["Korean thriller", "Muted daylight", "Slow slider", "32mm lens"].map(
                (preset) => (
                  <button
                    key={preset}
                    className="h-10 rounded-md border border-border/80 bg-background/30 px-3 text-left text-sm font-medium transition hover:border-primary/40 hover:bg-muted/70"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </section>

          <section className="cinema-card p-5">
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

          <Button className="w-full" variant="secondary">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t("prompt.regenerate")}
          </Button>
        </aside>
      </section>
    </div>
  );
}
