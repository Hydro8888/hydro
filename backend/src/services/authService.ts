import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

export async function register(data: {
  username: string;
  password: string;
  nickname: string;
  phone?: string;
  email?: string;
  preferredRegions?: string[];
  preferredJobTypes?: string[];
}) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        ...(data.phone ? [{ phone: data.phone }] : []),
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (existing) {
    throw new AppError('이미 사용 중인 아이디, 전화번호 또는 이메일입니다.', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      nickname: data.nickname,
      phone: data.phone,
      email: data.email,
      preferredRegions: data.preferredRegions || [],
      preferredJobTypes: data.preferredJobTypes || [],
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      isAdultVerified: true,
      createdAt: true,
    },
  });

  const tokens = generateTokens(user.id, user.role);
  return { user, ...tokens };
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      nickname: true,
      password: true,
      role: true,
      isAdultVerified: true,
      isActive: true,
      profileImage: true,
    },
  });

  if (!user || !user.password) {
    throw new AppError('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  if (!user.isActive) {
    throw new AppError('비활성화된 계정입니다.', 403);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const { password: _, ...userWithoutPassword } = user;
  const tokens = generateTokens(user.id, user.role);
  return { user: userWithoutPassword, ...tokens };
}

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('유효하지 않은 토큰입니다.', 401);
    }

    return generateTokens(user.id, user.role);
  } catch {
    throw new AppError('유효하지 않은 리프레시 토큰입니다.', 401);
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      nickname: true,
      phone: true,
      email: true,
      role: true,
      isAdultVerified: true,
      profileImage: true,
      preferredRegions: true,
      preferredJobTypes: true,
      preferredMinPay: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404);
  }

  return user;
}
