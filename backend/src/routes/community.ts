import { Router, Request, Response, NextFunction } from 'express';
import { createPostSchema, createCommentSchema } from '../types';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/posts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where = category ? { category: category as any } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          user: { select: { id: true, nickname: true, profileImage: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Hide user info for anonymous posts
    const sanitized = posts.map(post => ({
      ...post,
      user: post.isAnonymous ? { id: '', nickname: '익명', profileImage: null } : post.user,
    }));

    res.json({
      posts: sanitized,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, nickname: true, profileImage: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, nickname: true, profileImage: true } },
          },
        },
      },
    });

    if (!post) throw new AppError('게시글을 찾을 수 없습니다.', 404);

    await prisma.post.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });

    // Sanitize anonymous
    const sanitized = {
      ...post,
      user: post.isAnonymous ? { id: '', nickname: '익명', profileImage: null } : post.user,
      comments: post.comments.map(c => ({
        ...c,
        user: c.isAnonymous ? { id: '', nickname: '익명', profileImage: null } : c.user,
      })),
    };

    res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createPostSchema.parse(req.body);
    const post = await prisma.post.create({
      data: { ...data, userId: req.userId! },
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comments
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, isAnonymous } = createCommentSchema.parse(req.body);
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) throw new AppError('게시글을 찾을 수 없습니다.', 404);

    const comment = await prisma.comment.create({
      data: {
        postId: req.params.id,
        userId: req.userId!,
        content,
        isAnonymous: isAnonymous || false,
      },
      include: {
        user: { select: { id: true, nickname: true, profileImage: true } },
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

export default router;
