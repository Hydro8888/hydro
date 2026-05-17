import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--warning)))] text-primary-foreground shadow-[0_10px_28px_rgb(245_158_11/0.24)] hover:brightness-110",
        variant === "secondary" &&
          "border border-border/80 bg-surface/80 text-foreground hover:border-primary/40 hover:bg-muted/80",
        variant === "ghost" && "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
