import type {
  FeaturedStill,
  OpsAlert,
  PipelineStep,
  Project,
  QueueJob,
  QuickLink,
  Shot,
  TodayTask
} from "@/lib/types";

export const projects: Project[] = [
  {
    id: "muyang-trailer",
    title: "어느 날의 히어로",
    originalTitle: "Line 9 Shaman",
    type: "Trailer",
    duration: "60 sec",
    style: "Korean thriller",
    language: "Korean",
    aspectRatio: "16:9",
    episodeCount: "12 cuts",
    progress: 72,
    status: "processing",
    updatedAt: "2 hours ago",
    thumbnailTone: "sunset",
    thumbnailImage: "/studio-assets/cinema-city-boy.png",
    crew: ["HY", "MJ", "+2"],
    badge: "렌더링 중"
  },
  {
    id: "glass-city",
    title: "기억을 걷는 시간",
    originalTitle: "Neon District",
    type: "Short",
    duration: "3 min",
    style: "Near-future noir",
    language: "English",
    aspectRatio: "9:16",
    episodeCount: "18 cuts",
    progress: 41,
    status: "review",
    updatedAt: "5 hours ago",
    thumbnailTone: "blonde",
    thumbnailImage: "/studio-assets/cinema-blonde-portrait.png",
    crew: ["JM", "AK"],
    badge: "진행 중"
  },
  {
    id: "red-door",
    title: "달빛 아래의 약속",
    originalTitle: "Door at Dawn",
    type: "Short-form",
    duration: "45 sec",
    style: "Psychological horror",
    language: "Japanese",
    aspectRatio: "1:1",
    episodeCount: "32 cuts",
    progress: 15,
    status: "ready",
    updatedAt: "1 day ago",
    thumbnailTone: "night",
    thumbnailImage: "/studio-assets/cinema-moon-village.png",
    crew: ["SA", "NO", "+1"],
    badge: "대기 중"
  },
  {
    id: "summer-end",
    title: "푸른 여름의 끝",
    originalTitle: "Blue Summer",
    type: "Pilot",
    duration: "5 min",
    style: "Live-action cinema",
    language: "Chinese",
    aspectRatio: "16:9",
    episodeCount: "20 cuts",
    progress: 100,
    status: "done",
    updatedAt: "2 days ago",
    thumbnailTone: "sky",
    thumbnailImage: "/studio-assets/cinema-sky-duo.png",
    crew: ["JM"],
    badge: "완료"
  }
];

