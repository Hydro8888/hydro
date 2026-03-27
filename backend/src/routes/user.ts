import { Router, Response, NextFunction } from 'express';
import { updateProfileSchema } from '../types';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /api/user/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, username: true, nickname: true, phone: true, email: true,
        role: true, isAdultVerified: true, profileImage: true,
        preferredRegions: true, preferredJobTypes: true, preferredMinPay: true,
        createdAt: true,
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true, nickname: true, profileImage: true,
        preferredRegions: true, preferredJobTypes: true, preferredMinPay: true,
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/user/applications
router.get('/applications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: { id: true, title: true, region: true, jobType: true, payAmount: true, payType: true, images: true,
            company: { select: { name: true } },
          },
        },
      },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

// GET /api/user/saved-jobs
router.get('/saved-jobs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: { id: true, title: true, region: true, jobType: true, payAmount: true, payType: true, images: true, status: true,
            company: { select: { name: true } },
          },
        },
      },
    });
    res.json(savedJobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/user/notifications
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/notifications/:id/read
router.put('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default router;
