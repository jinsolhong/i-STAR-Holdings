'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Calendar, MapPin, User, Ticket } from 'lucide-react';
import { EVENT_CONFIG } from '@/config/event';

interface Props {
  name: string;
  qrToken: string; // 서버에서 받은 원본 QR 토큰
}

export default function QRCard({ name, qrToken }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !qrToken) return;
    QRCode.toCanvas(canvasRef.current, qrToken, {
      width: 200,
      margin: 2,
      color: { dark: '#006241', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }, [qrToken]);

  return (
    <div className="qr-card p-6 mx-auto w-full animate-fade-in">
      {/* 헤더 */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1.5 bg-green-50 text-[#006241] text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
          <Ticket className="w-3.5 h-3.5" />
          QR 초대권
        </div>
        <p className="font-bold text-gray-900 text-lg leading-snug">
          참석 신청이 완료되었습니다.
        </p>
      </div>

      {/* QR 코드 */}
      <div className="flex justify-center mb-5">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>

      {/* 참석자 정보 */}
      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-2.5">
          <User className="w-4 h-4 text-[#006241] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">참석자</p>
            <p className="font-semibold text-gray-900">{name} 님</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#006241] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">일시</p>
            <p className="font-medium text-gray-800 text-sm">
              {EVENT_CONFIG.dateDisplay} {EVENT_CONFIG.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-[#006241] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">장소</p>
            <p className="font-medium text-gray-800 text-sm">
              {EVENT_CONFIG.venue} {EVENT_CONFIG.venueFloor}
            </p>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-dashed border-gray-200 my-4" />

      {/* 초대권 번호 */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">초대권 번호</p>
        <p className="text-xs font-mono font-medium text-gray-700 tracking-wide break-all bg-gray-50 rounded-lg px-3 py-2 text-center">
          {qrToken.toUpperCase().match(/.{1,8}/g)?.join(' ')}
        </p>
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 p-3 bg-amber-50 rounded-xl">
        <p className="text-xs text-amber-700 text-center leading-relaxed">
          행사 당일 입장 시 QR 초대권을 보여주세요.<br />
          <span className="font-semibold">본 QR 초대권은 1인 1회만 사용할 수 있습니다.</span>
        </p>
      </div>

      {/* 캡처 안내 */}
      <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
        화면을 캡처해 두시면 행사 당일<br />더욱 편리하게 입장하실 수 있습니다.
      </p>
    </div>
  );
}
