import { createClient } from '@supabase/supabase-js';

/**
 * 서버 전용 Supabase 클라이언트 (Service Role)
 * RLS를 우회하여 모든 데이터에 접근합니다.
 * API Route / Server Actions에서만 사용하세요.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * 공개 Supabase 클라이언트 (Anon Key)
 * 클라이언트 컴포넌트에서 사용합니다.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  return createClient(url, key);
}
