'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle2, XCircle, Clock, LogIn } from 'lucide-react';
import type { DashboardStats } from '@/lib/types';

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCard[] = stats ? [
    { label: '전체 초대', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '참석 예정', value: stats.attending, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '불참 응답', value: stats.declined, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '미응답', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '현장 입장 완료', value: stats.checkedIn, icon: LogIn, color: 'text-[#006241]', bg: 'bg-green-50' },
  ] : [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">대시보드</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm skeleton h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.attending > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">참석률</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-16 flex-shrink-0">참석</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#006241] h-2 rounded-full transition-all"
                  style={{ width: `${(stats.attending / stats.total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-10 text-right">
                {Math.round((stats.attending / stats.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-16 flex-shrink-0">입장</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all"
                  style={{ width: `${stats.attending > 0 ? (stats.checkedIn / stats.attending) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-10 text-right">
                {stats.attending > 0 ? Math.round((stats.checkedIn / stats.attending) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
