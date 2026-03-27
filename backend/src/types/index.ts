import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  username: z.string().min(4).max(12).regex(/^[a-zA-Z0-9]+$/, '영문+숫자만 입력 가능합니다.'),
  password: z.string().min(8).regex(/[!@#$%^&*(),.?":{}|<>]/, '특수문자를 포함해야 합니다.'),
  nickname: z.string().min(2).max(20),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  preferredRegions: z.array(z.string()).optional(),
  preferredJobTypes: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Job schemas
export const jobQuerySchema = z.object({
  region: z.string().optional(),
  jobType: z.string().optional(),
  minPay: z.coerce.number().optional(),
  maxPay: z.coerce.number().optional(),
  sort: z.enum(['latest', 'pay_high', 'pay_low', 'popular']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

export const createJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  region: z.string(),
  address: z.string(),
  jobType: z.string(),
  payType: z.enum(['hourly', 'daily', 'monthly']),
  payAmount: z.number().min(0),
  workingHours: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  images: z.array(z.string()).optional(),
  isUrgent: z.boolean().optional(),
});

// Community schemas
export const createPostSchema = z.object({
  category: z.enum(['TALK', 'BUDDY', 'ANONYMOUS', 'REVIEW', 'EVENT', 'NOTICE']),
  title: z.string().min(2).max(100),
  content: z.string().min(5),
  images: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  isAnonymous: z.boolean().optional(),
});

// Profile schema
export const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  profileImage: z.string().optional(),
  preferredRegions: z.array(z.string()).optional(),
  preferredJobTypes: z.array(z.string()).optional(),
  preferredMinPay: z.number().optional(),
});

// Report schema
export const createReportSchema = z.object({
  reason: z.string().min(5),
  description: z.string().optional(),
});

// Korean regions
export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const;

// Job types
export const JOB_TYPES = [
  '룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타',
] as const;
