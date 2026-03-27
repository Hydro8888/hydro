import { Router, Request, Response, NextFunction } from 'express';
import { jobQuerySchema, createJobSchema, createReportSchema } from '../types';
import * as jobService from '../services/jobService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

// GET /api/jobs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = jobQuerySchema.parse(req.query);
    const result = await jobService.getJobs(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs (employer only)
router.post('/', authenticate, requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createJobSchema.parse(req.body);
    const company = await prisma.company.findUnique({ where: { userId: req.userId } });
    if (!company) {
      res.status(403).json({ error: '업소 등록이 필요합니다.' });
      return;
    }
    const job = await jobService.createJob(company.id, data as any);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/apply
router.post('/:id/apply', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.applyToJob(req.userId!, req.params.id, req.body.message);
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/save
router.post('/:id/save', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await jobService.toggleSaveJob(req.userId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/report
router.post('/:id/report', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason, description } = createReportSchema.parse(req.body);
    const report = await prisma.report.create({
      data: {
        reporterId: req.userId!,
        targetType: 'job',
        targetId: req.params.id,
        reason,
        description,
      },
    });
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
