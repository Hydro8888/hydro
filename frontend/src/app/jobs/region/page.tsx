import Link from 'next/link';
import { MapPin } from 'lucide-react';

const REGIONS: Record<string, string[]> = {
  '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대', '노원', '영등포'],
  '경기': ['수원', '성남', '고양', '용인', '부천', '안산', '안양', '화성', '평택'],
  '인천': ['남동구', '부평', '계양', '연수'],
  '부산': ['해운대', '서면', '남포동', '부산진구', '사하구'],
  '대구': ['동성로', '수성구', '달서구'],
  '대전': ['둔산동', '유성구', '서구'],
  '광주': ['상무지구', '충장로', '광산구'],
  '울산': ['남구', '중구'],
  '강원': ['춘천', '원주', '강릉'],
  '충북': ['청주', '충주'],
  '충남': ['천안', '아산'],
  '전북': ['전주', '익산'],
  '전남': ['목포', '여수', '순천'],
  '경북': ['포항', '구미', '경주'],
  '경남': ['창원', '김해', '진주'],
  '제주': ['제주시', '서귀포'],
};

export default function RegionPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <h1 className="mb-1 text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-[#C9A961]" /> 지역별 채용정보</h1>
      <p className="mb-5 text-sm text-[#94A3B8]">원하는 지역의 채용정보를 확인하세요</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(REGIONS).map(([region, subs]) => (
          <div key={region} className="card p-4">
            <Link href={`/jobs/?region=${region}`} className="mb-2 block text-base font-bold text-[#C9A961] hover:underline">{region}</Link>
            <div className="flex flex-wrap gap-1.5">
              {subs.map(sub => (
                <Link key={sub} href={`/jobs/?region=${region}&sub=${sub}`} className="rounded-lg bg-[#112240] px-2.5 py-1 text-xs text-[#94A3B8] transition hover:bg-[#1E3A5F] hover:text-white">{sub}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
