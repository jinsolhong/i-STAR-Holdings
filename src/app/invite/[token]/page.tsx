import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: { token: string };
}

/**
 * 개인별 초대 링크: /invite/[invitation_token]
 * - invitation_token으로 대상자를 조회
 * - 이름을 URL에 직접 노출하지 않고 쿼리로 전달 (n=이름, t=토큰)
 * - 홈 페이지에서 자동으로 이름이 채워짐
 */
export default async function InvitePage({ params }: Props) {
  const { token } = params;

  if (!token) {
    redirect('/?error=invalid_token');
  }

  try {
    const supabase = createServiceClient();
    const { data: invitee, error } = await supabase
      .from('invitees')
      .select('id, name, rsvp_status')
      .eq('invitation_token', token)
      .single();

    if (error || !invitee) {
      redirect('/?error=invalid_token');
    }

    // 이미 참석 신청한 경우 → 초대장 페이지로 바로 이동하도록
    // (세션에 invitee_id 저장은 클라이언트에서만 가능하므로 홈을 경유)
    const nameEncoded = encodeURIComponent(invitee.name);
    redirect(`/?n=${nameEncoded}&t=${token}`);

  } catch {
    redirect('/?error=server_error');
  }
}
