import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';

const TALENTS = [
  { id: '1', nick: '달빛여우', age: '20대 초반', region: '서울 강남', types: ['라운지', '바'], exp: '1년', available: '즉시 가능', intro: '밝은 성격, 서비스직 경험 다수' },
  { id: '2', nick: '밤하늘별', age: '20대 중반', region: '서울 마포', types: ['노래방', '클럽'], exp: '6개월', available: '주말 가능', intro: '적극적이고 책임감 있습니다' },
  { id: '3', nick: '바다소녀', age: '20대 초반', region: '부산 해운대', types: ['클럽', '바'], exp: '초보', available: '즉시 가능', intro: '부산 거주, 성실하게 일하겠습니다' },
  { id: '4', nick: '꿈나무', age: '20대 후반', region: '서울 강남', types: ['룸', '라운지'], exp: '3년', available: '협의', intro: '경력자, 업소 경험 풍부합니다' },
  { id: '5', nick: '별빛', age: '20대 중반', region: '대구', types: ['노래방'], exp: '1년', available: '즉시 가능', intro: '대구/경북 지역 선호합니다' },
];

export default function TalentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <h1 className="mb-1 text-xl font-bold">인재정보</h1>
      <p className="mb-5 text-sm text-[#94A3B8]">구직자 프로필을 확인하고 스카우트하세요</p>

      <div className="space-y-3">
        {TALENTS.map(t => (
          <div key={t.id} className="card flex gap-4 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1E3A5F]/20 text-xl">🦊</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{t.nick}</h3>
                  <p className="text-[11px] text-[#64748B]">{t.age} · 경력 {t.exp}</p>
                </div>
                <button className="btn btn-navy px-3 py-1 text-xs">스카우트</button>
              </div>
              <p className="mt-1.5 text-xs text-[#94A3B8]">{t.intro}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{t.region}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{t.available}</span>
                {t.types.map(tp => <span key={tp} className="tag bg-[#1E3A5F]/20 text-[#94A3B8]">{tp}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
