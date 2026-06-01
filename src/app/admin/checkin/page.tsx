'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Search, CheckCircle2, XCircle, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { CheckinResult } from '@/lib/types';

type ScanMode = 'idle' | 'scanning' | 'result';
type ResultStatus = CheckinResult['status'] | null;

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  success:      { bg: 'bg-green-500',  text: 'text-white', icon: CheckCircle2, label: '입장 가능' },
  already_used: { bg: 'bg-orange-500', text: 'text-white', icon: XCircle,      label: '이미 입장됨' },
  invalid:      { bg: 'bg-red-600',    text: 'text-white', icon: XCircle,      label: '유효하지 않음' },
  not_attending:{ bg: 'bg-yellow-400', text: 'text-gray-900', icon: AlertTriangle, label: '참석 미신청' },
  locked:       { bg: 'bg-gray-400',   text: 'text-white', icon: RefreshCw,    label: '처리 중' },
};

export default function CheckinPage() {
  const [mode, setMode] = useState<ScanMode>('idle');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-div';

  const stopScanner = useCallback(async () => {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop().catch(() => {});
      qrRef.current.clear();
    }
  }, []);

  const handleQrResult = useCallback(async (decodedText: string) => {
    await stopScanner();
    setMode('result');
    await doCheckin(decodedText);
  }, [stopScanner]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanner = async () => {
    setCameraError('');
    setMode('scanning');
    setResult(null);
    setConfirmed(false);

    setTimeout(async () => {
      try {
        qrRef.current = new Html5Qrcode(scannerDivId);
        await qrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleQrResult,
          () => {}
        );
      } catch {
        setCameraError('카메라 접근이 거부되었습니다. 직접 토큰을 입력해 주세요.');
        setMode('idle');
      }
    }, 300);
  };

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

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setManualLoading(true);
    setMode('result');
    await doCheckin(manualToken.trim());
    setManualLoading(false);
  };

  const reset = async () => {
    await stopScanner();
    setMode('idle');
    setResult(null);
    setManualToken('');
    setConfirmed(false);
  };

  useEffect(() => { return () => { stopScanner(); }; }, [stopScanner]);

  const statusCfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">현장 QR 체크인</h1>

      {/* 결과 화면 */}
      {mode === 'result' && (
        <div className="space-y-4 animate-fade-in">
          {checkinLoading ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-sm border border-gray-100">
              <LoadingSpinner size="lg" />
              <p className="text-gray-500">확인 중...</p>
            </div>
          ) : result && statusCfg ? (
            <>
              <div className={`rounded-2xl p-8 text-center ${statusCfg.bg}`}>
                <statusCfg.icon className={`w-16 h-16 mx-auto mb-3 ${statusCfg.text}`} />
                <p className={`text-2xl font-bold ${statusCfg.text}`}>{statusCfg.label}</p>
                <p className={`mt-2 text-lg font-semibold ${statusCfg.text}`}>{result.message}</p>
                {result.name && (
                  <p className={`text-3xl font-bold mt-3 ${statusCfg.text}`}>{result.name} 님</p>
                )}
                {result.status === 'already_used' && result.checked_in_at && (
                  <p className={`mt-2 text-sm opacity-80 ${statusCfg.text}`}>
                    입장 시각: {new Date(result.checked_in_at).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>

              {/* not_attending: 참석 처리 후 입장 옵션 */}
              {result.status === 'not_attending' && !confirmed && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <p className="text-sm text-gray-600 text-center">관리자 확인 후 참석 처리하고 입장할 수 있습니다.</p>
                  <button
                    onClick={async () => {
                      // 수동으로 rsvp + checkin 처리는 관리자 페이지에서
                      setConfirmed(true);
                    }}
                    className="btn-brand py-3"
                  >
                    참석 처리 후 입장 (관리자 확인)
                  </button>
                </div>
              )}

              <button onClick={reset} className="btn-outline py-3">
                <RefreshCw className="w-4 h-4" /> 다음 QR 스캔
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
          <button onClick={reset} className="btn-outline py-3">
            <CameraOff className="w-4 h-4" /> 스캔 중지
          </button>
        </div>
      )}

      {/* 대기 화면 */}
      {mode === 'idle' && (
        <div className="space-y-4">
          <button onClick={startScanner} className="btn-brand">
            <Camera className="w-5 h-5" /> QR 카메라 스캔
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
