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
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 text-sm">초대장을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!invitee) return null;

  return (
    <div className="mobile-container">
      <div className="px-5 pb-safe pt-8 space-y-6 animate-fade-in">

        {/* 개인화 인사 */}
        <div className="animate-slide-up text-center">
          {/* Invitation - 기본 Pretendard, 딥그린 */}
          <p style={{ fontFamily: 'Pretendard, sans-serif', fontSize: '13px', fontWeight: 600, color: '#004d32', letterSpacing: '3px', marginBottom: '20px' }}>
            Invitation
          </p>
          {/* From Connection To Dream - Zapfino */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: "'Zapfino', cursive", fontSize: '22px', color: '#B8944A', lineHeight: 1.9, margin: 0 }}>From Connection To Dream</p>
          </div>
          {/* 이름 - 인천교육자람체, 가로 프레임 꽉 채움 */}
          <div style={{ fontFamily: "'Incheon', sans-serif", lineHeight: 1.5 }}>
            <div style={{ fontSize: 'clamp(36px, 10vw, 52px)', color: '#B8944A' }}>
              {invitee.name}<span style={{ color: '#004d32' }}>님,</span>
            </div>
            <div style={{ fontSize: 'clamp(20px, 5.5vw, 30px)', color: '#004d32' }}>
              i-STAR의 3주년 행사에 초대합니다.
            </div>
          </div>
        </div>

        {/* 슬라이더 */}
        <InvitationSlider />

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

        {/* 타임테이블 */}
        <div className="card">
          <h2 className="font-bold text-gray-900 text-base mb-4">행사 일정</h2>
          <div className="space-y-4">
            {/* 13:00-14:00 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-right" style={{ minWidth: '90px' }}>
                <span className="text-xs font-semibold text-[#006241]">13:00 – 14:00</span>
              </div>
              <div className="flex-1 border-l-2 border-[#B8944A] pl-3 pb-2">
                <p className="font-semibold text-gray-800 text-sm">셀프 체크인 및 착석</p>
              </div>
            </div>
            {/* 14:00-16:00 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-right" style={{ minWidth: '90px' }}>
                <span className="text-xs font-semibold text-[#006241]">14:00 – 16:00</span>
              </div>
              <div className="flex-1 border-l-2 border-[#B8944A] pl-3 pb-2">
                <p className="font-semibold text-gray-800 text-sm">글로닉스(GLONICS) 런칭쇼</p>
              </div>
            </div>
            {/* 16:00-18:00 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-right" style={{ minWidth: '90px' }}>
                <span className="text-xs font-semibold text-[#006241]">16:00 – 18:00</span>
              </div>
              <div className="flex-1 border-l-2 border-[#B8944A] pl-3 pb-2">
                <p className="font-semibold text-gray-800 text-sm mb-2">1부 본 행사</p>
                <ul className="space-y-1">
                  {['오프닝', '개회선언', '지난 3년을 회고하며', '회장 개회사', '내빈 이사 소개', '초기 멤버 및 공로 시상', '3스타 헌정 & 스타 승급식', '비전 키노트 선포', '1부 피날레 (케이크 컷팅 및 축전)'].map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#B8944A] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* 18:00-21:00 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-right" style={{ minWidth: '90px' }}>
                <span className="text-xs font-semibold text-[#006241]">18:00 – 21:00</span>
              </div>
              <div className="flex-1 border-l-2 border-[#B8944A] pl-3">
                <p className="font-semibold text-gray-800 text-sm mb-2">2부 행사</p>
                <ul className="space-y-1">
                  {['만찬 및 건배제의', '경품 추첨', '축하공연', '클로징 및 폐회'].map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#B8944A] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 슬로건 */}
        <div className="text-center py-6">
          <p className="text-[#006241] font-medium text-sm">{EVENT_CONFIG.slogan1}</p>
          <p className="text-[#006241] font-medium text-sm">{EVENT_CONFIG.slogan2}</p>
          <p className="text-gray-300 text-xs mt-2">{EVENT_CONFIG.sloganEn}</p>
        </div>
      </div>
    </div>
  );
}
