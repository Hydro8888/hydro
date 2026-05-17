"use client";

import type { PipelineStatus } from "@/lib/types";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";

const statusStyles: Record<PipelineStatus, string> = {
  ready: "border-border bg-muted text-muted-foreground",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700"
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