export const featuredStills: FeaturedStill[] = [
  {
    id: "manga-to-cinema",
    title: "만화 원고에서 시네마 프레임으로",
    caption: "원작 페이지와 필름 프레임을 한 컷에 겹친 메인 비주얼",
    image: "/studio-assets/cinema-manga-hero.png",
    size: "wide"
  },
  {
    id: "sunset-city",
    title: "석양의 히어로",
    caption: "도시 스카이라인과 주인공의 고독한 실루엣",
    image: "/studio-assets/cinema-city-boy.png",
    size: "standard"
  },
  {
    id: "night-character",
    title: "야간 캐릭터 클로즈업",
    caption: "감정선을 강조하는 시네마틱 포트레이트",
    image: "/studio-assets/cinema-girl-night.png",
    size: "portrait"
  },
  {
    id: "blue-sky",
    title: "푸른 하늘의 대면",
    caption: "청춘 드라마 씬의 와이드 컷",
    image: "/studio-assets/cinema-sky-duo.png",
    size: "wide"
  },
  {
    id: "golden-character",
    title: "골든 아워 캐릭터",
    caption: "빛과 헤어 디테일을 살린 캐릭터 기준 컷",
    image: "/studio-assets/cinema-blonde-portrait.png",
    size: "portrait"
  },
  {
    id: "moon-village",
    title: "달빛 아래 한옥 마을",
    caption: "판타지와 미스터리 장면을 위한 야간 배경",
    image: "/studio-assets/cinema-moon-village.png",
    size: "standard"
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

export const pipelineSteps: PipelineStep[] = [
  {
    id: "upload",
    titleKey: "studio.pipeline.upload",
    subtitleKey: "studio.pipeline.uploadSubtitle",
    status: "processing",
    count: "2"
  },
  {
    id: "story",
    titleKey: "studio.pipeline.story",
    subtitleKey: "studio.pipeline.storySubtitle",
    status: "review"
  },
  {
    id: "character",
    titleKey: "studio.pipeline.character",
    subtitleKey: "studio.pipeline.characterSubtitle",
    status: "review",
    count: "2"
  },
  {
    id: "shots",
    titleKey: "studio.pipeline.shots",
    subtitleKey: "studio.pipeline.shotsSubtitle",
    status: "processing"
  },
  {
    id: "render",
    titleKey: "studio.pipeline.render",
    subtitleKey: "studio.pipeline.renderSubtitle",
    status: "blocked",
    count: "3"
  },
  {
    id: "export",
    titleKey: "studio.pipeline.export",
    subtitleKey: "studio.pipeline.exportSubtitle",
    status: "done"
  }
];

export const queueJobs: QueueJob[] = [
  {
    id: "job-431",
    provider: "Seedance",
    shot: "S#01 / 02",
    title: "어느 날의 히어로 - 12컷",
    spec: "720p / 24fps",
    status: "processing",
    cost: "$0.42",
    eta: "00:08:45",
    progress: 65,
    thumbnailTone: "sunset",
    thumbnailImage: "/studio-assets/cinema-city-boy.png"
  },
  {
    id: "job-428",
    provider: "Seedance",
    shot: "S#01 / 03",
    title: "어느 날의 히어로 - 13컷",
    spec: "720p / 24fps",
    status: "processing",
    cost: "$0.31",
    eta: "00:05:12",
    progress: 32,
    thumbnailTone: "blonde",
    thumbnailImage: "/studio-assets/cinema-girl-night.png"
  },
  {
    id: "job-427",
    provider: "Seedance",
    shot: "S#02 / 01",
    title: "기억을 걷는 시간 - 7컷",
    spec: "1080p / 24fps",
    status: "ready",
    cost: "$0.00",
    eta: "waiting",
    progress: 0,
    thumbnailTone: "sky",
    thumbnailImage: "/studio-assets/cinema-moon-village.png",
    queueOrder: "3"
  }
];

export const todayTasks: TodayTask[] = [
  {
    id: "story",
    titleKey: "studio.taskStoryDone",
    done: 3,
    total: 3,
    status: "done"
  },
  {
    id: "prompt",
    titleKey: "studio.taskPrompt",
    done: 8,
    total: 12,
    status: "processing"
  },
  {
    id: "render",
    titleKey: "studio.taskRender",
    done: 2,
    total: 5,
    status: "review"
  },
  {
    id: "review",
    titleKey: "studio.taskReview",
    done: 1,
    total: 4,
    status: "ready"
  }
];

export const opsAlerts: OpsAlert[] = [
  {
    id: "nginx",
    titleKey: "studio.alertNginx",
    descriptionKey: "studio.alertNginxDesc",
    time: "09:54",
    status: "done"
  },
  {
    id: "server",
    titleKey: "studio.alertServer",
    descriptionKey: "studio.alertServerDesc",
    time: "09:54",
    status: "processing"
  },
  {
    id: "backup",
    titleKey: "studio.alertBackup",
    descriptionKey: "studio.alertBackupDesc",
    time: "03:20",
    status: "review"
  }
];

export const quickLinks: QuickLink[] = [
  {
    id: "keys",
    titleKey: "studio.quickApiKeys",
    href: "/settings"
  },
  {
    id: "guide",
    titleKey: "studio.quickGuide",
    href: "/prompt-studio"
  },
  {
    id: "models",
    titleKey: "studio.quickModel",
    href: "/settings"
  },
  {
    id: "support",
    titleKey: "studio.quickContact",
    href: "/export"
  }
];
