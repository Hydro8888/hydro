'use client';

import { useState } from 'react';
import { Check, ChevronRight, Shield } from 'lucide-react';

type Step = 1 | 2 | 3;

const TERMS = [
  { id: 'service', label: '이용약관 동의 (필수)', required: true },
  { id: 'privacy', label: '개인정보처리방침 동의 (필수)', required: true },
  { id: 'youth', label: '청소년보호정책 동의 (필수)', required: true },
  { id: 'location', label: '위치정보 이용 동의 (필수)', required: true },
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '제주'];
const JOB_TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

export function RegisterWizard() {
  const [step, setStep] = useState<Step>(1);
  const [agreedTerms, setAgreedTerms] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    username: '', password: '', passwordConfirm: '', nickname: '',
    phone: '', email: '',
  });
  const [isAdultVerified, setIsAdultVerified] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);

  const allTermsAgreed = TERMS.every((t) => agreedTerms.has(t.id));

  const toggleAllTerms = () => {
    if (allTermsAgreed) {
      setAgreedTerms(new Set());
    } else {
      setAgreedTerms(new Set(TERMS.map((t) => t.id)));
    }
  };

  const toggleTerm = (id: string) => {
    const next = new Set(agreedTerms);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAgreedTerms(next);
  };

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const toggleJobType = (t: string) => {
    setSelectedJobTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleSubmit = () => {
    // TODO: API call
    console.log('Register:', { ...formData, selectedRegions, selectedJobTypes });
    alert('가입이 완료되었습니다! 환영합니다 🦊');
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Step indicator */}
      <div className="flex border-b border-border">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium ${
              step === s ? 'border-b-2 border-primary text-primary' :
              step > s ? 'text-success' : 'text-muted-foreground'
            }`}
          >
            {step > s ? <Check className="h-4 w-4" /> : null}
            {s === 1 ? '약관동의' : s === 2 ? '정보입력' : '프로필'}
          </div>
        ))}
      </div>

      <div className="p-6">
        {/* STEP 1: Terms */}
        {step === 1 && (
          <div>
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
              ⚠️ 본 서비스는 19세 이상만 이용 가능합니다
            </div>

            <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-lg bg-muted p-3">
              <input
                type="checkbox"
                checked={allTermsAgreed}
                onChange={toggleAllTerms}
                className="h-4 w-4 accent-primary"
              />
              <span className="font-medium">전체 동의</span>
            </label>

            <div className="space-y-2">
              {TERMS.map((term) => (
                <label key={term.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={agreedTerms.has(term.id)}
                    onChange={() => toggleTerm(term.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{term.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!allTermsAgreed}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-white transition-all hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음 <ChevronRight className="h-4 w-4" />
            </button>

            <button className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground">
              19세 미만이에요 (나가기)
            </button>
          </div>
        )}

        {/* STEP 2: Info + Verification */}
        {step === 2 && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">아이디</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="영문+숫자 4~12자"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">비밀번호</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="8자 이상, 특수문자 포함"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">비밀번호 확인</label>
                <input
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">닉네임</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="프로필에 표시될 닉네임"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">이메일 (선택)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="비밀번호 찾기에 사용됩니다"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Adult Verification */}
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 text-accent" />
                성인인증 (필수)
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                본인인증을 통해 19세 이상임을 확인합니다.
              </p>
              {isAdultVerified ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Check className="h-4 w-4" /> 성인 확인 완료
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAdultVerified(true)}
                    className="flex-1 rounded-lg border border-accent bg-accent/10 py-2.5 text-sm font-medium text-accent transition-all hover:bg-accent/20"
                  >
                    휴대폰 인증
                  </button>
                  <button
                    onClick={() => setIsAdultVerified(true)}
                    className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-accent hover:text-accent"
                  >
                    아이핀 인증
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.username || !formData.password || !formData.nickname || !isAdultVerified}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-white transition-all hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음 <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Profile */}
        {step === 3 && (
          <div>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-3xl">
                🦊
              </div>
              <button className="text-sm text-primary hover:text-primary-light">프로필 사진 업로드</button>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium">희망 지역 (선택)</h3>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                      selectedRegions.includes(r) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium">희망 업종 (선택)</h3>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleJobType(t)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                      selectedJobTypes.includes(t) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-accent py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                가입 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
