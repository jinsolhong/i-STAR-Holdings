import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateToken, hashToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  const { invitee_id, status } = await req.json();

  if (!invitee_id || !['attending', 'declined'].includes(status)) {
    return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 현재 상태 확인
  const { data: current, error: fetchErr } = await supabase
    .from('invitees')
    .select('id, rsvp_status, qr_token_raw')
    .eq('id', invitee_id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ success: false, error: '대상자를 찾을 수 없습니다.' }, { status: 404 });
  }

  let qr_token: string | null = current.qr_token_raw;

  // 참석으로 변경 시 QR 토큰 생성 (아직 없는 경우)
  if (status === 'attending' && !qr_token) {
    qr_token = generateToken(32);
    const qr_token_hash = hashToken(qr_token);

    const { error: updateErr } = await supabase
      .from('invitees')
      .update({ rsvp_status: status, qr_token_raw: qr_token, qr_token_hash })
      .eq('id', invitee_id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: '저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
  } else {
    // 상태만 변경
    const { error: updateErr } = await supabase
      .from('invitees')
      .update({ rsvp_status: status })
      .eq('id', invitee_id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: '저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    qr_token: status === 'attending' ? qr_token : null,
  });
}
