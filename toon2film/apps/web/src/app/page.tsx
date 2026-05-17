"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Database,
  Film,
  Gauge,
  Plus,
  ServerCog
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("dashboard.newProject")}
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t(stat.labelKey)}
                </span>
                <Icon className={`h-5 w-5 ${stat.tone}`} aria-hidden="true" />
              </div>
              <div className="mt-4 text-3xl font-bold">{stat.value}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="rounded-lg border border-border bg-surface shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{t("dashboard.recentProjects")}</h2>
              <p className="text-sm text-muted-foreground">{t("dashboard.activeSlate")}</p>
            </div>
            <Button variant="secondary">
              <Film className="h-4 w-4" aria-hidden="true" />
              {t("nav.export")}
            </Button>
          </div>
          <div className="divide-y divide-border">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="grid gap-4 px-5 py-4 transition hover:bg-muted/60 md:grid-cols-[1fr_160px_130px_28px] md:items-center"
              >
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
                    className="h-full rounded-full bg-accent"
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

        <div className="rounded-lg border border-border bg-surface shadow-soft">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{t("dashboard.renderQueue")}</h2>
            <p className="text-sm text-muted-foreground">{t("dashboard.videoJobs")}</p>
          </div>
          <div className="divide-y divide-border">
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
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
            {t("dashboard.rightsWarning")}
          </div>
        </div>
      </section>
    </div>
  );
}
