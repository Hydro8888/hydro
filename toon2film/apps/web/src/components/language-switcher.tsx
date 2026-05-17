"use client";

import { useI18n } from "@/components/language-provider";
import { languages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      aria-label={t("language.label")}
      className="grid h-10 grid-cols-4 overflow-hidden rounded-md border border-border/80 bg-background/45 p-1 shadow-soft"
      role="group"
    >
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          aria-pressed={language === item.code}
          onClick={() => setLanguage(item.code)}
          className={cn(
            "min-w-11 rounded px-3 text-xs font-bold text-muted-foreground transition hover:text-foreground",
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
