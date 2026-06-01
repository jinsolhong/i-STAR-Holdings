-- ============================================================
-- i-STAR 3주년 행사 초대장 — Supabase 데이터베이스 스키마
-- ============================================================
-- 실행 방법: Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 > Run
-- ============================================================

-- UUID 생성 확장 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. invitees (초대 대상자)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitees (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  phone_last4       TEXT,                           -- 동명이인 구분용 뒤 4자리
  invitation_token  TEXT        NOT NULL UNIQUE,    -- 개인별 초대 링크 토큰
  qr_token_hash     TEXT        UNIQUE,             -- QR 코드에 담긴 토큰의 해시값
  qr_token_raw      TEXT        UNIQUE,             -- QR 코드 원본 토큰 (서버에서만 사용)
  rsvp_status       TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (rsvp_status IN ('pending','attending','declined')),
  checked_in        BOOLEAN     NOT NULL DEFAULT FALSE,
  checked_in_at     TIMESTAMPTZ,
  notes             TEXT,                           -- 관리자 메모
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER invitees_updated_at
  BEFORE UPDATE ON public.invitees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. admin_users (관리자 계정)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'admin'
                            CHECK (role IN ('super_admin','admin','checkin_staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. checkin_logs (입장 처리 기록)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkin_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invitee_id    UUID        NOT NULL REFERENCES public.invitees(id) ON DELETE CASCADE,
  action        TEXT        NOT NULL
                            CHECK (action IN ('checked_in','reverted','rsvp_override')),
  admin_user_id UUID        REFERENCES public.admin_users(id),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 인덱스
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invitees_name            ON public.invitees(name);
CREATE INDEX IF NOT EXISTS idx_invitees_invitation_token ON public.invitees(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitees_qr_token_raw    ON public.invitees(qr_token_raw);
CREATE INDEX IF NOT EXISTS idx_invitees_rsvp_status     ON public.invitees(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_invitee_id  ON public.checkin_logs(invitee_id);

-- ────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────

-- invitees: anon은 invitation_token으로만 자신의 행을 조회 가능
ALTER TABLE public.invitees ENABLE ROW LEVEL SECURITY;

-- 서비스 롤은 전체 접근 허용 (API Route에서 service_role key 사용)
CREATE POLICY "service_role_all" ON public.invitees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- anon은 invitation_token이 일치할 때만 SELECT 허용
CREATE POLICY "anon_select_by_token" ON public.invitees
  FOR SELECT
  TO anon
  USING (false);   -- 실제 조회는 모두 서버 API(service_role)를 통해 수행

-- admin_users: service_role만 접근
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_admin" ON public.admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- checkin_logs: service_role만 접근
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_logs" ON public.checkin_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- QR 체크인 원자적 업데이트 함수
-- 동시 스캔 시 딱 한 번만 처리되도록 FOR UPDATE SKIP LOCKED 사용
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.atomic_checkin(p_qr_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitee public.invitees%ROWTYPE;
  v_result  JSON;
BEGIN
  -- 해당 QR 토큰을 가진 행을 잠금
  SELECT * INTO v_invitee
  FROM public.invitees
  WHERE qr_token_raw = p_qr_token
  FOR UPDATE SKIP LOCKED;

  -- 레코드 없음 (토큰 잠금 실패 포함)
  IF NOT FOUND THEN
    -- 잠금 없이 다시 조회하여 존재 여부 확인
    SELECT * INTO v_invitee FROM public.invitees WHERE qr_token_raw = p_qr_token;
    IF NOT FOUND THEN
      RETURN json_build_object('status','invalid','message','유효하지 않은 초대권입니다.');
    ELSE
      -- 동시 요청으로 잠금 획득 실패 → 이미 처리 중
      RETURN json_build_object('status','locked','message','처리 중입니다. 잠시 후 다시 시도해 주세요.');
    END IF;
  END IF;

  -- 참석 신청 확인
  IF v_invitee.rsvp_status != 'attending' THEN
    RETURN json_build_object(
      'status', 'not_attending',
      'message', '참석 신청을 완료하지 않은 초대권입니다.',
      'name', v_invitee.name,
      'rsvp_status', v_invitee.rsvp_status
    );
  END IF;

  -- 이미 입장 처리됨
  IF v_invitee.checked_in THEN
    RETURN json_build_object(
      'status', 'already_used',
      'message', '이미 입장 처리된 초대권입니다.',
      'name', v_invitee.name,
      'checked_in_at', v_invitee.checked_in_at
    );
  END IF;

  -- 입장 처리
  UPDATE public.invitees
  SET checked_in = TRUE, checked_in_at = NOW()
  WHERE id = v_invitee.id;

  RETURN json_build_object(
    'status', 'success',
    'message', '입장이 확인되었습니다.',
    'name', v_invitee.name,
    'invitee_id', v_invitee.id
  );
END;
$$;
