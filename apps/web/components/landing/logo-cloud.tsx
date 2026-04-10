import { MODEL_CATALOG } from '@ai-portal/shared';

export function LogoCloud() {
  // 고유한 provider 9개 추출
  const providers = Array.from(
    new Map(MODEL_CATALOG.map((m) => [m.provider, m])).values()
  ).slice(0, 9);

  return (
    <section className="py-16 md:py-20 border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-10">
          세계 최고의 AI 모델들이 하나의 플랫폼에 모였습니다
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-8 items-center justify-items-center">
          {providers.map((p) => (
            <div
              key={p.provider}
              className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${p.color}15` }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
              <span className="text-sm font-semibold capitalize">{p.provider}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
