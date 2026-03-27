'use client';

import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">설정</h1>
        <p className="text-sm text-gray-500">계정 설정 및 환경 설정을 관리하세요.</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">계정</h2>
          <UserProfile />
        </section>
      </div>
    </div>
  );
}
