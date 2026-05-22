import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "success" | "warning" | "error";

const toneStyles: Record<NoticeTone, string> = {
  info: "border-accent/35 bg-accent/10 text-accent",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
  error: "border-warning/45 bg-warning/10 text-warning"
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle
};

export function Notice({
  tone = "info",
  title,
  children,
  className
}: {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icons[tone];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        toneStyles[tone],
        className
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <div className="font-bold text-foreground">{title}</div>
          {children ? <div className="mt-1 leading-5 text-muted-foreground">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
