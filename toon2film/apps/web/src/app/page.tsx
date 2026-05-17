"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clapperboard,
  Clock3,
  Database,
  Film,
  Gauge,
  Plus,
  ServerCog,
  WandSparkles
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";
import { projects, queueJobs } from "@/lib/mock-data";
import type { TranslationKey } from "@/lib/i18n";

const stats = [
  { labelKey: "dashboard.stats.projects", value: "12", icon: Database, tone: "text-primary" },
  { labelKey: "dashboard.stats.processing", value: "3", icon: ServerCog, tone: "text-accent" },
  { labelKey: "dashboard.stats.apiCost", value: "$184", icon: Gauge, tone: "text-warning" },
  { labelKey: "dashboard.stats.renderQueue", value: "7", icon: Clock3, tone: "text-success" }
] satisfies Array<{
  labelKey: TranslationKey;
  value: string;
  icon: typeof Database;
  tone: string;
}>;

export default function DashboardPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="cinema-card-highlight min-w-0 overflow-hidden w-full">
        <div className="grid min-w-0 gap-6 p-5 md:p-7 xl:grid-cols-[1fr_430px] xl:items-center">
          <div className="min-w-0">
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Clapperboard className="h-4 w-4" aria-hidden="true" />
              Toon2Film Studio
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-normal text-foreground md:text-5xl">
              {t("dashboard.title")}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {t("dashboard.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/projects/new"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--warning)))] px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_rgb(245_158_11/0.24)] transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("dashboard.newProject")}
              </Link>
              <Button variant="secondary">
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
                {t("prompt.generate")}
              </Button>
            </div>
          </div>

          <div className="relative min-h-[280px] min-w-0 overflow-hidden rounded-lg border border-border/80 bg-background/50 p-3">
            <div className="film-perforation absolute inset-x-3 top-3 h-7 rounded-md border border-border/40 bg-muted/30 opacity-80" />
            <div className="mt-10 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="min-w-0 space-y-3">
                {["S#01", "S#02", "S#03"].map((scene, index) => (
                  <div
                    key={scene}
                    className="comic-paper min-h-20 min-w-0 rounded-md border border-primary/20 p-3 shadow-soft"
                  >
                    <div className="flex items-center justify-between text-xs font-black text-background">
                      <span className="rounded bg-foreground px-2 py-1">{scene}</span>
                      <span>{index === 0 ? "CU" : index === 1 ? "MS" : "EWS"}</span>
                    </div>
                    <div className="mt-3 h-2 w-3/4 rounded bg-background/50" />
                    <div className="mt-2 h-2 w-1/2 rounded bg-background/30" />
                  </div>
                ))}
              </div>
              <div className="relative min-w-0 overflow-hidden rounded-md border border-accent/30 bg-background">
                <div className="cinema-screen aspect-[4/5]" />
                <div className="absolute inset-x-0 bottom-0 border-t border-border/80 bg-background/80 p-4 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Cinematic Take</div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>S#01 / Shot 02</span>
                    <span className="font-semibold text-primary">16:9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="cinema-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t(stat.labelKey)}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border/80 bg-background/40">
                  <Icon className={`h-5 w-5 ${stat.tone}`} aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold">{stat.value}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="cinema-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{t("dashboard.recentProjects")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.activeSlate")}</p>
            </div>
            <Button variant="secondary">
              <Film className="h-4 w-4" aria-hidden="true" />
              {t("nav.export")}
            </Button>
          </div>
          <div className="divide-y divide-border/80">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="grid gap-4 px-5 py-4 transition hover:bg-muted/50 md:grid-cols-[56px_1fr_160px_130px_28px] md:items-center"
              >
                <div className="cinema-screen h-14 rounded-md border border-border/80" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {project.type} / {project.duration} / {project.style}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--primary)))]"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {project.progress}% / {project.updatedAt}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="cinema-card overflow-hidden">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="text-lg font-semibold">{t("dashboard.renderQueue")}</h2>
            <p className="text-sm text-muted-foreground">{t("dashboard.videoJobs")}</p>
          </div>
          <div className="divide-y divide-border/80">
            {queueJobs.map((job) => (
              <div key={job.id} className="grid gap-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{job.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.provider} / {job.shot}
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{job.cost}</span>
                  <span>{job.eta}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-accent" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border/80 px-5 py-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
            {t("dashboard.rightsWarning")}
          </div>
        </div>
      </section>
    </div>
  );
}
