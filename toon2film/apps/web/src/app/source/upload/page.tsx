"use client";

import { FileArchive, FileImage, FileText, UploadCloud } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

const fileTypes = [
  { label: "PDF", icon: FileText },
  { label: "JPG / PNG", icon: FileImage },
  { label: "ZIP", icon: FileArchive }
];

export default function SourceUploadPage() {
  const { t } = useI18n();

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

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="studio-panel-hot relative overflow-hidden border-dashed p-8 text-center">
          <div className="comic-paper absolute inset-x-8 top-8 h-28 rounded-md border border-primary/20 opacity-30" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
            <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="relative mt-5 text-xl font-semibold">{t("source.dropFiles")}</h2>
          <p className="relative mt-2 text-sm text-muted-foreground">
            {t("source.supported")}
          </p>
          <Button className="relative mt-6">{t("source.chooseFiles")}</Button>
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
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.source")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.likeness")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("source.rights.commercial")}</span>
              </label>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
