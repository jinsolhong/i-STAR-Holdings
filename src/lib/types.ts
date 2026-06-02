export type RsvpStatus = 'pending' | 'attending' | 'declined';
export type Grade = '0STAR' | '1STAR' | '2STAR' | '3STAR' | '4STAR' | '5STAR' | 'STAFF';
export const GRADES: Grade[] = ['0STAR','1STAR','2STAR','3STAR','4STAR','5STAR','STAFF'];

export interface Invitee {
  id: string;
  name: string;
  grade: Grade | null;
  phone_last4: string | null;
  invitation_token: string;
  qr_token_hash: string | null;
  qr_token_raw: string | null;
  rsvp_status: RsvpStatus;
  checked_in: boolean;
  checked_in_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'checkin_staff';
  created_at: string;
}

export interface CheckinLog {
  id: string;
  invitee_id: string;
  action: 'checked_in' | 'reverted' | 'rsvp_override';
  admin_user_id: string | null;
  note: string | null;
  created_at: string;
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CheckinResult {
  status: 'success' | 'already_used' | 'invalid' | 'not_attending' | 'locked';
  message: string;
  name?: string;
  invitee_id?: string;
  checked_in_at?: string;
  rsvp_status?: RsvpStatus;
}

export interface DashboardStats {
  total: number;
  attending: number;
  declined: number;
  pending: number;
  checkedIn: number;
}
