import Link from 'next/link';
import { RegisterWizard } from '@/components/auth/RegisterWizard';

export default function RegisterPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">여우알바 회원이 되어 안전하게 일자리를 찾아보세요</p>
        </div>
        <RegisterWizard />
        <p className="mt-4 text-center text-sm text-[#94A3B8]">이미 계정이 있으신가요? <Link href="/login/" className="text-[#C9A961]">로그인</Link></p>
      </div>
    </div>
  );
}
