"use client";

import { useParams } from "next/navigation";
import { Camera, FileText, ListChecks, UserRound } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projects, shots } from "@/lib/mock-data";
import type { TranslationKey } from "@/lib/i18n";

const productionDocs = [
  {
    titleKey: "project.storyBible",
    icon: FileText,
    status: "review" as const,
    valueKey: "project.storyBibleValue"
  },
  {
    titleKey: "project.characterBible",
    icon: UserRound,
    status: "processing" as const,
    valueKey: "project.characterBibleValue"
  },
  {
    titleKey: "project.sceneBreakdown",
    icon: ListChecks,
    status: "done" as const,
    valueKey: "project.sceneBreakdownValue"
  },
  {
    titleKey: "project.shotList",
    icon: Camera,
    status: "processing" as const,
    valueKey: "project.shotListValue"
  }
] satisfies Array<{
  titleKey: TranslationKey;
  icon: typeof FileText;
  status: "review" | "processing" | "done";
  valueKey: TranslationKey;
}>;

export default function ProjectPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const project = projects.find((item) => item.id === id) ?? projects[0];

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot grid gap-5 overflow-hidden p-5 lg:grid-cols-[1fr_320px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.originalTitle} / {project.type} / {project.duration}
          </p>
          <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(271_91%_65%))]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <div className="grid gap-3">
          <div className={`poster-frame poster-${project.thumbnailTone} hidden aspect-video lg:block`} />
          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary">{t("project.regenerate")}</Button>
            <Button className="flex-1">{t("project.generateVideo")}</Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.titleKey}
              className="studio-panel p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <StatusBadge status={doc.status} />
              </div>
              <h2 className="mt-4 font-semibold">{t(doc.titleKey)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(doc.valueKey)}</p>
            </div>
          );
        })}
      </section>

      <section className="studio-panel overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <h2 className="text-lg font-semibold">{t("project.shotList")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("project.shotPlanning")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/80 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t("project.scene")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.shot")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.framing")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.camera")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.action")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.length")}</th>
                <th className="px-5 py-3 font-semibold">{t("project.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {shots.map((shot) => (
                <tr key={shot.id}>
                  <td className="px-5 py-4 font-medium">{shot.scene}</td>
                  <td className="px-5 py-4">{shot.shot}</td>
                  <td className="px-5 py-4">{shot.framing}</td>
                  <td className="px-5 py-4">{shot.camera}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {shot.summary}
                  </td>
                  <td className="px-5 py-4">{shot.duration}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={shot.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
