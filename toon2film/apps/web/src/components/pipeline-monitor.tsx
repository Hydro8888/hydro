"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import type { PipelineStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MonitorStep = {
  id: string;
  title: string;
  subtitle?: string;
  status: PipelineStatus;
  count?: number | string;
  detail?: string;
};

type PipelineMonitorProps = {
  title?: string;
  subtitle?: string;
  steps: MonitorStep[];
  progress?: number;
  currentLabel?: string;
  compact?: boolean;
  isLoading?: boolean;
  className?: string;
};

const stepTone: Record<PipelineStatus, string> = {
  ready: "border-border/80 bg-background/35 text-muted-foreground",
  processing: "border-accent/45 bg-accent/10 text-accent shadow-[0_0_22px_rgb(59_130_246/.12)]",
  review: "border-primary/45 bg-primary/10 text-primary shadow-[0_0_22px_rgb(249_115_22/.13)]",
  blocked: "border-warning/45 bg-warning/10 text-warning",
  done: "border-success/45 bg-success/10 text-success"
};

const stepIcon = {
  ready: Circle,
  processing: Loader2,
  review: Sparkles,
  blocked: AlertTriangle,
  done: CheckCircle2
} satisfies Record<PipelineStatus, LucideIcon>;

const statusWeight: Record<PipelineStatus, number> = {
  ready: 0,
  processing: 0.45,
  review: 0.65,
  blocked: 0.5,
  done: 1
};

function computeProgress(steps: MonitorStep[]) {
  if (steps.length === 0) return 0;
  const total = steps.reduce((sum, step) => sum + statusWeight[step.status], 0);
  return Math.round((total / steps.length) * 100);
}

function pickCurrentStep(steps: MonitorStep[]) {
  return (
    steps.find((step) => ["processing", "review", "blocked"].includes(step.status)) ??
    steps.find((step) => step.status !== "done") ??
    steps.at(-1)
  );
}

export function PipelineMonitor({
  title = "진행 모니터",
  subtitle = "원본 업로드부터 출력까지 전체 제작 흐름",
  steps,
  progress,
  currentLabel,
  compact = false,
  isLoading = false,
  className
}: PipelineMonitorProps) {
  const safeProgress = Math.max(0, Math.min(100, progress ?? computeProgress(steps)));
  const currentStep = pickCurrentStep(steps);
  const doneCount = steps.filter((step) => step.status === "done").length;
  const activeCount = steps.filter((step) => ["processing", "review", "blocked"].includes(step.status)).length;

  return (
    <section className={cn("studio-panel overflow-hidden p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Live Pipeline
          </div>
          <h2 className="mt-3 text-xl font-black tracking-tight">{title}</h2>
          <p className="mt-1 max-w-2xl break-keep text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid min-w-[210px] gap-2 rounded-lg border border-border/80 bg-background/35 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground">전체 진행률</span>
            <span className="text-2xl font-black text-foreground">{safeProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)),hsl(var(--success)))] transition-all duration-500"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{doneCount}/{steps.length} 완료</span>
            <span className="text-border">/</span>
            <span>{activeCount}개 진행 중</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-border/80 bg-background/25 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">현재 단계</p>
          <p className="mt-1 truncate text-sm font-black text-foreground">
            {currentLabel ?? currentStep?.title ?? "대기 중"}
          </p>
        </div>
        {currentStep ? <StatusBadge status={currentStep.status} /> : null}
      </div>

      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        )}
      >
        {steps.map((step, index) => {
          const Icon = stepIcon[step.status];
          return (
            <article
              key={step.id}
              className={cn(
                "relative rounded-lg border p-3 transition",
                stepTone[step.status],
                !compact && index < steps.length - 1 && "film-arrow"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-current/25 bg-background/35">
                  {step.status === "processing" ? (
                    <Icon className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <span className="rounded-full border border-current/25 bg-background/35 px-2 py-0.5 text-[11px] font-black">
                  {step.count ?? String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3 break-keep text-sm font-black text-foreground">{step.title}</h3>
              {step.subtitle ? (
                <p className="mt-1 break-keep text-xs leading-5 text-muted-foreground">{step.subtitle}</p>
              ) : null}
              {step.detail ? (
                <p className="mt-3 rounded-md border border-current/15 bg-background/25 px-2 py-1 text-[11px] leading-5">
                  {step.detail}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
