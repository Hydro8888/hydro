import React from 'react';
import { HeroSection, CategoryGrid, HowItWorks, TrustBadges, CaseCards } from '@/components/home';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const cases = await prisma.successCase.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const serialized = cases.map((c) => ({
    id: c.id,
    category: c.category,
    title: c.title,
    summary: c.summary,
    duration: c.duration,
    satisfaction: c.satisfaction,
  }));

  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <TrustBadges />
      <CaseCards cases={serialized} />
    </>
  );
}
