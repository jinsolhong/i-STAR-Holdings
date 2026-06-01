import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id 필요' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('invitees')
    .select('id, name, rsvp_status, qr_token_raw')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: '대상자를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
