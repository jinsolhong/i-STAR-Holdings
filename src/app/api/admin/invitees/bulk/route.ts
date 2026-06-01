import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/auth';
import { generateToken } from '@/lib/tokens';
import { v4 as uuidv4 } from 'uuid';

interface CsvRow {
  name: string;
  phone_last4?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });

  const { rows }: { rows: CsvRow[] } = await req.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, error: '데이터가 없습니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const inserts = rows
    .filter((r) => r.name?.trim())
    .map((r) => ({
      id: uuidv4(),
      name: r.name.trim(),
      phone_last4: r.phone_last4?.trim() || null,
      invitation_token: generateToken(24),
      notes: r.notes?.trim() || null,
    }));

  const { data, error } = await supabase
    .from('invitees')
    .insert(inserts)
    .select('id, name');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: data?.length ?? 0 });
}
