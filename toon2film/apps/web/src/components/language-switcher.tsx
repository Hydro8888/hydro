"use client";

import { useI18n } from "@/components/language-provider";
import { languages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      aria-label={t("language.label")}
      className="grid h-9 grid-cols-4 overflow-hidden rounded-md border border-border/80 bg-background/45 p-0.5 shadow-soft sm:h-10 sm:p-1"
      role="group"
    >
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          aria-pressed={language === item.code}
          onClick={() => setLanguage(item.code)}
          className={cn(
            "min-w-8 rounded px-2 text-xs font-bold text-muted-foreground transition hover:text-foreground sm:min-w-11 sm:px-3",
            language === item.code &&
              "bg-[linear-gradient(135deg,hsl(257_84%_59%),hsl(253_88%_66%))] text-white shadow-[0_8px_20px_rgb(124_58_237/0.28)]"
          )}
          title={item.label}
        >
          {item.shortLabel}
        </button>
      ))}
    </div>
  );
}
