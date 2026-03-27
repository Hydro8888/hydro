import { MapPin, Clock } from 'lucide-react';

const T = [
  { id: '1', nick: '달빛여우', age: '20대 초반', region: '서울 강남', types: ['라운지', '바'], exp: '1년', avail: '즉시', intro: '밝은 성격, 서비스직 경험 다수' },
  { id: '2', nick: '밤하늘별', age: '20대 중반', region: '서울 마포', types: ['노래방', '클럽'], exp: '6개월', avail: '주말', intro: '적극적이고 책임감 있습니다' },
  { id: '3', nick: '바다소녀', age: '20대 초반', region: '부산 해운대', types: ['클럽', '바'], exp: '초보', avail: '즉시', intro: '부산 거주, 성실하게 일하겠습니다' },
  { id: '4', nick: '꿈나무', age: '20대 후반', region: '서울 강남', types: ['룸', '라운지'], exp: '3년', avail: '협의', intro: '경력자, 업소 경험 풍부합니다' },
];

export default function TalentPage() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      <h1 className="text-xl font-bold mb-1">인재정보</h1>
      <p className="text-sm text-[#999] mb-5">구직자 프로필을 확인하고 스카우트하세요</p>
      <div className="space-y-3">
        {T.map(t => (
          <div key={t.id} className="card flex gap-4 p-4">
            <div className="w-12 h-12 shrink-0 bg-[#1E3A5F] rounded-full flex items-center justify-center text-xl">🦊</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div><h3 className="text-base font-bold">{t.nick}</h3><p className="text-xs text-[#999]">{t.age} · 경력 {t.exp}</p></div>
                <button className="btn btn-navy px-3 py-1.5 text-xs">스카우트</button>
              </div>
              <p className="mt-1.5 text-sm text-[#666]">{t.intro}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#999]">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.region}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.avail}</span>
                {t.types.map(tp => <span key={tp} className="tag tag-type">{tp}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
