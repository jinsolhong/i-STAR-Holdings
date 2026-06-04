'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { EVENT_CONFIG } from '@/config/event';

interface Props {
  onSlideChange?: (index: number) => void;
}

export default function InvitationSlider({ onSlideChange }: Props) {
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoBlocked, setVideoBlocked] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const slides = 2; // 0: 이미지, 1: 영상

  // 다음 슬라이드로 이동
  const goNext = useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % slides;
      onSlideChange?.(next);
      return next;
    });
  }, [onSlideChange]);

  const goTo = useCallback((idx: number, resetTimer = false) => {
    setCurrent(idx);
    onSlideChange?.(idx);
    if (resetTimer) {
      // 사용자가 직접 조작 시 타이머 초기화 (영상 슬라이드면 타이머 없음)
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (idx !== 1) {
        // 이미지 슬라이드면 5초 후 자동 넘김
        autoTimer.current = setTimeout(goNext, 5000);
      }
      // 영상 슬라이드면 onEnded에서 처리
    }
  }, [onSlideChange, goNext]);

  // 초기 자동 슬라이딩: 이미지 슬라이드 5초 후 영상으로
  useEffect(() => {
    autoTimer.current = setTimeout(goNext, 5000);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 영상 슬라이드가 보이면 자동 재생, 나가면 정지
  useEffect(() => {
    if (current === 1 && videoRef.current) {
      // 타이머 정지 (영상 끝날 때까지 슬라이드 안 넘김)
      if (autoTimer.current) clearTimeout(autoTimer.current);
      const video = videoRef.current;
      video.muted = true;
      video.currentTime = 0;
      video.play().then(() => {
        setVideoBlocked(false);
      }).catch(() => {
        setVideoBlocked(true);
      });
    } else if (current !== 1 && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [current]);

  // 영상이 끝나면 이미지 슬라이드로 돌아가고 5초 타이머 재시작
  const handleVideoEnded = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setCurrent(0);
    onSlideChange?.(0);
    autoTimer.current = setTimeout(goNext, 5000);
  }, [onSlideChange, goNext]);

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 8) isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    const next = dx < 0
      ? Math.min(current + 1, slides - 1)
      : Math.max(current - 1, 0);
    if (next !== current) goTo(next, true);
  };

  const handleVideoPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setVideoBlocked(false);
      } catch { /* ignore */ }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="w-full">
      {/* 슬라이더 */}
      <div
        className="slider-container overflow-hidden"
        style={{ aspectRatio: '3/4' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="slider-track"
          style={{ transform: `translateX(-${current * 100}%)`, height: '100%' }}
        >
          {/* 슬라이드 1: 초대장 이미지 */}
          <div className="slider-slide h-full relative bg-gray-100">
            <Image
              src={EVENT_CONFIG.invitationCardImage}
              alt="i-STAR 3주년 초대장"
              fill
              className="object-cover"
              priority
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 -z-10">
              <div className="text-center px-8">
                <p className="text-[#006241] text-2xl font-bold mb-2">i-STAR</p>
                <p className="text-gray-500 text-sm">초대장 이미지를 교체해 주세요</p>
                <p className="text-gray-400 text-xs mt-1">public/assets/invitation-card.jpg</p>
              </div>
            </div>
          </div>

          {/* 슬라이드 2: 초대 영상 */}
          <div className="slider-slide h-full relative bg-black">
            <video
              ref={videoRef}
              src={EVENT_CONFIG.invitationVideo}
              muted
              playsInline
              loop={false}
              className="w-full h-full object-contain"
              style={{ backgroundColor: '#000' }}
              onError={() => setVideoBlocked(true)}
              onEnded={handleVideoEnded}
            />

            {/* 재생 차단 시 버튼 */}
            {videoBlocked && (
              <button
                onClick={handleVideoPlay}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-7 h-7 fill-white text-white ml-1" />
                </div>
                <span className="text-sm font-medium">영상 재생</span>
              </button>
            )}

            {/* 음소거 해제 버튼 */}
            {current === 1 && (
              <button
                onClick={toggleMute}
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
                aria-label={muted ? '소리 켜기' : '소리 끄기'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 -z-10">
              <div className="text-center px-8">
                <p className="text-white text-2xl font-bold mb-2">i-STAR</p>
                <p className="text-gray-400 text-sm">초대 영상을 교체해 주세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 인디케이터 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {Array.from({ length: slides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, true)}
            className={`indicator-dot transition-all ${i === current ? 'active' : ''}`}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
