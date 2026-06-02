'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Search, CheckCircle2, XCircle, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { CheckinResult } from '@/lib/types';

type ScanMode = 'idle' | 'scanning' | 'result';

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  success:       { bg: 'bg-green-500',  text: 'text-white',     icon: CheckCircle2,  label: '입장 확인' },
  already_used:  { bg: 'bg-orange-500', text: 'text-white',     icon: XCircle,       label: '이미 입장됨' },
  invalid:       { bg: 'bg-red-600',    text: 'text-white',     icon: XCircle,       label: '유효하지 않음' },
  not_attending: { bg: 'bg-yellow-400', text: 'text-gray-900',  icon: AlertTriangle, label: '참석 미신청' },
  locked:        { bg: 'bg-gray-400',   text: 'text-white',     icon: RefreshCw,     label: '처리 중' },
};

const AUTO_RESET_SEC = 5;

export default function CheckinPage() {
  const [mode, setMode] = useState<ScanMode>('idle');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_RESET_SEC);
  const [kioskMode, setKioskMode] = useState(false); // 키오스크 모드 (자동 재시작)

  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-div';
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const stopScanner = useCallback(async () => {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop().catch(() => {});
      qrRef.current.clear();
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError('');
    setMode('scanning');
    setResult(null);

    setTimeout(async () => {
      try {
        qrRef.current = new Html5Qrcode(scannerDivId);
        await qrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            await stopScanner();
            setMode('result');
            await doCheckin(decodedText);
          },
          () => {}
        );
      } catch {
        setCameraError('카메라 접근이 거부되었습니다.');
        setMode('idle');
      }
    }, 300);
  }, [stopScanner]); // eslint-disable-line react-hooks/exhaustive-deps

  const doCheckin = async (token: string) => {
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: token }),
      });
      const d = await res.json();
      setResult(d.result);
    } catch {
      setResult({ status: 'invalid', message: '서버 오류가 발생했습니다.' });
    } finally {
      setCheckinLoading(false);
    }
  };

  // 결과 표시 후 카운트다운 → 자동 재시작
  useEffect(() => {
    if (mode === 'result' && !checkinLoading) {
      setCountdown(AUTO_RESET_SEC);

      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      countdownTimer.current = setTimeout(() => {
        setResult(null);
        if (kioskMode) {
          startScanner(); // 키오스크: 자동 재시작
        } else {
          setMode('idle');
        }
      }, AUTO_RESET_SEC * 1000);
    }

    return () => {
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [mode, checkinLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetNow = () => {
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setResult(null);
    if (kioskMode) startScanner();
    else setMode('idle');
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setManualLoading(true);
    setMode('result');
    await doCheckin(manualToken.trim());
    setManualToken('');
    setManualLoading(false);
  };

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);

  const statusCfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">현장 QR 체크인</h1>

        {/* 키오스크 모드 토글 */}
        <button
          onClick={() => setKioskMode(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            kioskMode ? 'bg-[#006241] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          키오스크 모드 {kioskMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {kioskMode && mode === 'idle' && (
        <div className="mb-4 p-3 bg-green-50 rounded-xl text-sm text-green-700 text-center">
          키오스크 모드: 스캔 후 {AUTO_RESET_SEC}초 뒤 자동으로 카메라가 재시작됩니다.
        </div>
      )}

      {/* 결과 화면 */}
      {mode === 'result' && (
        <div className="space-y-4 animate-fade-in">
          {checkinLoading ? (
            <div className="rounded-2xl p-16 flex flex-col items-center gap-4 bg-gray-50">
              <LoadingSpinner size="lg" />
              <p className="text-gray-500 text-lg font-medium">확인 중...</p>
            </div>
          ) : result && statusCfg ? (
            <>
              <div className={`rounded-2xl p-10 text-center ${statusCfg.bg} relative overflow-hidden`}>
                {/* 카운트다운 링 */}
                <div className="absolute top-3 right-3">
                  <div className={`w-10 h-10 rounded-full border-4 border-white/30 flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${statusCfg.text}`}>{countdown}</span>
                  </div>
                </div>

                <statusCfg.icon className={`w-20 h-20 mx-auto mb-4 ${statusCfg.text}`} />
                <p className={`text-3xl font-bold mb-2 ${statusCfg.text}`}>{statusCfg.label}</p>
                <p className={`text-lg ${statusCfg.text} opacity-90`}>{result.message}</p>
                {result.name && (
                  <p className={`text-4xl font-bold mt-4 ${statusCfg.text}`}>{result.name} 님</p>
                )}
                {result.status === 'already_used' && result.checked_in_at && (
                  <p className={`mt-3 text-sm opacity-75 ${statusCfg.text}`}>
                    입장 시각: {new Date(result.checked_in_at).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>

              {/* 진행 바 */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 bg-[#006241] rounded-full transition-all"
                  style={{
                    width: `${(countdown / AUTO_RESET_SEC) * 100}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              <p className="text-center text-xs text-gray-400">{countdown}초 후 자동으로 {kioskMode ? '카메라 재시작' : '초기화'}</p>

              <button onClick={resetNow} className="btn-outline py-3">
                <RefreshCw className="w-4 h-4" />
                {kioskMode ? '지금 바로 다음 스캔' : '다음 QR 스캔'}
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* 스캔 화면 */}
      {mode === 'scanning' && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div id={scannerDivId} className="w-full" />
          </div>
          <p className="text-center text-sm text-gray-500">QR 코드를 카메라에 비춰주세요</p>
          <button onClick={async () => { await stopScanner(); setMode('idle'); }} className="btn-outline py-3">
            <CameraOff className="w-4 h-4" /> 스캔 중지
          </button>
        </div>
      )}

      {/* 대기 화면 */}
      {mode === 'idle' && (
        <div className="space-y-4">
          <button onClick={startScanner} className="btn-brand text-lg py-5">
            <Camera className="w-6 h-6" /> QR 카메라 스캔 시작
          </button>

          {cameraError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{cameraError}</p>
            </div>
          )}

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는 직접 입력</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleManual} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="QR 토큰 직접 입력"
                className="input-field pl-9"
              />
            </div>
            <button type="submit" disabled={manualLoading || !manualToken.trim()} className="btn-brand">
              {manualLoading ? <LoadingSpinner size="sm" color="white" /> : (
                <><LogIn className="w-5 h-5" /> 입장 확인</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
