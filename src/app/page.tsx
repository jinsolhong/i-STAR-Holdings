'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EVENT_CONFIG } from '@/config/event';
import { GRADES, GRADE_LABELS, type Grade } from '@/lib/types';

const BG = '#0a2e1c';
const GOLD = 'rgba(184,148,74,0.9)';
const GOLD_DIM = 'rgba(184,148,74,0.4)';

function HomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [phone4, setPhone4] = useState('');
  const [step, setStep] = useState<'name' | 'phone'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prefillName = searchParams.get('n');
  const prefillToken = searchParams.get('t');

  useEffect(() => {
    if (prefillName) setName(decodeURIComponent(prefillName));
  }, [prefillName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
    if (!grade) { setError('등급을 선택해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), grade,
          phone4: step === 'phone' ? phone4.trim() : undefined,
          invitationToken: prefillToken ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.status === 'not_found') {
        setError('초대 대상자 명단에서 확인되지 않습니다.\n담당자에게 문의해 주세요.');
      } else if (data.status === 'ambiguous') {
        setStep('phone'); setError('');
      } else if (data.status === 'phone_mismatch') {
        setError('입력하신 정보와 일치하는 대상자를 찾을 수 없습니다.');
      } else if (data.status === 'ok') {
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
    <div className="mobile-container min-h-dvh" style={{ background: BG }}>

      {/* ── 상단: 초대장 이미지 (경계 없이 배경과 연결) ── */}
      <div className="relative w-full" style={{ aspectRatio: '3/4.2' }}>
        <Image
          src={EVENT_CONFIG.homeBgImage}
          alt="i-STAR 3주년 초대장"
          fill
          className="object-cover"
          priority
        />
        {/* 하단 그라데이션: 이미지 → 배경색으로 자연스럽게 페이드 */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '45%',
            background: `linear-gradient(to bottom, transparent 0%, ${BG} 100%)`,
          }}
        />
      </div>

      {/* ── 하단: 폼 영역 ── */}
      <div className="px-6 pb-safe" style={{ marginTop: '-2rem', position: 'relative', zIndex: 1 }}>

        {/* 골드 구분선 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
          <span style={{ color: GOLD_DIM, fontSize: '9px', letterSpacing: '3px' }}>I - STAR</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 등급 선택 */}
          <div>
            <label style={{ color: GOLD, fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
              등급 선택
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGrade(g); setError(''); }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: `1px solid ${grade === g ? GOLD : 'rgba(255,255,255,0.2)'}`,
                    background: grade === g ? 'rgba(184,148,74,0.18)' : 'rgba(255,255,255,0.05)',
                    color: grade === g ? GOLD : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {GRADE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {/* 이름 입력 */}
          <div>
            <label style={{ color: GOLD, fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              사업자 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="성함을 입력해 주세요."
              autoComplete="name"
              readOnly={!!prefillToken && step === 'name'}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '12px',
                border: `1px solid rgba(184,148,74,0.3)`,
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = GOLD; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(184,148,74,0.3)'; }}
            />
          </div>

          {/* 동명이인 구분 */}
          {step === 'phone' && (
            <div className="animate-slide-up">
              <label style={{ color: GOLD, fontSize: '11px', letterSpacing: '1.5px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                휴대전화 번호 뒤 4자리
              </label>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px' }}>
                본인 확인을 위해 입력해 주세요.
              </p>
              <input
                type="tel"
                value={phone4}
                onChange={(e) => { setPhone4(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                placeholder="0000"
                maxLength={4}
                inputMode="numeric"
                autoFocus
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: `1px solid rgba(184,148,74,0.3)`,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '20px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* 오류 */}
          {error && (
            <div className="flex items-start gap-2 animate-fade-in" style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }} className="whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* 확인 버튼 */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !grade || (step === 'phone' && phone4.length !== 4)}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: '15px',
              borderRadius: '12px',
              background: (name.trim() && grade)
                ? 'linear-gradient(135deg, rgba(184,148,74,0.95), rgba(210,175,100,0.95))'
                : 'rgba(255,255,255,0.1)',
              color: (name.trim() && grade) ? '#1a1a1a' : 'rgba(255,255,255,0.3)',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: (name.trim() && grade) ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <LoadingSpinner size="sm" color="#1a1a1a" />
              : <><span>초대장 확인하기</span><ChevronRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {/* 하단 행사 정보 */}
        <div className="mt-8 mb-4 text-center">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.5px' }}>
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
      <div className="mobile-container min-h-dvh flex items-center justify-center" style={{ background: BG }}>
        <LoadingSpinner size="lg" color={GOLD} />
      </div>
    }>
      <HomeForm />
    </Suspense>
  );
}
