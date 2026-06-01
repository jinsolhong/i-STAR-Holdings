import AdminNav from '@/components/admin/AdminNav';

// 인증 체크는 middleware.ts에서만 처리합니다.
// 이 레이아웃은 /admin/login을 제외한 모든 admin 페이지에 네비게이션을 추가합니다.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
