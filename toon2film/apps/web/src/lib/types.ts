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
  progress: number;
  status: PipelineStatus;
  updatedAt: string;
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
  status: PipelineStatus;
  cost: string;
  eta: string;
};
