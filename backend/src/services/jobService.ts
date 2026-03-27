import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface JobQuery {
  region?: string;
  jobType?: string;
  minPay?: number;
  maxPay?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function getJobs(query: JobQuery) {
  const { region, jobType, minPay, maxPay, sort = 'latest', page = 1, limit = 20 } = query;

  const where: Prisma.JobWhereInput = {
    status: 'ACTIVE',
    ...(region && { region }),
    ...(jobType && { jobType }),
    ...(minPay || maxPay ? {
      payAmount: {
        ...(minPay && { gte: minPay }),
        ...(maxPay && { lte: maxPay }),
      },
    } : {}),
  };

  const orderBy: Prisma.JobOrderByWithRelationInput = (() => {
    switch (sort) {
      case 'pay_high': return { payAmount: 'desc' };
      case 'pay_low': return { payAmount: 'asc' };
      case 'popular': return { viewCount: 'desc' };
      default: return { createdAt: 'desc' };
    }
  })();

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: {
          select: { id: true, name: true, region: true, isVerified: true },
        },
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getJobById(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true, region: true, address: true, phone: true, description: true, images: true, isVerified: true },
      },
      _count: { select: { applications: true, savedBy: true } },
    },
  });

  if (!job) {
    throw new AppError('공고를 찾을 수 없습니다.', 404);
  }

  // Increment view count
  await prisma.job.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  return job;
}

export async function createJob(companyId: string, data: Prisma.JobCreateInput & { companyId?: string }) {
  const { companyId: _, ...jobData } = data;
  return prisma.job.create({
    data: {
      ...jobData,
      company: { connect: { id: companyId } },
    },
    include: {
      company: { select: { id: true, name: true } },
    },
  });
}

export async function applyToJob(userId: string, jobId: string, message?: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'ACTIVE') {
    throw new AppError('지원할 수 없는 공고입니다.', 400);
  }

  const existing = await prisma.application.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });
  if (existing) {
    throw new AppError('이미 지원한 공고입니다.', 409);
  }

  return prisma.application.create({
    data: { userId, jobId, message },
  });
}

export async function toggleSaveJob(userId: string, jobId: string) {
  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });

  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.savedJob.create({ data: { userId, jobId } });
  return { saved: true };
}
