"use client";

import { KeyRound, Server, WalletCards } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("settings.apiKeys")}
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label={t("settings.seedanceKey")}>
              <TextInput type="password" placeholder={t("settings.storedEncrypted")} />
            </Field>
            <Field label={t("settings.llmKey")}>
              <TextInput type="password" placeholder={t("settings.storedEncrypted")} />
            </Field>
            <Button>{t("settings.saveKeys")}</Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <WalletCards className="h-5 w-5 text-accent" aria-hidden="true" />
            {t("settings.billing")}
          </h2>
          <div className="mt-4 text-3xl font-bold">$184.20</div>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.currentMonth")}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Server className="h-5 w-5 text-success" aria-hidden="true" />
            {t("settings.storage")}
          </h2>
          <div className="mt-4 text-3xl font-bold">42 GB</div>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.projectMedia")}</p>
        </div>
      </section>
    </div>
  );
}
