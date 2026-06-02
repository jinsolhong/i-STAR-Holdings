/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           i-STAR 행사 설정 파일                           ║
 * ║  이 파일에서 행사 정보, 이미지 경로 등을 모두 수정하세요.  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export const EVENT_CONFIG = {
  // ── 행사 기본 정보 ──────────────────────────────────────────
  name: 'i-STAR 3주년 행사',
  nameShort: 'i-STAR',
  anniversary: '3주년',

  // ── 날짜 / 시간 ─────────────────────────────────────────────
  date: '2026년 6월 28일(일)',
  dateDisplay: '2026. 06. 28. SUN',
  time: '오후 2시',
  dateTimeISO: '2026-06-28T14:00:00+09:00',

  // ── 장소 ────────────────────────────────────────────────────
  venue: '그랜드 인터컨티넨탈 서울 파르나스',
  venueFloor: '5층',
  venueAddress: '서울특별시 강남구 테헤란로 521',
  // 지도 링크: 카카오맵, 네이버맵, 구글맵 URL을 여기에 넣으세요
  mapUrl: 'https://naver.me/GPxJ2bSf',

  // ── 슬로건 ──────────────────────────────────────────────────
  slogan1: '뜻을 잇고 세상을 잇다.',
  slogan2: '본이 되고 꿈이 되다.',
  sloganEn: 'From Connection to Dream',

  // ── 안내 문구 ────────────────────────────────────────────────
  greetingLine1: '안녕하세요. i-STAR 입니다.',
  greetingLine2: 'i-STAR의 3주년 행사에 당신을 초대합니다.',
  rsvpQuestion: 'i-STAR의 3주년을 함께 축하해 주시겠어요?',

  // ── 이미지 / 영상 경로 ───────────────────────────────────────
  // ※ public/assets/ 폴더에 해당 파일을 넣으세요.
  invitationCardImage: '/assets/invitation-card.jpg',
  invitationVideo: 'https://wcbkgwijkkjkycsltnlv.supabase.co/storage/v1/object/public/assets/invitation-video.mp4',
  invitationVideoPoster: '/assets/invitation-video-poster.jpg',

  // ── 브랜드 컬러 ─────────────────────────────────────────────
  brandColor: '#006241',

  // ── 문의처 ──────────────────────────────────────────────────
  contactInfo: '담당자에게 문의해 주세요.',
} as const;

export type EventConfig = typeof EVENT_CONFIG;
