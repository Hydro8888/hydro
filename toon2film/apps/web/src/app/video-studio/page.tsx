"use client";

import { useState } from "react";
import { CircleStop, Play, RefreshCcw } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { queueJobs } from "@/lib/mock-data";

export default function VideoStudioPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex h-8 items-center rounded-md border border-warning/35 bg-warning/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-warning">
            Render Room
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("video.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("video.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            setMessage({
              tone: "warning",
              title: "샷 프롬프트 연결이 필요합니다.",
              body: "실제 일괄 생성은 백엔드에 저장된 prompt_id가 있어야 안전하게 큐에 등록됩니다."
            })
          }
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {t("video.generateBatch")}
        </Button>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      <section className="studio-panel overflow-hidden">
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
                      <Button
                        className="h-8 px-3"
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setMessage({
                            tone: "success",
                            title: "재시도 요청을 확인했습니다.",
                            body: `${job.id} 작업은 실제 API 연결 시 /api/video-jobs/{job_id}/retry로 전송됩니다.`
                          })
                        }
                      >
                        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        className="h-8 px-3"
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setMessage({
                            tone: "warning",
                            title: "취소 요청을 확인했습니다.",
                            body: `${job.id} 작업은 실제 API 연결 시 /api/video-jobs/{job_id}/cancel로 전송됩니다.`
                          })
                        }
                      >
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
            className="studio-panel overflow-hidden"
          >
            <div className="poster-frame poster-sunset relative aspect-video">
              <div className="film-perforation absolute inset-x-3 top-3 h-6 rounded border border-border/40 bg-background/30" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{t("video.take")} {take}</h3>
                <p className="text-sm text-muted-foreground">S#01 / Shot 02</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setMessage({
                    tone: "success",
                    title: `${t("video.take")} ${take} 선택됨`,
                    body: "선택된 테이크가 최종 타임라인 후보로 표시되었습니다."
                  })
                }
              >
                {t("video.select")}
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
