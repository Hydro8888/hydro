'use client';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">설정</h1>
        <p className="text-sm text-gray-500">계정 설정 및 환경 설정을 관리하세요.</p>
      </div>

      <div className="space-y-6">
        <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">모델 기본값</h2>
          <p className="text-sm text-gray-500">기본 AI 모델 및 응답 설정을 관리합니다.</p>
        </section>

        <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">API 키 관리</h2>
          <p className="text-sm text-gray-500">BYOK(Bring Your Own Key) 설정을 관리합니다.</p>
        </section>
      </div>
    </div>
  );
}
