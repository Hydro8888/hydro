'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  trustScore: number;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  USER: 'bg-gray-50 text-gray-700',
  HELPER: 'bg-blue-50 text-blue-700',
  ADMIN: 'bg-red-50 text-red-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/simburum/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  async function handleUpdateRole(userId: string, role: string) {
    setActionLoading(userId + '-role');
    try {
      await fetch('/simburum/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      await fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  async function handleToggleBan(userId: string, currentlyVerified: boolean) {
    setActionLoading(userId + '-ban');
    try {
      await fetch('/simburum/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verified: !currentlyVerified }),
      });
      await fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">사용자 관리</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
          <Button onClick={fetchUsers} variant="secondary" size="sm">검색</Button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">전체 역할</option>
          <option value="USER">사용자</option>
          <option value="HELPER">헬퍼</option>
          <option value="ADMIN">관리자</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">사용자</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">역할</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">인증</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">신뢰</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">가입일</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.verified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {u.verified ? '인증됨' : '미인증'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{u.trustScore.toFixed(0)}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDate(new Date(u.createdAt))}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        disabled={actionLoading === u.id + '-role'}
                      >
                        <option value="USER">USER</option>
                        <option value="HELPER">HELPER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <Button
                        size="sm"
                        variant={u.verified ? 'danger' : 'secondary'}
                        onClick={() => handleToggleBan(u.id, u.verified)}
                        loading={actionLoading === u.id + '-ban'}
                      >
                        {u.verified ? '정지' : '복구'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">사용자가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
