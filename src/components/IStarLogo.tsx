'use client';

interface Props {
  size?: number;
  className?: string;
}

export default function IStarLogo({ size = 48, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 초록 원 - 상단 */}
      <circle cx="58" cy="14" r="13" fill="#5BBF8A" />
      {/* 파란 막대 왼쪽 (살짝 기울어짐) */}
      <rect
        x="18" y="28" width="22" height="58" rx="11"
        fill="#1A2C8A"
        transform="rotate(-8 29 57)"
      />
      {/* 파란 막대 오른쪽 */}
      <rect
        x="48" y="24" width="22" height="58" rx="11"
        fill="#1A2C8A"
        transform="rotate(-8 59 53)"
      />
      {/* 초록 원 - 하단 우측 */}
      <circle cx="82" cy="84" r="11" fill="#5BBF8A" />
    </svg>
  );
}
