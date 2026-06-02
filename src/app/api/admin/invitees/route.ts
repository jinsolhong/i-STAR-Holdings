import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';
import { generateToken, hashToken } from '@/lib/tokens';
import { v4 as uuidv4 } from 'uuid';

// 목록 조회 + 검색
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const search = req.nextUrl.searchParams.get('search') ?? '';
  const phone4 = req.nextUrl.searchParams.get('phone4') ?? '';
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from('invitees')
    .select('id, name, phone_last4, invitation_token, rsvp_status, checked_in, checked_in_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (phone4) query = query.eq('phone_last4', phone4);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data, total: count ?? 0 });
}

// 단일 초대자 추가
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const { name, grade, phone_last4, notes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ success: false, error: '이름 필요' }, { status: 400 });

  const supabase = createServiceClient();
  const invitationToken = generateToken(24);
  const { data, error } = await supabase
    .from('invitees')
    .insert({
      id: uuidv4(),
      name: name.trim(),
      grade: grade || null,
      phone_last4: phone_last4?.trim() || null,
      invitation_token: invitationToken,
      notes: notes ?? null,
    })
    .select('id, name, invitation_token')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// 참석자 상태 수정
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const { id, rsvp_status, checked_in, reissue_qr, notes } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: 'id 필요' }, { status: 400 });

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (rsvp_status !== undefined) updates.rsvp_status = rsvp_status;
  if (checked_in !== undefined) {
    updates.checked_in = checked_in;
    if (checked_in) updates.checked_in_at = new Date().toISOString();
    else updates.checked_in_at = null;
  }
  if (notes !== undefined) updates.notes = notes;

  // QR 재발급
  if (reissue_qr) {
    const newToken = generateToken(32);
    updates.qr_token_raw = newToken;
    updates.qr_token_hash = hashToken(newToken);
    // 재발급 시 체크인 초기화
    updates.checked_in = false;
    updates.checked_in_at = null;
  }

  const { error } = await supabase.from('invitees').update(updates).eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // 로그 기록
  if (checked_in !== undefined || reissue_qr) {
    await supabase.from('checkin_logs').insert({
      invitee_id: id,
      action: reissue_qr ? 'reverted' : checked_in ? 'checked_in' : 'reverted',
      admin_user_id: session.userId,
      note: reissue_qr ? '관리자 QR 재발급' : `관리자 수동 ${checked_in ? '입장 처리' : '입장 취소'}`,
    });
  }

  return NextResponse.json({ success: true });
}
