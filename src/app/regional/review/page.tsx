'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Types
interface ReviewItem {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelCode: string;
  regionId: string;
  regionName: string;
  businessDate: string;
  submittedAt: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';
  revenue: {
    totalRevenue: number;
  } | null;
  calculationResult: {
    totalRevenue: number;
    totalCost: number;
    gop: number;
    gopRate: number;
    isRevenueAnomaly: boolean;
    isCostAnomaly: boolean;
  } | null;
  anomalyCount: number;
  target: {
    revenueTarget: number;
    costTarget: number;
    gopTarget: number;
  } | null;
}

type Status = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  REJECTED: { label: '已驳回', color: 'bg-red-100 text-red-800' },
  APPROVED: { label: '已审核', color: 'bg-green-100 text-green-800' },
};

export default function ReviewListPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status>('SUBMITTED');

  // Build query URL based on user role
  const buildQueryUrl = useCallback(() => {
    let url = `/api/regional/review?status=${statusFilter}`;
    // ADMIN can see all, REGIONAL_DIRECTOR is filtered by API based on session
    return url;
  }, [statusFilter]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildQueryUrl();
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await res.json();
      setItems(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [buildQueryUrl]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchData();
    }
  }, [sessionStatus, fetchData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format datetime
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">待审核列表</h1>
              <p className="text-gray-500">
                欢迎，{session?.user?.name || '用户'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {session?.user?.role === 'ADMIN' ? '管理员' : session?.user?.role === 'REGIONAL_DIRECTOR' ? '区域总监' : '用户'}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {(['SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'] as Status[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {STATUS_LABELS[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">酒店</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">营业日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">收入</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">收入目标</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">完成率</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总成本</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">GOP</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">异常</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const revenueCompletionRate = item.target && item.calculationResult
                    ? item.calculationResult.totalRevenue / item.target.revenueTarget
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.hotelName}</div>
                        <div className="text-xs text-gray-500">{item.hotelCode}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.businessDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateTime(item.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.calculationResult
                          ? formatCurrency(item.calculationResult.totalRevenue)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {item.target ? formatCurrency(item.target.revenueTarget) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {revenueCompletionRate !== null ? (
                          <span className={revenueCompletionRate >= 1 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(revenueCompletionRate)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.calculationResult
                          ? formatCurrency(item.calculationResult.totalCost)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.calculationResult ? (
                          <span className={item.calculationResult.gop >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.calculationResult.gop)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.anomalyCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.anomalyCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[item.status].color}`}>
                          {STATUS_LABELS[item.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/regional/review/${item.hotelId}/${item.businessDate}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
