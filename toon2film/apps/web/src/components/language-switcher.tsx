"use client";

import { Globe2 } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { languages, type LanguageCode } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Globe2 className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="h-9 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
