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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-normal">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.originalTitle} / {project.type} / {project.duration}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t("project.regenerate")}</Button>
          <Button>{t("project.generateVideo")}</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.titleKey}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
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

      <section className="rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{t("project.shotList")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("project.shotPlanning")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
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
            <tbody className="divide-y divide-border">
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
