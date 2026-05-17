"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Clapperboard,
  Clock3,
  Film,
  Grid2X2,
  KeyRound,
  LayoutList,
  LockKeyhole,
  MessageSquare,
  MonitorPlay,
  PlayCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/components/language-provider";
import {
  opsAlerts,
  pipelineSteps,
  projects,
  queueJobs,
  quickLinks,
  todayTasks
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { PipelineStatus } from "@/lib/types";

const pipelineIcons = [UploadCloud, Bot, BookOpen, Clapperboard, MonitorPlay, Film];
const quickIcons = [KeyRound, BookOpen, Sparkles, MessageSquare];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/toon2film";

const statusTone: Record<PipelineStatus, string> = {
  ready: "border-border/80 bg-muted/70 text-muted-foreground",
  processing: "border-accent/40 bg-accent/10 text-accent",
  review: "border-primary/40 bg-primary/10 text-primary",
  blocked: "border-warning/40 bg-warning/10 text-warning",
  done: "border-success/40 bg-success/10 text-success"
};

function assetPath(path: string) {
  return `${basePath}${path}`;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        {t("studio.boardTitle")}
      </h1>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_348px]">
        <main className="min-w-0 space-y-5">
          <section className="studio-panel-hot hero-reel relative min-h-[280px] overflow-hidden p-5 sm:p-7">
            <div className="absolute inset-y-0 right-0 hidden w-[66%] md:block">
              <div className="hero-image-wrap absolute inset-4 left-0 overflow-hidden rounded-xl border border-primary/25 bg-background/30 shadow-glow">
                <img
                  src={assetPath("/studio-assets/manga-cinema-hero.svg")}
                  alt=""
                  className="h-full w-full object-cover"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/.76)_27%,transparent_62%)]" />
              </div>
            </div>

            <div className="relative z-10 max-w-xl">
              <div className="inline-flex h-8 items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <Clapperboard className="h-4 w-4" aria-hidden="true" />
                Toon2Film Studio
              </div>
              <h2 className="mt-7 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {t("studio.heroTitleLead")}{" "}
                <span className="whitespace-nowrap text-primary">{t("studio.heroTitleAccent")}</span>
                <Sparkles className="mb-6 ml-2 inline h-6 w-6 text-primary" aria-hidden="true" />
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-foreground/82">
                {t("studio.heroSubtitle")}
              </p>
              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                <Link href="/projects/new" className="neon-button h-11 w-full px-5 sm:w-auto">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  {t("dashboard.newProject")}
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-full sm:w-auto"
                  onClick={() =>
                    setMessage({
                      tone: "success",
                      title: "튜토리얼 흐름",
                      body: "새 프로젝트 생성, 소스 업로드, 스토리 분석, 프롬프트 생성, 영상 제작, 내보내기 순서로 진행하면 됩니다."
                    })
                  }
                >
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  {t("studio.tutorial")}
                </Button>
              </div>
            </div>
          </section>

          {message ? (
            <Notice tone={message.tone} title={message.title}>
              {message.body}
            </Notice>
          ) : null}

          <section className="studio-panel p-4 sm:p-5">
            <h2 className="text-lg font-bold">{t("studio.pipelineTitle")}</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {pipelineSteps.map((step, index) => {
                const Icon = pipelineIcons[index] ?? WandSparkles;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "relative min-h-[118px] rounded-lg border p-4",
                      statusTone[step.status],
                      index < pipelineSteps.length - 1 && "film-arrow"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-current/25 bg-background/35">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      {step.count ? <span className="text-xs font-black">{step.count}</span> : null}
                    </div>
                    <h3 className="mt-4 text-sm font-black text-foreground">{t(step.titleKey)}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(step.subtitleKey)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <h2 className="text-xl font-black">{t("studio.projectsTitle")}</h2>
                <span className="text-muted-foreground">/</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "studio.filterAll",
                    "studio.filterProgress",
                    "studio.filterRendering",
                    "studio.filterDone",
                    "studio.filterArchived"
                  ].map((key, index) => (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        "h-9 rounded-md border px-3 text-xs font-bold",
                        index === 0
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/45"
                      )}
                    >
                      {t(key as Parameters<typeof t>[0])}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="project-sort">
                  {t("studio.sortLabel")}
                </label>
                <select
                  id="project-sort"
                  className="h-10 rounded-md border border-border/80 bg-surface/80 px-3 text-sm font-semibold text-foreground outline-none"
                  defaultValue="latest"
                >
                  <option value="latest">{t("studio.sortLatest")}</option>
                </select>
                <Button className="h-10 px-3" variant="secondary">
                  <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button className="h-10 px-3" variant="ghost">
                  <LayoutList className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="studio-panel group overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-glow"
                >
                  <div className={cn("poster-frame has-image h-40", `poster-${project.thumbnailTone}`)}>
                    <img
                      src={assetPath(project.thumbnailImage)}
                      alt=""
                      className="project-poster-image"
                      aria-hidden="true"
                    />
                    <div className="absolute left-3 top-3 z-10 rounded-md border border-current/30 bg-background/70 px-2 py-1 text-xs font-black text-primary backdrop-blur">
                      {project.badge}
                    </div>
                    <div className="film-perforation absolute inset-x-3 bottom-3 z-10 h-5 rounded border border-foreground/10 opacity-50" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">{project.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.type} · {project.episodeCount}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,hsl(239_84%_67%),hsl(271_91%_65%))]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{project.progress}%</span>
                      <span>{project.updatedAt}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.crew.map((member) => (
                          <span
                            key={member}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-black text-foreground"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setMessage({
                    tone: "warning",
                    title: "프로젝트 목록 API 연결 대기",
                    body: "현재 대시보드는 샘플 제작 보드를 표시합니다. 실제 목록은 /api/projects 연결 후 자동으로 확장됩니다."
                  })
                }
              >
                {t("studio.moreProjects")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="studio-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{t("studio.renderQueue")}</h2>
              <Link href="/video-studio" className="text-xs font-bold text-primary">
                {t("studio.viewAll")}
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {queueJobs.map((job) => (
                <div key={job.id} className="grid grid-cols-[78px_1fr] gap-3">
                  <div className={cn("poster-frame has-image h-16", `poster-${job.thumbnailTone}`)}>
                    <img
                      src={assetPath(job.thumbnailImage)}
                      alt=""
                      className="project-poster-image"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{job.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{job.spec}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,hsl(239_84%_67%),hsl(213_94%_68%))]"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-bold">{job.progress}%</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {job.queueOrder
                        ? `${t("studio.queueOrder")}: ${job.queueOrder}`
                        : `${t("studio.timeLeft")}: ${job.eta}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel p-4">
            <h2 className="text-lg font-black">{t("studio.todayTasks")}</h2>
            <div className="mt-4 space-y-3">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      task.status === "done"
                        ? "border-success/50 bg-success/15 text-success"
                        : "border-accent/50 bg-accent/10 text-accent"
                    )}
                  >
                    {task.status === "done" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t(task.titleKey)}</span>
                  <span className="text-sm font-bold text-muted-foreground">
                    {task.done}/{task.total}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{t("studio.opsAlerts")}</h2>
              <Link href="/settings" className="text-xs font-bold text-primary">
                {t("studio.viewAll")}
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {opsAlerts.map((alert, index) => {
                const Icon = index === 0 ? ShieldCheck : index === 1 ? MonitorPlay : LockKeyhole;
                return (
                  <div key={alert.id} className="grid grid-cols-[34px_1fr_auto] gap-3">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-md border", statusTone[alert.status])}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{t(alert.titleKey)}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{t(alert.descriptionKey)}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="studio-panel p-4">
            <h2 className="text-lg font-black">{t("studio.quickLinks")}</h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {quickLinks.map((item, index) => {
                const Icon = quickIcons[index] ?? KeyRound;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-border/80 bg-background/35 p-2 text-center text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {t(item.titleKey)}
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
