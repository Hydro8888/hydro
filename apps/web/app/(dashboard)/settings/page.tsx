'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';
import { useUIStore } from '@/stores/ui-store';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { selectedModelIds, selectModel } = useModelStore();
  const { theme, setTheme } = useUIStore();
  const { success } = useToast();

  return (
    <div className="p-6 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">설정</h1>
        <p className="text-sm text-gray-500">설정은 자동으로 저장됩니다.</p>
      </div>

      <div className="space-y-6">
        <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">모델 기본값</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              기본 AI 모델
            </label>
            <select
              value={selectedModelIds[0] || ''}
              onChange={(e) => {
                selectModel(e.target.value, 0);
                success('기본 모델이 변경되었습니다.');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">테마</h2>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  success(`테마가 ${t === 'light' ? '라이트' : t === 'dark' ? '다크' : '시스템'}으로 변경되었습니다.`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === t
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'light' ? '라이트' : t === 'dark' ? '다크' : '시스템'}
              </button>
            ))}
          </div>
        </section>

        <section className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">API 키 관리</h2>
          <p className="text-sm text-gray-500">
            BYOK(Bring Your Own Key) 기능은 준비 중입니다.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          모든 설정은 브라우저 로컬 스토리지에 자동 저장됩니다.
        </p>
      </div>
    </div>
  );
}
