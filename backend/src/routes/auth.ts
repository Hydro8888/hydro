import { Router, Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../types';
import * as authService from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: '리프레시 토큰이 필요합니다.' });
      return;
    }
    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-adult (placeholder for NICE API callback)
router.post('/verify-adult', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Integrate NICE iPIN / phone verification API
    // For now, this is a placeholder that marks user as adult-verified
    const { prisma } = await import('../config/database');
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { isAdultVerified: true, adultVerifiedAt: new Date() },
      select: { id: true, isAdultVerified: true, adultVerifiedAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
