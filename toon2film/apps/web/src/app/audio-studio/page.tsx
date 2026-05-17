"use client";

import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

const tracks = [
  "audio.dialogue",
  "audio.narration",
  "audio.bgm",
  "audio.sfx"
] satisfies TranslationKey[];

export default function AudioStudioPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">{t("audio.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("audio.subtitle")}
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tracks.map((trackKey) => (
          <div
            key={trackKey}
            className="rounded-lg border border-border bg-surface p-5 shadow-soft"
          >
            <h2 className="font-semibold">{t(trackKey)}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("audio.clipsAssigned")}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
