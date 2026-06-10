'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';
import { useUIStore } from '@/stores/ui-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Key, Palette, Sparkles, Info } from 'lucide-react';

export default function SettingsPage() {
  const { selectedModelIds, selectModel } = useModelStore();
  const { theme, setTheme } = useUIStore();
  const { success } = useToast();

  return (
    <div className="p-8 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
          설정
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          설정은 자동으로 저장됩니다
        </p>
      </div>

      <div className="space-y-6">
        {/* Model defaults */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5 mb-1">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                모델 기본값
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              새 대화에서 기본적으로 사용할 AI 모델을 선택하세요
            </p>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              기본 AI 모델
            </label>
            <select
              value={selectedModelIds[0] || ''}
              onChange={(e) => {
                selectModel(e.target.value, 0);
                success('기본 모델이 변경되었습니다.');
              }}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg shadow-xs focus:outline-none focus:ring-4 focus:ring-primary-500/12 focus:border-primary-500 text-sm"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5 mb-1">
              <Palette className="w-4 h-4 text-primary-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                외관 테마
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              선호하는 화면 모드를 선택하세요
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'light', label: '라이트', icon: Sun },
                { key: 'dark', label: '다크', icon: Moon },
                { key: 'system', label: '시스템', icon: Monitor },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    success(`테마가 ${label}(으)로 변경되었습니다.`);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                    theme === key
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      theme === key
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      theme === key
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* API Key */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5 mb-1">
              <Key className="w-4 h-4 text-primary-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                API 키 관리
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              자체 API 키로 직접 연결 (BYOK)
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                BYOK(Bring Your Own Key) 기능은 준비 중입니다. 곧 출시됩니다.
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4">
          모든 설정은 브라우저 로컬 스토리지에 자동 저장됩니다
        </p>
      </div>
    </div>
  );
}
