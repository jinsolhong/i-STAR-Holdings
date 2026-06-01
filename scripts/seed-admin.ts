/**
 * 최초 관리자 계정 생성 스크립트
 * 실행: npx tsx scripts/seed-admin.ts
 *
 * 실행 전 .env 파일이 있어야 합니다.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
// 프로젝트 루트의 .env 파일 로드
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const email = process.env.ADMIN_EMAIL ?? 'admin@i-star.com';
const password = process.env.ADMIN_PASSWORD ?? 'ChangeThisPassword123!';

if (!url || !key) {
  console.error('❌ 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from('admin_users')
    .upsert({ id: randomUUID(), email, password_hash: hash, role: 'super_admin' }, { onConflict: 'email' })
    .select('id, email, role')
    .single();

  if (error) {
    console.error('❌ 관리자 계정 생성 실패:', error.message);
    process.exit(1);
  }
  console.log('✅ 관리자 계정 생성/갱신 완료:', data);
}

main();
