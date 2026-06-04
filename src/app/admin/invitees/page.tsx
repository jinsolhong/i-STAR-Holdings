'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Upload, Download, Copy, RefreshCw,
  CheckCircle2, XCircle, Clock, LogIn, MoreVertical, Link2, X, Pencil, Trash2
} from 'lucide-react';
import Papa from 'papaparse';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Invitee } from '@/lib/types';
import { GRADES, type Grade } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

const rsvpBadge = (status: string) => {
  if (status === 'attending') return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />참석</span>;
  if (status === 'declined') return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />불참</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />미응답</span>;
};

interface Row extends Invitee { _open?: boolean; }
interface MenuPos { x: number; y: number; id: string; }

export default function InviteesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [phone4Search, setPhone4Search] = useState('');
  const [gradeFilter, setGradeFilter] = useState<Grade | ''>('');
  const [page, setPage] = useState(1);

  // 체크박스 선택
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));

  // 추가 모달
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addGrade, setAddGrade] = useState<Grade | ''>('');
  const [addPhone4, setAddPhone4] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // CSV
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMsg, setCsvMsg] = useState('');

  // 드롭다운 (fixed 포지션)
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 수정 모달
  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState<Grade | ''>('');
  const [editPhone4, setEditPhone4] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (phone4Search) params.set('phone4', phone4Search);
      if (gradeFilter) params.set('grade', gradeFilter);
      const res = await fetch(`/api/admin/invitees?${params}`);
      const d = await res.json();
      if (d.success) { setRows(d.data); setTotal(d.total); }
    } finally {
      setLoading(false);
    }
  }, [page, search, phone4Search, gradeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 드롭다운 열기 (버튼 위치 계산)
  const openMenu = (e: React.MouseEvent, id: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.right, y: rect.bottom, id });
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${APP_URL}/invite/${token}`);
    alert('초대 링크가 복사되었습니다.');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddLoading(true);
    const res = await fetch('/api/admin/invitees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addName, grade: addGrade || null, phone_last4: addPhone4 }),
    });
    const d = await res.json();
    if (d.success) { setAddOpen(false); setAddName(''); setAddGrade(''); setAddPhone4(''); fetchData(); }
    setAddLoading(false);
  };

  const parseRows = (raw: Record<string, string>[]) =>
    raw.map(r => ({
      name: r['이름'] ?? r['name'] ?? '',
      grade: r['등급'] ?? r['grade'] ?? '',
      phone_last4: r['전화번호뒤4자리'] ?? r['phone_last4'] ?? '',
      notes: r['메모'] ?? r['notes'] ?? '',
    }));

  const uploadRows = async (rows: ReturnType<typeof parseRows>) => {
    const res = await fetch('/api/admin/invitees/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const d = await res.json();
    setCsvMsg(d.success ? `${d.inserted}명 등록 완료` : d.error);
    setCsvLoading(false);
    fetchData();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true); setCsvMsg('');

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isXlsx) {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];

      // 전체 행 읽기 (1-indexed 배열)
      const allRows = utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });

      // 3행(index 2)이 헤더, 4행(index 3)부터 데이터
      const headers = (allRows[2] as string[]) ?? [];
      const dataRows = allRows.slice(3);

      const raw = dataRows
        .filter(row => (row as string[]).some(cell => String(cell).trim()))
        .map(row => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[String(h).trim()] = String((row as string[])[i] ?? '').trim();
          });
          return obj;
        });

      await uploadRows(parseRows(raw));
    } else {
      // CSV 파싱
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (result) => {
          await uploadRows(parseRows(result.data as Record<string, string>[]));
        },
      });
    }
    e.target.value = '';
  };

  const handlePatch = async (id: string, payload: object) => {
    setActionLoading(id);
    await fetch('/api/admin/invitees', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    setActionLoading(null); setMenu(null); fetchData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 님을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setMenu(null);
    await fetch(`/api/admin/invitees?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const openEdit = (row: Row) => {
    setEditTarget(row); setEditName(row.name);
    setEditGrade((row.grade as Grade) ?? ''); setEditPhone4(row.phone_last4 ?? '');
    setMenu(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    await fetch('/api/admin/invitees', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTarget.id, name: editName.trim(), grade: editGrade || null, phone_last4: editPhone4 || null }),
    });
    setEditLoading(false); setEditTarget(null); fetchData();
  };

  // 등급 일괄 지정
  const [bulkGradeOpen, setBulkGradeOpen] = useState(false);

  const bulkSetGrade = async (grade: Grade) => {
    const ids = Array.from(selected);
    await Promise.all(ids.map(id => fetch('/api/admin/invitees', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, grade }),
    })));
    setBulkGradeOpen(false);
    setSelected(new Set());
    fetchData();
  };

  // 일괄 액션
  const bulkAction = async (action: 'delete' | 'attending' | 'declined' | 'checkin' | 'reissue_qr') => {
    const ids = Array.from(selected);
    if (action === 'delete') {
      if (!confirm(`선택한 ${ids.length}명을 삭제하시겠습니까?`)) return;
      await Promise.all(ids.map(id => fetch(`/api/admin/invitees?id=${id}`, { method: 'DELETE' })));
    } else if (action === 'checkin') {
      await Promise.all(ids.map(id => fetch('/api/admin/invitees', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, checked_in: true }),
      })));
    } else if (action === 'reissue_qr') {
      if (!confirm(`선택한 ${ids.length}명의 QR을 재발급하시겠습니까?\n기존 QR은 사용 불가가 됩니다.`)) return;
      await Promise.all(ids.map(id => fetch('/api/admin/invitees', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reissue_qr: true }),
      })));
    } else {
      await Promise.all(ids.map(id => fetch('/api/admin/invitees', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rsvp_status: action }),
      })));
    }
    setSelected(new Set()); fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(rows.map(r => r.id)));
  };

  const totalPages = Math.ceil(total / 50);
  const menuRow = menu ? rows.find(r => r.id === menu.id) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">초대자 관리</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#006241] text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            <Plus className="w-4 h-4" /> 추가
          </button>
          <button onClick={() => csvRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            {csvLoading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />} CSV 업로드
          </button>
          <a href="/초대자_업로드_양식.xlsx" download className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" /> 업로드 양식
          </a>
          <a href="/api/admin/export" download className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" /> 전체 다운로드
          </a>
          <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvUpload} className="hidden" />
        </div>
      </div>

      {csvMsg && <p className={`mb-4 text-sm px-3 py-2 rounded-lg ${csvMsg.includes('완료') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{csvMsg}</p>}

      {/* 검색 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setSelected(new Set()); }}
          placeholder="이름 검색 (여러 명: 홍길동, 김철수, 이영희)"
          className="input-field py-2.5 sm:col-span-2"
        />
        <input
          type="tel"
          value={phone4Search}
          onChange={(e) => { setPhone4Search(e.target.value.replace(/\D/g, '').slice(0, 4)); setPage(1); }}
          placeholder="전화번호 뒤 4자리"
          className="input-field py-2.5"
          maxLength={4}
        />
      </div>
      {/* 검색 결과 전체 선택 버튼 */}
      {(search || phone4Search || gradeFilter) && rows.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">검색 결과 {rows.length}명</span>
          <button
            onClick={() => setSelected(new Set(rows.map(r => r.id)))}
            className="text-xs text-[#006241] font-medium hover:underline"
          >
            검색 결과 전체 선택
          </button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:underline">
              선택 해제
            </button>
          )}
        </div>
      )}

      {/* 등급 필터 */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => { setGradeFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            gradeFilter === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          전체
        </button>
        {GRADES.map((g) => (
          <button
            key={g}
            onClick={() => { setGradeFilter(g); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              gradeFilter === g ? 'bg-[#006241] text-white border-[#006241]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#006241]'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* 일괄 액션 바 */}
      {selected.size > 0 && (
        <div className="mb-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700">{selected.size}명 선택됨</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              {/* 등급 지정 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setBulkGradeOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
                >
                  등급 지정 ▾
                </button>
                {bulkGradeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkGradeOpen(false)} />
                    <div className="absolute left-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-32">
                      {GRADES.map(g => (
                        <button
                          key={g}
                          onClick={() => bulkSetGrade(g)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 font-medium"
                        >
                          <span className="text-xs font-bold text-[#006241] bg-green-50 px-1.5 py-0.5 rounded-full">{g}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => bulkAction('attending')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> 참석 처리
              </button>
              <button onClick={() => bulkAction('declined')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600">
                <XCircle className="w-3.5 h-3.5" /> 불참 처리
              </button>
              <button onClick={() => bulkAction('checkin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006241] text-white rounded-lg text-xs font-medium hover:bg-green-900">
                <LogIn className="w-3.5 h-3.5" /> 입장 처리
              </button>
              <button onClick={() => bulkAction('reissue_qr')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <RefreshCw className="w-3.5 h-3.5" /> QR 재발급
              </button>
              <button onClick={() => bulkAction('delete')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
                <Trash2 className="w-3.5 h-3.5" /> 일괄 삭제
              </button>
              <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                선택 해제
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-3">전체 {total.toLocaleString()}명</p>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left">이름</th>
              <th className="px-4 py-3 text-left">등급</th>
              <th className="px-4 py-3 text-left">전화 뒤4</th>
              <th className="px-4 py-3 text-left">참석여부</th>
              <th className="px-4 py-3 text-left">QR</th>
              <th className="px-4 py-3 text-left">입장</th>
              <th className="px-4 py-3 text-left">입장시간</th>
              <th className="px-4 py-3 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">데이터가 없습니다.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selected.has(row.id) ? 'bg-blue-50/40' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="rounded" />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3">
                  {row.grade
                    ? <span className="text-xs font-bold text-[#006241] bg-green-50 px-2 py-0.5 rounded-full">{row.grade}</span>
                    : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">{row.phone_last4 ?? '-'}</td>
                <td className="px-4 py-3">{rsvpBadge(row.rsvp_status)}</td>
                <td className="px-4 py-3">
                  {row.qr_token_raw ? <span className="text-xs text-green-600 font-medium">발급됨</span> : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3">
                  {row.checked_in ? <span className="inline-flex items-center gap-1 text-xs text-[#006241] font-medium"><LogIn className="w-3 h-3" />완료</span> : <span className="text-xs text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => openMenu(e, row.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-[#006241] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ─── 드롭다운 메뉴 (fixed 포지션) ─── */}
      {menu && menuRow && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-44"
            style={{ top: menu.y + 4, right: window.innerWidth - menu.x }}
          >
            <button onClick={() => openEdit(menuRow)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <Pencil className="w-4 h-4 text-blue-500" /> 정보 수정
            </button>
            <button onClick={() => copyLink(menuRow.invitation_token)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <Link2 className="w-4 h-4" /> 초대 링크 복사
            </button>
            <button onClick={() => handlePatch(menuRow.id, { rsvp_status: 'attending' })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> 참석으로 변경
            </button>
            <button onClick={() => handlePatch(menuRow.id, { rsvp_status: 'declined' })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <XCircle className="w-4 h-4 text-red-500" /> 불참으로 변경
            </button>
            {menuRow.rsvp_status === 'attending' && (
              <button onClick={() => handlePatch(menuRow.id, { reissue_qr: true })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <RefreshCw className="w-4 h-4 text-blue-500" /> QR 재발급
              </button>
            )}
            {!menuRow.checked_in && menuRow.rsvp_status === 'attending' && (
              <button onClick={() => handlePatch(menuRow.id, { checked_in: true })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <LogIn className="w-4 h-4 text-[#006241]" /> 입장 처리
              </button>
            )}
            {menuRow.checked_in && (
              <button onClick={() => handlePatch(menuRow.id, { checked_in: false })} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <X className="w-4 h-4" /> 입장 취소
              </button>
            )}
            <div className="border-t border-gray-100 my-1" />
            <button onClick={() => handleDelete(menuRow.id, menuRow.name)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
            {actionLoading === menuRow.id && <div className="flex justify-center py-2"><LoadingSpinner size="sm" /></div>}
          </div>
        </>
      )}

      {/* 추가 모달 */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-900 text-lg mb-4">초대자 추가</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {GRADES.map((g) => (
                    <button key={g} type="button" onClick={() => setAddGrade(g)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${addGrade === g ? 'bg-[#006241] text-white border-[#006241]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} className="input-field" placeholder="홍길동" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 뒤 4자리 (선택)</label>
                <input type="tel" value={addPhone4} onChange={(e) => setAddPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))} className="input-field" placeholder="0000" maxLength={4} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAddOpen(false)} className="btn-outline flex-1 py-3">취소</button>
                <button type="submit" disabled={addLoading} className="btn-brand flex-1 py-3">
                  {addLoading ? <LoadingSpinner size="sm" color="white" /> : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-900 text-lg mb-4">초대자 정보 수정</h2>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {GRADES.map((g) => (
                    <button key={g} type="button" onClick={() => setEditGrade(g)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${editGrade === g ? 'bg-[#006241] text-white border-[#006241]' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 뒤 4자리</label>
                <input type="tel" value={editPhone4} onChange={(e) => setEditPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))} className="input-field" placeholder="0000" maxLength={4} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="btn-outline flex-1 py-3">취소</button>
                <button type="submit" disabled={editLoading} className="btn-brand flex-1 py-3">
                  {editLoading ? <LoadingSpinner size="sm" color="white" /> : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
