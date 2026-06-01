import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { name, phone4, invitationToken } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ status: 'error', error: '이름을 입력해 주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 개인 링크(invitation_token)로 진입한 경우 → 토큰으로 직접 조회
  if (invitationToken) {
    const { data, error } = await supabase
      .from('invitees')
      .select('id, name, rsvp_status')
      .eq('invitation_token', invitationToken)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: 'not_found' });
    }
    return NextResponse.json({ status: 'ok', invitee_id: data.id, name: data.name });
  }

  // 공용 링크: 이름으로 조회
  const { data: rows, error } = await supabase
    .from('invitees')
    .select('id, name, phone_last4, rsvp_status')
    .ilike('name', name.trim());

  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ status: 'not_found' });
  }

  // 정확히 1명인 경우
  if (rows.length === 1) {
    // phone_last4가 등록된 경우, 입력된 phone4와 비교
    if (rows[0].phone_last4 && phone4 && rows[0].phone_last4 !== phone4) {
      return NextResponse.json({ status: 'phone_mismatch' });
    }
    return NextResponse.json({ status: 'ok', invitee_id: rows[0].id, name: rows[0].name });
  }

  // 동명이인: phone4 미입력 시 요청
  if (!phone4) {
    return NextResponse.json({ status: 'ambiguous' });
  }

  // phone4 입력된 경우 대조
  const matched = rows.filter((r) => r.phone_last4 === phone4);
  if (matched.length === 0) {
    return NextResponse.json({ status: 'phone_mismatch' });
  }
  if (matched.length === 1) {
    return NextResponse.json({ status: 'ok', invitee_id: matched[0].id, name: matched[0].name });
  }
  // 그래도 여럿이면 (희귀 케이스)
  return NextResponse.json({ status: 'not_found' });
}
