import { randomBytes, createHash } from 'crypto';

/** 추측 불가능한 무작위 토큰 생성 */
export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/** 토큰을 SHA-256으로 해시 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 토큰 마지막 N자리만 추출 (화면 표시용) */
export function maskToken(token: string, showLast = 6): string {
  return '···' + token.slice(-showLast).toUpperCase();
}
