import type { Project, QueueJob, Shot } from "@/lib/types";

export const projects: Project[] = [
  {
    id: "muyang-trailer",
    title: "Muyang",
    originalTitle: "Line 9 Shaman",
    type: "Trailer",
    duration: "60 sec",
    style: "Korean thriller",
    language: "Korean",
    aspectRatio: "16:9",
    progress: 68,
    status: "processing",
    updatedAt: "Today"
  },
  {
    id: "glass-city",
    title: "Glass City",
    originalTitle: "Neon District",
    type: "Short",
    duration: "3 min",
    style: "Near-future noir",
    language: "English",
    aspectRatio: "9:16",
    progress: 34,
    status: "review",
    updatedAt: "Yesterday"
  },
  {
    id: "red-door",
    title: "Red Door",
    originalTitle: "Door at Dawn",
    type: "Short-form",
    duration: "45 sec",
    style: "Psychological horror",
    language: "Japanese",
    aspectRatio: "1:1",
    progress: 12,
    status: "ready",
    updatedAt: "May 14"
  }
];

export const shots: Shot[] = [
  {
    id: "s01-01",
    scene: "S#01",
    shot: "01",
    framing: "EWS",
    camera: "Locked",
    summary: "Subway crosses the river under harsh daylight",
    duration: "5 sec",
    status: "done"
  },
  {
    id: "s01-02",
    scene: "S#01",
    shot: "02",
    framing: "MS",
    camera: "Slider",
    summary: "Muyang sits between commuters in a black coat",
    duration: "6 sec",
    status: "processing"
  },
  {
    id: "s01-03",
    scene: "S#01",
    shot: "03",
    framing: "CU",
    camera: "Locked",
    summary: "Phone screen glows with a shaman broadcast",
    duration: "4 sec",
    status: "review"
  },
  {
    id: "s02-01",
    scene: "S#02",
    shot: "01",
    framing: "ECU",
    camera: "Push in",
    summary: "Reflected warning trembles in Muyang's eye",
    duration: "3 sec",
    status: "ready"
  }
];

export const queueJobs: QueueJob[] = [
  {
    id: "job-431",
    provider: "Seedance",
    shot: "S#01 / 02",
    status: "processing",
    cost: "$0.42",
    eta: "2 min"
  },
  {
    id: "job-428",
    provider: "Seedance",
    shot: "S#01 / 03",
    status: "review",
    cost: "$0.31",
    eta: "Ready"
  },
  {
    id: "job-427",
    provider: "Seedance",
    shot: "S#02 / 01",
    status: "blocked",
    cost: "$0.00",
    eta: "Key needed"
  }
];
