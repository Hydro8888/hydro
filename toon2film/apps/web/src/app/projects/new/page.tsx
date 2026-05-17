"use client";

import { Check, ShieldCheck, WandSparkles } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import type { TranslationKey } from "@/lib/i18n";

const modes = [
  "newProject.mode.quick",
  "newProject.mode.expert",
  "newProject.mode.director"
] satisfies TranslationKey[];

const productionTypes = [
  ["Trailer", "option.trailer"],
  ["Short", "option.short"],
  ["Feature sequence", "option.featureSequence"],
  ["Short-form", "option.shortForm"]
] satisfies Array<[string, TranslationKey]>;

const styles = [
  ["Korean thriller", "option.koreanThriller"],
  ["Live-action cinema", "option.liveActionCinema"],
  ["Noir", "option.noir"],
  ["Horror", "option.horror"],
  ["Fantasy", "option.fantasy"],
  ["Sci-fi", "option.sciFi"]
] satisfies Array<[string, TranslationKey]>;

const projectLanguages = [
  ["Korean", "option.korean"],
  ["English", "option.english"],
  ["Japanese", "option.japanese"],
  ["Chinese", "option.chinese"]
] satisfies Array<[string, TranslationKey]>;

export default function NewProjectPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">{t("newProject.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("newProject.subtitle")}
        </p>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="cinema-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("newProject.projectName")}>
              <TextInput placeholder="Muyang" />
            </Field>
            <Field label={t("newProject.originalTitle")}>
              <TextInput placeholder="Line 9 Shaman" />
            </Field>
            <Field label={t("newProject.productionType")}>
              <SelectInput defaultValue="Trailer">
                {productionTypes.map(([value, labelKey]) => (
                  <option key={value} value={value}>
                    {t(labelKey)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t("newProject.targetLength")}>
              <SelectInput defaultValue="60 sec">
                <option>30 sec</option>
                <option>60 sec</option>
                <option>3 min</option>
                <option>5 min</option>
                <option>10 min</option>
              </SelectInput>
            </Field>
            <Field label={t("newProject.style")}>
              <SelectInput defaultValue="Korean thriller">
                {styles.map(([value, labelKey]) => (
                  <option key={value} value={value}>
                    {t(labelKey)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t("newProject.language")}>
              <SelectInput defaultValue="Korean">
                {projectLanguages.map(([value, labelKey]) => (
                  <option key={value} value={value}>
                    {t(labelKey)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t("newProject.aspectRatio")}>
              <SelectInput defaultValue="16:9">
                <option>16:9</option>
                <option>9:16</option>
                <option>1:1</option>
              </SelectInput>
            </Field>
            <Field label={t("newProject.ratingGuardrail")}>
              <SelectInput defaultValue="15+">
                <option value="All ages">{t("option.allAges")}</option>
                <option>12+</option>
                <option>15+</option>
                <option value="No adult content">{t("option.noAdultContent")}</option>
              </SelectInput>
            </Field>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="cinema-card-highlight overflow-hidden p-5">
            <div className="cinema-screen mb-5 aspect-video rounded-md border border-border/80" />
            <h2 className="text-lg font-semibold">{t("newProject.mode")}</h2>
            <div className="mt-4 grid gap-2">
              {modes.map((modeKey, index) => (
                <label
                  key={modeKey}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border/80 bg-background/30 p-3 transition hover:border-primary/40 hover:bg-muted/70"
                >
                  <input
                    name="mode"
                    type="radio"
                    defaultChecked={index === 1}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-medium">{t(modeKey)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="cinema-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
              {t("newProject.rights")}
            </h2>
            <div className="mt-4 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.source")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.likeness")}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{t("newProject.rights.commercial")}</span>
              </label>
            </div>
          </section>

          <Button className="w-full">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("newProject.create")}
          </Button>
          <Button className="w-full" variant="secondary">
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {t("newProject.draft")}
          </Button>
        </aside>
      </form>
    </div>
  );
}
