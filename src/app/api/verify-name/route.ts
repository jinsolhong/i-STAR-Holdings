import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { name, grade, phone4, invitationToken } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ status: 'error', error: '이름을 입력해 주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 개인 링크(invitation_token)로 진입한 경우
  if (invitationToken) {
    const { data, error } = await supabase
      .from('invitees')
      .select('id, name, grade, rsvp_status')
      .eq('invitation_token', invitationToken)
      .limit(1);

    if (error || !data?.[0]) {
      return NextResponse.json({ status: 'not_found' });
    }
    return NextResponse.json({ status: 'ok', invitee_id: data[0].id, name: data[0].name });
  }

  // 이름 + 등급으로 조회
  let query = supabase
    .from('invitees')
    .select('id, name, grade, phone_last4, rsvp_status')
    .ilike('name', name.trim());

  if (grade) {
    query = query.eq('grade', grade);
  }

  const { data: rows, error } = await query;

  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ status: 'not_found' });
  }

  // 정확히 1명
  if (rows.length === 1) {
    if (rows[0].phone_last4 && phone4 && rows[0].phone_last4 !== phone4) {
      return NextResponse.json({ status: 'phone_mismatch' });
    }
    return NextResponse.json({ status: 'ok', invitee_id: rows[0].id, name: rows[0].name });
  }

  // 동명이인 (같은 등급에도 동명이인): phone4 요청
  if (!phone4) {
    return NextResponse.json({ status: 'ambiguous' });
  }

  const matched = rows.filter((r) => r.phone_last4 === phone4);
  if (matched.length === 0) return NextResponse.json({ status: 'phone_mismatch' });
  if (matched.length === 1) return NextResponse.json({ status: 'ok', invitee_id: matched[0].id, name: matched[0].name });

  return NextResponse.json({ status: 'not_found' });
}
