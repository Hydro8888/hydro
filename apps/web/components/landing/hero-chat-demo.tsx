'use client';

import { useEffect, useState } from 'react';

type ModelResponse = {
  id: 'openai' | 'anthropic' | 'google';
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  words: string[];
};

const QUESTION = 'GPT-5.5, Claude Opus 4.8, Gemini 3.5 Flash의 차이점을 알려줘';

const MODELS: ModelResponse[] = [
  {
    id: 'openai',
    label: 'GPT-5.5',
    dotColor: 'bg-provider-openai',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    words: 'GPT-5.5는 복잡한 추론과 코드 생성에서 뛰어난 성능을 보입니다.'.split(' '),
  },
  {
    id: 'anthropic',
    label: 'Claude Opus 4.8',
    dotColor: 'bg-provider-anthropic',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    words: 'Claude Opus 4.8은 긴 문서 분석과 자연스러운 글쓰기에 강점이 있습니다.'.split(' '),
  },
  {
    id: 'google',
    label: 'Gemini 3.5 Flash',
    dotColor: 'bg-provider-google',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    words: 'Gemini 3.5 Flash는 이미지와 영상을 포함한 멀티모달 처리에 탁월합니다.'.split(' '),
  },
];

const T = {
  question: 300,
  m0Dots: 1100,
  m0Stream: 1700,
  m1Dots: 3600,
  m1Stream: 4300,
  m2Dots: 6400,
  m2Stream: 7100,
  loop: 15000,
};
const WORD_STEP = 55;

type Progress = [number, number, number];
const FINAL_PROGRESS: Progress = [
  MODELS[0].words.length,
  MODELS[1].words.length,
  MODELS[2].words.length,
];

export function HeroChatDemo() {
  const [mounted, setMounted] = useState(false);
  const [showQ, setShowQ] = useState(true);
  const [progress, setProgress] = useState<Progress>(FINAL_PROGRESS);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const streamTimers: ReturnType<typeof setInterval>[] = [];

    const runLoop = () => {
      setShowQ(false);
      setProgress([-1, -1, -1]);
      timers.push(setTimeout(() => setShowQ(true), T.question));

      const startModel = (idx: 0 | 1 | 2, dotsAt: number, streamAt: number) => {
        timers.push(
          setTimeout(() => {
            setProgress((p) => {
              const n = [...p] as Progress;
              n[idx] = 0;
              return n;
            });
          }, dotsAt)
        );
        timers.push(
          setTimeout(() => {
            let w = 0;
            const interval = setInterval(() => {
              w++;
              setProgress((p) => {
                const n = [...p] as Progress;
                n[idx] = w;
                return n;
              });
              if (w >= MODELS[idx].words.length) clearInterval(interval);
            }, WORD_STEP);
            streamTimers.push(interval);
          }, streamAt)
        );
      };

      startModel(0, T.m0Dots, T.m0Stream);
      startModel(1, T.m1Dots, T.m1Stream);
      startModel(2, T.m2Dots, T.m2Stream);
      timers.push(setTimeout(runLoop, T.loop));
    };

    runLoop();
    return () => {
      timers.forEach(clearTimeout);
      streamTimers.forEach(clearInterval);
    };
  }, [mounted]);

  // Pre-mount / reduced-motion: render final frame so SSR matches first client paint
  const p: Progress = mounted ? progress : FINAL_PROGRESS;
  const qVisible = mounted ? showQ : true;

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="h-9 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center px-4 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="mx-auto h-5 w-56 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center justify-center">
            free.ai.kr
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-success-600 dark:text-success-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
            </span>
            Live compare
          </div>
        </div>

        {/* Chat body */}
        <div className="p-4 sm:p-6 space-y-4 bg-gray-25 dark:bg-gray-950/60 min-h-[340px] sm:min-h-[420px]">
          {qVisible && (
            <div className="flex justify-end animate-slide-up">
              <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 text-white px-4 py-2.5 text-sm shadow-xs">
                {QUESTION}
              </div>
            </div>
          )}

          {MODELS.map((m, i) => {
            const state = p[i];
            if (state < 0) return null;
            const done = state >= m.words.length;
            const shownText = m.words.slice(0, state).join(' ');
            return (
              <div key={m.id} className="animate-slide-up">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${m.badgeBg} ${m.badgeText}`}
                  >
                    {m.label}
                  </span>
                </div>
                <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 shadow-xs">
                  {state === 0 ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    </div>
                  ) : (
                    <span className="leading-relaxed">
                      {shownText}
                      {!done && (
                        <span className="stream-caret ml-0.5 inline-block w-[2px] h-3.5 bg-gray-500 align-middle" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle glow */}
      <div className="absolute -inset-x-10 -bottom-6 h-24 bg-gradient-to-t from-primary-500/10 to-transparent blur-2xl -z-10" />
    </div>
  );
}
