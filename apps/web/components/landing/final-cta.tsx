import { EmailCaptureForm } from './email-capture-form';

export function FinalCta() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          지금 바로 시작하세요
        </h2>
        <p className="text-lg text-primary-100 mb-8">
          50,000 토큰을 무료로 받고, 세계 최고의 AI를 경험하세요
        </p>

        <EmailCaptureForm variant="dark" className="max-w-md mx-auto" />

        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-primary-200">
          <span>✓ 카드 정보 불필요</span>
          <span>✓ 즉시 시작</span>
          <span>✓ 언제든 취소</span>
        </div>
      </div>
    </section>
  );
}
