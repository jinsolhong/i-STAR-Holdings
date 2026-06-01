import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('invitees')
    .select('rsvp_status, checked_in');

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const stats = {
    total: data.length,
    attending: data.filter((r) => r.rsvp_status === 'attending').length,
    declined: data.filter((r) => r.rsvp_status === 'declined').length,
    pending: data.filter((r) => r.rsvp_status === 'pending').length,
    checkedIn: data.filter((r) => r.checked_in).length,
  };

  return NextResponse.json({ success: true, data: stats });
}
