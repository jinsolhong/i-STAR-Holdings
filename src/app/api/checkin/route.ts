import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';
import type { CheckinResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  // 관리자 인증 확인
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { qr_token } = await req.json();
  if (!qr_token?.trim()) {
    return NextResponse.json({ success: false, error: 'QR 토큰이 필요합니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 원자적 체크인 처리 (DB 함수 호출)
  const { data, error } = await supabase.rpc('atomic_checkin', {
    p_qr_token: qr_token.trim(),
  });

  if (error) {
    console.error('checkin rpc error:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }

  const result = data as CheckinResult;

  // 성공 시 체크인 로그 기록
  if (result.status === 'success' && result.invitee_id) {
    await supabase.from('checkin_logs').insert({
      invitee_id: result.invitee_id,
      action: 'checked_in',
      admin_user_id: session.userId,
      note: 'QR 스캔 입장',
    });
  }

  return NextResponse.json({ success: true, result });
}

// QR 토큰으로 참석자 조회 (스캔 전 미리보기)
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'token 필요' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('invitees')
    .select('id, name, rsvp_status, checked_in, checked_in_at')
    .eq('qr_token_raw', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: '해당 QR 코드를 찾을 수 없습니다.' });
  }

  return NextResponse.json({ success: true, data });
}
