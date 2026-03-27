import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="font-bold text-xl">Portal Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
          >
            로그인
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            무료 시작하기
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          One Dashboard,
          <br />
          <span className="text-primary-500">All Premium AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          GPT-5, Claude, Gemini, Grok 등 전세계 TOP 10 유료 LLM을
          <br />
          단일 인터페이스에서 선택, 비교, 사용하세요.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-primary-500 text-white rounded-xl text-lg font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/billing"
            className="px-8 py-3 border border-gray-300 rounded-xl text-lg font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
          >
            요금제 보기
          </Link>
        </div>

        <div className="mt-20 flex items-center justify-center gap-6 flex-wrap">
          {[
            { name: 'OpenAI', color: '#10A37F' },
            { name: 'Anthropic', color: '#CC785C' },
            { name: 'Google', color: '#4285F4' },
            { name: 'xAI', color: '#1DA1F2' },
            { name: 'Meta', color: '#0668E1' },
            { name: 'Cohere', color: '#D4AF37' },
            { name: 'Mistral', color: '#FD6E00' },
            { name: 'Amazon', color: '#FF9900' },
            { name: 'AI21', color: '#7B68EE' },
            { name: 'Perplexity', color: '#1FB8CD' },
          ].map((provider) => (
            <div
              key={provider.name}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: provider.color }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {provider.name}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
