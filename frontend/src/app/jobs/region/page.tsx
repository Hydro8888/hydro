import Link from 'next/link';
import { MapPin } from 'lucide-react';

const R: Record<string, string[]> = { '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대', '노원', '영등포'], '경기': ['수원', '성남', '고양', '용인', '부천', '안산', '안양', '화성'], '인천': ['남동구', '부평', '계양', '연수'], '부산': ['해운대', '서면', '남포동', '부산진구'], '대구': ['동성로', '수성구', '달서구'], '대전': ['둔산동', '유성구', '서구'], '광주': ['상무지구', '충장로', '광산구'], '울산': ['남구', '중구'], '강원': ['춘천', '원주', '강릉'], '충북': ['청주', '충주'], '충남': ['천안', '아산'], '전북': ['전주', '익산'], '전남': ['목포', '여수', '순천'], '경북': ['포항', '구미', '경주'], '경남': ['창원', '김해', '진주'], '제주': ['제주시', '서귀포'] };

export default function RegionPage() {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-5">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1"><MapPin className="h-5 w-5 text-[#C9A961]" /> 지역별 채용정보</h1>
      <p className="text-sm text-[#999] mb-5">원하는 지역의 채용정보를 확인하세요</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(R).map(([region, subs]) => (
          <div key={region} className="card p-4">
            <Link href={`/jobs/?region=${region}`} className="text-base font-bold text-[#1E3A5F] hover:text-[#C9A961]">{region}</Link>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {subs.map(s => <Link key={s} href={`/jobs/?region=${region}&sub=${s}`} className="pill hover:bg-[#1E3A5F] hover:text-[#ffffff] hover:border-[#1E3A5F]">{s}</Link>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
