'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import InvitationSlider from '@/components/InvitationSlider';
import QRCard from '@/components/QRCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EVENT_CONFIG } from '@/config/event';
import type { RsvpStatus } from '@/lib/types';

interface InviteeData {
  id: string;
  name: string;
  rsvp_status: RsvpStatus;
  qr_token_raw: string | null;
}

export default function InvitationPage() {
  const router = useRouter();
  const [invitee, setInvitee] = useState<InviteeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('istar_invitee_id');
    if (!id) { router.replace('/'); return; }
    fetchInvitee(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvitee = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitee?id=${id}`);
      const data = await res.json();
      if (data.success) setInvitee(data.data);
      else router.replace('/');
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (status: 'attending' | 'declined') => {
    if (!invitee) return;
    setRsvpLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitee_id: invitee.id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setInvitee({ ...invitee, rsvp_status: status, qr_token_raw: data.qr_token ?? invitee.qr_token_raw });
      } else {
        setError(data.error ?? '처리 중 오류가 발생했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invitee) return null;

  return (
    <div className="mobile-container animate-fade-in" style={{ background: '#fff' }}>

      {/* ── 이미지/영상 슬라이더: 경계 없이 전체 너비 ── */}
      <div className="relative w-full overflow-hidden">
        <InvitationSlider />

        {/* 상단 인사말 오버레이 (이미지 위에 자연스럽게) */}
        <div
          className="absolute top-0 left-0 right-0 px-5 pt-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
            zIndex: 10,
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '2px' }}>INVITATION</p>
          <h1 className="font-bold leading-snug" style={{ color: '#fff', fontSize: '22px', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
            <span style={{ color: '#f0d99a' }}>{invitee.name}</span>님,<br />
            i-STAR의 3주년 행사에<br />초대합니다.
          </h1>
          <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', letterSpacing: '1px' }}>
            {EVENT_CONFIG.sloganEn}
          </p>
        </div>

        {/* 하단 그라데이션 페이드 — 배경과 자연스럽게 연결 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #ffffff 0%, transparent 100%)', zIndex: 10 }}
        />
      </div>

      {/* ── 아래 콘텐츠 ── */}
      <div className="px-5 pb-safe space-y-6">

        {/* 행사 정보 카드 */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900 text-base">{EVENT_CONFIG.name}</h2>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#006241]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">일시</p>
              <p className="font-semibold text-gray-800">{EVENT_CONFIG.dateDisplay}</p>
              <p className="text-gray-600 text-sm flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />{EVENT_CONFIG.time}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#006241]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">장소</p>
              <p className="font-semibold text-gray-800">{EVENT_CONFIG.venue}</p>
              <p className="text-gray-600 text-sm">{EVENT_CONFIG.venueFloor}</p>
            </div>
            {EVENT_CONFIG.mapUrl && (
              <a href={EVENT_CONFIG.mapUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#006241] font-medium border border-[#006241] px-3 py-1.5 rounded-lg flex-shrink-0">
                지도 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* RSVP */}
        <div className="card">
          <p className="font-semibold text-gray-900 text-center mb-5 leading-snug">
            {EVENT_CONFIG.rsvpQuestion}
          </p>
          {invitee.rsvp_status === 'pending' ? (
            <div className="space-y-3">
              <button onClick={() => handleRsvp('attending')} disabled={rsvpLoading} className="btn-brand">
                {rsvpLoading ? <LoadingSpinner size="sm" color="white" /> : <><CheckCircle2 className="w-5 h-5" /> 참석합니다</>}
              </button>
              <button onClick={() => handleRsvp('declined')} disabled={rsvpLoading} className="btn-outline">
                <XCircle className="w-5 h-5" /> 참석이 어렵습니다
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${invitee.rsvp_status === 'attending' ? 'bg-green-50 text-[#006241]' : 'bg-gray-50 text-gray-600'}`}>
                {invitee.rsvp_status === 'attending'
                  ? <><CheckCircle2 className="w-5 h-5" /><span className="font-semibold">참석 신청 완료</span></>
                  : <><XCircle className="w-5 h-5" /><span className="font-semibold">불참 응답 완료</span></>}
              </div>
              <button onClick={() => handleRsvp(invitee.rsvp_status === 'attending' ? 'declined' : 'attending')} disabled={rsvpLoading} className="btn-outline text-sm">
                {rsvpLoading ? <LoadingSpinner size="sm" color="#006241" /> : invitee.rsvp_status === 'attending' ? '참석 취소하기' : '참석으로 변경하기'}
              </button>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
        </div>

        {/* QR 또는 불참 메시지 */}
        {invitee.rsvp_status === 'attending' && invitee.qr_token_raw && (
          <QRCard name={invitee.name} qrToken={invitee.qr_token_raw} />
        )}
        {invitee.rsvp_status === 'declined' && (
          <div className="card text-center py-8 animate-fade-in">
            <p className="text-gray-500 text-base font-medium">응답해 주셔서 감사합니다.</p>
            <p className="text-gray-400 text-sm mt-2">다음 기회에 함께할 수 있기를 바랍니다.</p>
          </div>
        )}

        {/* 슬로건 */}
        <div className="text-center py-4">
          <p className="text-[#006241] font-medium text-sm">{EVENT_CONFIG.slogan1}</p>
          <p className="text-[#006241] font-medium text-sm">{EVENT_CONFIG.slogan2}</p>
        </div>
      </div>
    </div>
  );
}
