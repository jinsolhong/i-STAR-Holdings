'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import IStarLogo from '@/components/IStarLogo';
import { EVENT_CONFIG } from '@/config/event';

function HomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [step, setStep] = useState<'name' | 'phone'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 개인 링크로 진입 시 name 채우기 (invite/[token]에서 쿼리로 전달)
  const prefillName = searchParams.get('n');
  const prefillToken = searchParams.get('t');

  useEffect(() => {
    if (prefillName) setName(decodeURIComponent(prefillName));
  }, [prefillName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone4: step === 'phone' ? phone4.trim() : undefined,
          invitationToken: prefillToken ?? undefined,
        }),
      });

      const data = await res.json();

      if (data.status === 'not_found') {
        setError('초대 대상자 명단에서 확인되지 않습니다.\n담당자에게 문의해 주세요.');
      } else if (data.status === 'ambiguous') {
        setStep('phone');
        setError('');
      } else if (data.status === 'phone_mismatch') {
        setError('입력하신 정보와 일치하는 대상자를 찾을 수 없습니다.');
      } else if (data.status === 'ok') {
        // invitee_id를 세션에 저장 후 초대장 페이지로 이동
        sessionStorage.setItem('istar_invitee_id', data.invitee_id);
        sessionStorage.setItem('istar_name', data.name);
        router.push('/invitation');
      }
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="min-h-dvh flex flex-col px-6 pb-safe">
        {/* 상단 브랜드 영역 */}
        <div className="flex-1 flex flex-col justify-center">
          {/* 로고 / 브랜드 */}
          <div className="mb-10 animate-fade-in">
            <div className="mb-6">
              <IStarLogo size={56} />
            </div>
            <p className="text-gray-500 text-base mb-1">{EVENT_CONFIG.greetingLine1}</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug text-balance">
              {EVENT_CONFIG.greetingLine2}
            </h1>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="animate-slide-up space-y-4">
            {/* 이름 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업자 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="사업자 이름을 적어주세요."
                className="input-field"
                autoComplete="name"
                autoFocus={!prefillName}
                readOnly={!!prefillToken && step === 'name'}
              />
            </div>

            {/* 동명이인 구분: 휴대폰 뒤 4자리 */}
            {step === 'phone' && (
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  휴대전화 번호 뒤 4자리
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  본인 확인을 위해 휴대전화 번호 뒤 4자리를 입력해 주세요.
                </p>
                <input
                  type="tel"
                  value={phone4}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPhone4(v);
                    setError('');
                  }}
                  placeholder="0000"
                  className="input-field text-center text-xl tracking-widest"
                  maxLength={4}
                  inputMode="numeric"
                  autoFocus
                />
              </div>
            )}

            {/* 오류 메시지 */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 leading-relaxed whitespace-pre-line">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || (step === 'phone' && phone4.length !== 4)}
              className="btn-brand mt-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  초대장 확인하기
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 하단 행사 정보 힌트 */}
        <div className="py-6 text-center">
          <p className="text-xs text-gray-400">
            {EVENT_CONFIG.dateDisplay} · {EVENT_CONFIG.venue}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="mobile-container min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <HomeForm />
    </Suspense>
  );
}
