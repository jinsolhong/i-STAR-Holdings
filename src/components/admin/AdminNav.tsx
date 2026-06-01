'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, QrCode, LogOut } from 'lucide-react';
import IStarLogo from '@/components/IStarLogo';

const links = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/invitees', label: '초대자 관리', icon: Users },
  { href: '/admin/checkin', label: 'QR 체크인', icon: QrCode },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <IStarLogo size={28} />
          <span className="font-bold text-gray-900 text-sm hidden sm:block">i-STAR 관리자</span>
        </div>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-green-50 text-[#006241]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">로그아웃</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
