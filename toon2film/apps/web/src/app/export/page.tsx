"use client";

import { Download, FileJson, FileText, Film } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";

const exportTypes = [
  { labelKey: "export.mp4", icon: Film },
  { labelKey: "export.promptPackage", icon: FileJson },
  { labelKey: "export.scenarioPdf", icon: FileText },
  { labelKey: "export.storyboardPdf", icon: FileText }
] satisfies Array<{ labelKey: TranslationKey; icon: typeof Film }>;

export default function ExportPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot grid gap-5 overflow-hidden p-5 md:grid-cols-[1fr_280px] md:items-center">
        <div>
          <div className="inline-flex h-8 items-center rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
            Delivery
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("export.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("export.subtitle")}
          </p>
        </div>
        <div className="poster-frame poster-night hidden aspect-video md:block" />
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exportTypes.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.labelKey}
              className="studio-panel p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold">{t(item.labelKey)}</h2>
              <Button className="mt-4 w-full" variant="secondary">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("export.prepare")}
              </Button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
