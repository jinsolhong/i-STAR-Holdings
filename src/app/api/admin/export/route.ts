import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('invitees')
    .select('name, phone_last4, rsvp_status, checked_in, checked_in_at, created_at')
    .order('created_at');

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const rsvpLabel = (s: string) =>
    s === 'attending' ? '참석' : s === 'declined' ? '불참' : '미응답';

  const rows = [
    ['이름', '전화번호 뒤4자리', '참석여부', '현장입장', '입장시간', '등록일시'],
    ...data.map((r) => [
      r.name,
      r.phone_last4 ?? '',
      rsvpLabel(r.rsvp_status),
      r.checked_in ? '완료' : '-',
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('ko-KR') : '-',
      new Date(r.created_at).toLocaleString('ko-KR'),
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const bom = '﻿'; // 엑셀 한글 깨짐 방지

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="istar-invitees-${Date.now()}.csv"`,
    },
  });
}
