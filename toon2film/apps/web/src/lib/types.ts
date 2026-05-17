import type { TranslationKey } from "@/lib/i18n";

export type PipelineStatus =
  | "ready"
  | "processing"
  | "review"
  | "blocked"
  | "done";

export type Project = {
  id: string;
  title: string;
  originalTitle: string;
  type: "Trailer" | "Short" | "Pilot" | "Short-form";
  duration: string;
  style: string;
  language: string;
  aspectRatio: string;
  episodeCount: string;
  progress: number;
  status: PipelineStatus;
  updatedAt: string;
  thumbnailTone: "sunset" | "blonde" | "night" | "sky";
  thumbnailImage: string;
  crew: string[];
  badge: string;
};

export type Shot = {
  id: string;
  scene: string;
  shot: string;
  framing: string;
  camera: string;
  summary: string;
  duration: string;
  status: PipelineStatus;
};

export type QueueJob = {
  id: string;
  provider: string;
  shot: string;
  title: string;
  spec: string;
  status: PipelineStatus;
  cost: string;
  eta: string;
  progress: number;
  thumbnailTone: "sunset" | "blonde" | "night" | "sky";
  thumbnailImage: string;
  queueOrder?: string;
};

export type PipelineStep = {
  id: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  status: PipelineStatus;
  count?: string;
};

export type TodayTask = {
  id: string;
  titleKey: TranslationKey;
  done: number;
  total: number;
  status: PipelineStatus;
};

export type OpsAlert = {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  time: string;
  status: PipelineStatus;
};

export type QuickLink = {
  id: string;
  titleKey: TranslationKey;
  href: string;
};
