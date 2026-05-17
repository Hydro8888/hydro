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
      <div>
        <h1 className="text-3xl font-bold tracking-normal">{t("export.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("export.subtitle")}
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {exportTypes.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.labelKey}
              className="cinema-card p-5"
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
