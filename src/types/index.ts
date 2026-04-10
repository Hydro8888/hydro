// ─── Enum-like Types ────────────────────────────────────────────────────────

export type Role = 'USER' | 'HELPER' | 'ADMIN';

export type Category =
  | 'CLEANING'
  | 'DELIVERY'
  | 'SHOPPING'
  | 'MOVING'
  | 'REPAIR'
  | 'ERRAND'
  | 'PET'
  | 'CARE'
  | 'OTHER';

export type Status =
  | 'PENDING'
  | 'AI_REVIEWED'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export type PaymentStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED';

export type ReportType = 'FRAUD' | 'ABUSE' | 'NO_SHOW' | 'QUALITY' | 'OTHER';

export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// ─── Session ────────────────────────────────────────────────────────────────

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ─── Data Interfaces ────────────────────────────────────────────────────────

export interface RequestData {
  id: string;
  requesterId: string;
  helperId?: string | null;
  title: string;
  description: string;
  naturalInput?: string | null;
  category: Category;
  urgency: Urgency;
  status: Status;
  budget?: number | null;
  suggestedMin?: number | null;
  suggestedMax?: number | null;
  location?: string | null;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  attachments?: string | null;
  aiCategory?: string | null;
  aiConfidence?: number | null;
  riskLevel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewData {
  id: string;
  requestId: string;
  authorId: string;
  targetId: string;
  rating: number;
  punctuality?: number | null;
  accuracy?: number | null;
  kindness?: number | null;
  comment?: string | null;
  createdAt: Date;
}

export interface PaymentData {
  id: string;
  requestId: string;
  amount: number;
  platformFee: number;
  status: PaymentStatus;
  method?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportData {
  id: string;
  requestId?: string | null;
  reporterId: string;
  reportedId: string;
  type: ReportType;
  description: string;
  evidence?: string | null;
  status: ReportStatus;
  resolution?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageData {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  type: MessageType;
  createdAt: Date;
}

export interface HelperProfileData {
  id: string;
  userId: string;
  categories: string;
  bio?: string | null;
  completedCount: number;
  onTimeRate: number;
  avgRating: number;
  available: boolean;
  badges?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuccessCaseData {
  id: string;
  category: Category;
  title: string;
  summary: string;
  duration?: string | null;
  satisfaction?: number | null;
  reused: boolean;
  published: boolean;
  createdAt: Date;
}

// ─── AI Result Interfaces ───────────────────────────────────────────────────

export interface AIClassifyResult {
  category: Category;
  urgency: Urgency;
  suggestedMin: number;
  suggestedMax: number;
  missingInfo: string[];
  riskLevel: RiskLevel;
}

export interface AIModerationResult {
  allowed: boolean;
  reason?: string;
  riskLevel: RiskLevel;
}

export interface AIMatchScore {
  helperId: string;
  score: number;
  reasons: string[];
}

export interface AIMatchResult {
  matches: AIMatchScore[];
}
