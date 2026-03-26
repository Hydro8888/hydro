// Phase 1: 핵심 API 응답/요청 타입 정의

export interface ServiceCreateInput {
  name: string
  url?: string
  appUrl?: string
  type: string
  description: string
  logoUrl?: string
}

export interface GoalCreateInput {
  serviceId: string
  type: string
  description: string
}

export interface ChannelRecommendation {
  channelId: string
  channelName: string
  displayName: string
  category: string
  score: number
  reasons: string[]
  readyNow: boolean
  missingItems: string[]
  automationGrade: string
  riskLevel: string
}

export interface ServiceAnalysis {
  isLocal: boolean
  isApp: boolean
  isB2B: boolean
  requiredChannels: string[]
  missingAssets: string[]
}

export interface SubGoal {
  id: string
  description: string
  category: string
}

export interface TaskGenerateResult {
  taskId: string
  title: string
  type: string
  automationGrade: string
  initialStatus: string
}

export interface DashboardStats {
  todayAutomated: number
  pendingApprovals: number
  failedTasks: number
  userActionNeeded: number
  connectedChannels: number
  totalTasks: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Phase 7: 파이프라인 모니터링 타입
export interface PipelineStage {
  stage: number
  title: string
  icon: string
  health: 'healthy' | 'warning' | 'critical'
  primaryMetric: number
  primaryLabel: string
  details: Record<string, number>
  actionUrl: string
}

export interface PipelineActivity {
  id: string
  timestamp: string
  entityType: string
  action: string
  description: string
}

export interface PipelineStatus {
  stages: PipelineStage[]
  bottleneck: { stage: number; title: string; reason: string } | null
  recentActivity: PipelineActivity[]
  summary: {
    totalChannels: number
    totalTasks: number
    completionRate: number
    automationRate: number
  }
}
