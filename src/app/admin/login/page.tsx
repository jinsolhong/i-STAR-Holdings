'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import IStarLogo from '@/components/IStarLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error ?? '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <IStarLogo size={56} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">i-STAR 관리자</h1>
          <p className="text-sm text-gray-500 mt-1">관리자 계정으로 로그인하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingRight: '3rem' }}
                placeholder="비밀번호"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                className="text-gray-400"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-brand">
            {loading ? <LoadingSpinner size="sm" color="white" /> : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
