"use client";

import type { PipelineStatus } from "@/lib/types";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const statusStyles: Record<PipelineStatus, string> = {
  ready: "border-border/80 bg-muted/70 text-muted-foreground",
  processing: "border-accent/40 bg-accent/10 text-accent",
  review: "border-primary/40 bg-primary/10 text-primary",
  blocked: "border-warning/40 bg-warning/10 text-warning",
  done: "border-success/40 bg-success/10 text-success"
};

export function StatusBadge({ status }: { status: PipelineStatus }) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
