"use client";

import { CircleStop, Play, RefreshCcw } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queueJobs } from "@/lib/mock-data";

export default function VideoStudioPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{t("video.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("video.subtitle")}
          </p>
        </div>
        <Button>
          <Play className="h-4 w-4" aria-hidden="true" />
          {t("video.generateBatch")}
        </Button>
      </div>

      <section className="cinema-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4">
          <h2 className="text-lg font-semibold">{t("video.jobs")}</h2>
          <p className="text-sm text-muted-foreground">{t("video.providerTaskStatus")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-muted/80 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t("video.job")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.provider")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.shot")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.cost")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.eta")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.status")}</th>
                <th className="px-5 py-3 font-semibold">{t("video.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {queueJobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-4 font-semibold">{job.id}</td>
                  <td className="px-5 py-4">{job.provider}</td>
                  <td className="px-5 py-4">{job.shot}</td>
                  <td className="px-5 py-4">{job.cost}</td>
                  <td className="px-5 py-4">{job.eta}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button className="h-8 px-3" variant="secondary">
                        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button className="h-8 px-3" variant="ghost">
                        <CircleStop className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((take) => (
          <div
            key={take}
            className="cinema-card overflow-hidden"
          >
            <div className="cinema-screen relative aspect-video">
              <div className="film-perforation absolute inset-x-3 top-3 h-6 rounded border border-border/40 bg-background/30" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{t("video.take")} {take}</h3>
                <p className="text-sm text-muted-foreground">S#01 / Shot 02</p>
              </div>
              <Button variant="secondary">{t("video.select")}</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
