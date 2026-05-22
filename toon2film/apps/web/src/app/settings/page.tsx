"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Server, WalletCards } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export default function SettingsPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const seedanceKey = String(form.get("seedanceKey") || "").trim();
    const llmKey = String(form.get("llmKey") || "").trim();

    if (!seedanceKey && !llmKey) {
      setMessage({
        tone: "warning",
        title: "저장할 키가 없습니다.",
        body: "운영 서버에서는 API 키를 브라우저가 아니라 서버 .env 또는 암호화 저장소에서 관리해야 합니다."
      });
      return;
    }

    if (seedanceKey && seedanceKey.length < 12) {
      setMessage({
        tone: "error",
        title: "Seedance 키 형식을 확인해주세요.",
        body: "입력값이 너무 짧습니다. 실제 키를 저장하지 않고 형식만 점검했습니다."
      });
      return;
    }

    setMessage({
      tone: "success",
      title: "키 형식 점검 완료",
      body: "보안을 위해 실제 키 값은 브라우저에 저장하지 않았습니다. 서버의 .env 또는 암호화 키 저장소에 반영해주세요."
    });
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div className="studio-panel-hot overflow-hidden p-5">
        <div className="inline-flex h-8 items-center rounded-md border border-success/35 bg-success/10 px-3 text-xs font-black uppercase tracking-[0.18em] text-success">
          Safe Ops
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      {message ? (
        <Notice tone={message.tone} title={message.title}>
          {message.body}
        </Notice>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <form className="studio-panel p-5" noValidate onSubmit={handleSubmit}>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("settings.apiKeys")}
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label={t("settings.seedanceKey")}>
              <TextInput name="seedanceKey" type="password" placeholder={t("settings.storedEncrypted")} autoComplete="off" />
            </Field>
            <Field label={t("settings.llmKey")}>
              <TextInput name="llmKey" type="password" placeholder={t("settings.storedEncrypted")} autoComplete="off" />
            </Field>
            <Button type="submit">{t("settings.saveKeys")}</Button>
          </div>
        </form>

        <div className="studio-panel p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <WalletCards className="h-5 w-5 text-accent" aria-hidden="true" />
            {t("settings.billing")}
          </h2>
          <div className="mt-4 text-3xl font-bold">$184.20</div>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.currentMonth")}</p>
        </div>

        <div className="studio-panel p-5">
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
