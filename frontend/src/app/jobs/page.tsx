'use client';

import { useState } from 'react';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilter } from '@/components/jobs/JobFilter';
import { Sidebar } from '@/components/layout/Sidebar';

const MOCK = [
  { id: '1', title: '강남 프리미엄 라운지 스탭', region: '서울', jobType: '라운지', payAmount: 500000, payType: 'daily', companyName: '강남 프리미엄', isUrgent: true, isVerified: true },
  { id: '2', title: '홍대 감성 바 서빙', region: '서울', jobType: '바', payAmount: 400000, payType: 'daily', companyName: '홍대 감성바', isUrgent: false, isVerified: false },
  { id: '3', title: '부산 해운대 클럽 스탭', region: '부산', jobType: '클럽', payAmount: 350000, payType: 'daily', companyName: '해운대 나이트', isUrgent: true, isVerified: true },
  { id: '4', title: '압구정 VIP 룸 도우미', region: '서울', jobType: '룸', payAmount: 600000, payType: 'daily', companyName: '압구정 VIP', isUrgent: false, isVerified: true },
  { id: '5', title: '이태원 프리미엄 라운지', region: '서울', jobType: '라운지', payAmount: 450000, payType: 'daily', companyName: '이태원 라운지', isUrgent: false, isVerified: false },
  { id: '6', title: '대구 동성로 노래방 도우미', region: '대구', jobType: '노래방', payAmount: 300000, payType: 'daily', companyName: '동성로 노래방', isUrgent: true, isVerified: false },
];

export default function JobsPage() {
  const [region, setRegion] = useState('');
  const [jobType, setJobType] = useState('');
  const filtered = MOCK.filter(j => (!region || j.region === region) && (!jobType || j.jobType === jobType));

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">알바찾기</h1>
        <JobFilter selectedRegion={region} selectedJobType={jobType} onRegionChange={setRegion} onJobTypeChange={setJobType} />
      </div>
      <div className="flex gap-5">
        <Sidebar selectedRegion={region} selectedJobType={jobType} onRegionChange={setRegion} onJobTypeChange={setJobType} />
        <div className="flex-1">
          <p className="mb-3 text-sm text-[#9a8aa8]">총 <span className="font-semibold text-white">{filtered.length}</span>건</p>
          <div className="grid gap-2 sm:grid-cols-2">{filtered.map(j => <JobCard key={j.id} {...j} />)}</div>
          {!filtered.length && <p className="py-16 text-center text-[#6a5a7a]">조건에 맞는 공고가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
