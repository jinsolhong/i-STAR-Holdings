import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyPassword, signAdminToken, setAdminSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, error: '이메일과 비밀번호를 입력해 주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash, role')
    .eq('email', email.toLowerCase().trim())
    .limit(1);

  const admin = rows?.[0] ?? null;

  console.log('[login] email:', email.toLowerCase().trim());
  console.log('[login] db error:', error?.message ?? 'none');
  console.log('[login] admin found:', !!admin);

  if (error || !admin) {
    return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.password_hash);
  console.log('[login] password valid:', valid);
  if (!valid) {
    return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const token = await signAdminToken(admin.id, admin.role);
  await setAdminSessionCookie(token);

  return NextResponse.json({ success: true, role: admin.role });
}
