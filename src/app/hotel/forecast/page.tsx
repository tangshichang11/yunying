'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface ForecastDay {
  id: string;
  forecastMonthId: string;
  businessDate: string;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  systemSuggestedAmount: number;
  manualAmount: number | null;
  finalAmount: number;
  isManuallyAdjusted: boolean;
  isLocked: boolean;
}

interface ForecastMonth {
  id: string;
  hotelId: string;
  year: number;
  month: number;
  monthlyRevenueForecast: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt: string | null;
  submittedBy: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  dailyForecasts: ForecastDay[];
}

interface Hotel {
  id: string;
  code: string;
  name: string;
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  APPROVED: '已审核',
  REJECTED: '已退回',
};

export default function ForecastPage() {
  // 当前酒店
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Forecast 数据
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [forecastMonth, setForecastMonth] = useState<ForecastMonth | null>(null);

  // UI 状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // 校验状态
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isBalanced, setIsBalanced] = useState(true);

  // 加载酒店信息
  useEffect(() => {
    async function fetchHotels() {
      try {
        const response = await fetch('/api/hotels');
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          // 默认选择龙口悦致酒店
          const lkyzHotel = result.data.find((h: Hotel) => h.code === 'LK-YZ-001') || result.data[0];
          setHotel(lkyzHotel);
          setHotels(result.data);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        // 如果获取失败，使用默认ID（龙口悦致酒店）
        setHotel({
          id: 'cmthyo9ho000414p9l1pl4ifx',
          code: 'LKYZ',
          name: '龙口悦致酒店',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchHotels();
  }, []);

  // 加载 Forecast 数据
  const loadForecast = useCallback(async () => {
    if (!hotel) return;

    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}`
      );
      const result = await response.json();

      if (response.ok && result.data) {
        setForecastMonth(result.data);
        validateForecast(result.data);
      } else {
        setForecastMonth(null);
        setValidationErrors([]);
        setIsBalanced(true);
      }
    } catch (error) {
      console.error('Error loading forecast:', error);
    }
  }, [hotel, currentYear, currentMonth]);

  useEffect(() => {
    if (hotel) {
      loadForecast();
    }
  }, [hotel, loadForecast]);

  // 校验 Forecast
  const validateForecast = (data: ForecastMonth) => {
    const errors: string[] = [];
    const dailySum = data.dailyForecasts.reduce((sum, d) => sum + d.finalAmount, 0);
    const diff = Math.abs(data.monthlyRevenueForecast - dailySum);

    // 任何非零差额都需要提示（阈值 0.01 元）
    if (diff >= 0.01) {
      errors.push(`月度预定与每日合计不一致，差额: ¥${diff.toFixed(2)}`);
    }

    // 检查缺少日期
    const daysInMonth = new Date(data.year, data.month, 0).getDate();
    if (data.dailyForecasts.length !== daysInMonth) {
      errors.push(`日期不完整，预期 ${daysInMonth} 天，实际 ${data.dailyForecasts.length} 天`);
    }

    // 检查负数
    const negativeDays = data.dailyForecasts.filter((d) => d.finalAmount < 0);
    if (negativeDays.length > 0) {
      errors.push(`${negativeDays.length} 天的金额为负数`);
    }

    setValidationErrors(errors);
    setIsBalanced(errors.length === 0);
  };

  // 创建新的月度 Forecast
  const createForecastMonth = async () => {
    if (!hotel) return;

    try {
      const response = await fetch(`/api/forecast-v2/${hotel.id}/months`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          month: currentMonth,
          monthlyRevenueForecast: 0,
        }),
      });

      if (response.ok) {
        await loadForecast();
      }
    } catch (error) {
      console.error('Error creating forecast month:', error);
    }
  };

  // 智能生成每日 Forecast
  const handleGenerate = async () => {
    if (!hotel || !forecastMonth) return;

    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyForecast: forecastMonth.monthlyRevenueForecast,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setForecastMonth(result.data);
        validateForecast(result.data);
        setIsGenerateModalOpen(false);
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    }
  };

  // 更新月度总额
  const handleUpdateMonthlyForecast = async (newValue: number) => {
    if (!hotel || !forecastMonth) return;

    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyRevenueForecast: newValue,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setForecastMonth(result.data);
        validateForecast(result.data);
      }
    } catch (error) {
      console.error('Error updating monthly forecast:', error);
    }
  };

  // 更新单日金额
  const handleUpdateDay = async (date: string, value: number) => {
    if (!hotel || !forecastMonth) return;

    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}/days/${date}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            finalAmount: value,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const updatedDay = result.data;
        setForecastMonth((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            dailyForecasts: prev.dailyForecasts.map((d) =>
              d.businessDate === date ? updatedDay : d
            ),
          };
        });
        // 重新校验
        if (forecastMonth) {
          const updated = {
            ...forecastMonth,
            dailyForecasts: forecastMonth.dailyForecasts.map((d) =>
              d.businessDate === date ? { ...d, finalAmount: value } : d
            ),
          };
          validateForecast(updated);
        }
        setEditingDate(null);
      }
    } catch (error) {
      console.error('Error updating day:', error);
    }
  };

  // 重新平衡
  const handleRebalance = async () => {
    if (!hotel || !forecastMonth) return;

    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}/rebalance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setForecastMonth(result.data);
        validateForecast(result.data);
      }
    } catch (error) {
      console.error('Error rebalancing:', error);
    }
  };

  // 提交审核
  const handleSubmit = async () => {
    if (!hotel || !forecastMonth) return;

    if (!isBalanced) {
      alert('数据不平衡，无法提交');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/forecast-v2/${hotel.id}/months/${currentYear}-${String(currentMonth).padStart(2, '0')}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorId: 'current-user',
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setForecastMonth(result.data);
      } else {
        const error = await response.json();
        alert('提交失败: ' + (error.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化金额（显示原始精度，避免四舍五入导致用户困惑）
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // 计算合计
  const dailySum = forecastMonth
    ? forecastMonth.dailyForecasts.reduce((sum, d) => sum + d.finalAmount, 0)
    : 0;

  // 渲染状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hotel?.name || '龙口悦致酒店'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">业绩预定管理</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 酒店选择 */}
              <select
                value={hotel?.id || ''}
                onChange={(e) => {
                  const selected = hotels.find((h) => h.id === e.target.value);
                  if (selected) {
                    setHotel(selected);
                    setForecastMonth(null);
                  }
                }}
                className="border rounded px-3 py-2 text-sm"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              {/* 月份选择 */}
              <div className="flex items-center gap-2">
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value={2026}>2026年</option>
                  <option value={2027}>2027年</option>
                </select>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="border rounded px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </div>
              {/* 状态标签 */}
              {forecastMonth && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[forecastMonth.status]
                  }`}
                >
                  {STATUS_LABELS[forecastMonth.status]}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!forecastMonth ? (
                <button
                  onClick={createForecastMonth}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  创建月度预定
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    disabled={forecastMonth.status !== 'DRAFT' && forecastMonth.status !== 'REJECTED'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                  >
                    智能生成
                  </button>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    disabled={forecastMonth.status !== 'DRAFT' && forecastMonth.status !== 'REJECTED'}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    导入 Excel
                  </button>
                  <a
                    href="/templates/forecast-import-template.xlsx"
                    download="业绩预定导入模板.xlsx"
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm text-gray-700"
                  >
                    下载模板
                  </a>
                  <button
                    onClick={handleRebalance}
                    disabled={forecastMonth.status !== 'DRAFT' && forecastMonth.status !== 'REJECTED'}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    重新平衡
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* 月度总额编辑 */}
              {forecastMonth && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">月度预定:</span>
                  <input
                    type="number"
                    value={forecastMonth.monthlyRevenueForecast}
                    onChange={(e) =>
                      handleUpdateMonthlyForecast(parseFloat(e.target.value) || 0)
                    }
                    disabled={forecastMonth.status !== 'DRAFT' && forecastMonth.status !== 'REJECTED'}
                    className="border rounded px-3 py-1 w-32 text-right disabled:bg-gray-100"
                  />
                </div>
              )}
              {/* 提交按钮 */}
              {forecastMonth && (
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !isBalanced ||
                    (forecastMonth.status !== 'DRAFT' && forecastMonth.status !== 'REJECTED')
                  }
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : '提交审核'}
                </button>
              )}
            </div>
          </div>

          {/* 校验信息 */}
          {forecastMonth && validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-lg">❌</span>
                <div>
                  <p className="font-medium text-red-800">数据校验失败</p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 被退回原因 */}
          {forecastMonth?.status === 'REJECTED' && forecastMonth.rejectionReason && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="font-medium text-orange-800">退回原因</p>
              <p className="mt-1 text-sm text-orange-700">{forecastMonth.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* 数据表格 */}
        {forecastMonth ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">日期</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">星期</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">系统建议</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">人工调整</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">最终金额</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {forecastMonth.dailyForecasts.map((day) => (
                    <tr
                      key={day.id}
                      className={`hover:bg-gray-50 ${
                        day.isWeekend ? 'bg-blue-50' : ''
                      } ${day.isLocked ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        {day.businessDate.replace(/^\d{4}-(\d{2})-(\d{2})$/, '$1/$2')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`${
                            day.isWeekend ? 'text-blue-600 font-medium' : 'text-gray-600'
                          }`}
                        >
                          {WEEKDAY_NAMES[day.dayOfWeek]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {formatCurrency(day.systemSuggestedAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {day.isManuallyAdjusted ? (
                          <span className="text-orange-600">
                            {formatCurrency(day.manualAmount || day.finalAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {editingDate === day.businessDate ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                            onBlur={() => handleUpdateDay(day.businessDate, editValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateDay(day.businessDate, editValue);
                              } else if (e.key === 'Escape') {
                                setEditingDate(null);
                              }
                            }}
                            className="border rounded px-2 py-1 w-28 text-right"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => {
                              if (forecastMonth.status === 'DRAFT' || forecastMonth.status === 'REJECTED') {
                                setEditingDate(day.businessDate);
                                setEditValue(day.finalAmount);
                              }
                            }}
                            className={`cursor-pointer ${
                              forecastMonth.status === 'DRAFT' || forecastMonth.status === 'REJECTED'
                                ? 'hover:bg-gray-100 cursor-text'
                                : ''
                            }`}
                          >
                            {formatCurrency(day.finalAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {day.isManuallyAdjusted && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            已调整
                          </span>
                        )}
                        {day.isLocked && !day.isManuallyAdjusted && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            锁定
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t font-medium">
                  <tr>
                    <td className="px-4 py-3" colSpan={4}>
                      每日合计
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(dailySum)}</td>
                    <td></td>
                  </tr>
                  <tr className={isBalanced ? 'text-green-700' : 'text-red-700'}>
                    <td className="px-4 py-3" colSpan={4}>
                      月度预定
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(forecastMonth.monthlyRevenueForecast)}
                    </td>
                    <td></td>
                  </tr>
                  <tr className={isBalanced ? 'text-green-700' : 'text-red-700'}>
                    <td className="px-4 py-3" colSpan={4}>
                      差额
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(forecastMonth.monthlyRevenueForecast - dailySum)}
                    </td>
                    <td className="text-center">
                      {isBalanced ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-500 mb-4">
              {currentYear}年{currentMonth}月暂无业绩预定数据
            </p>
            <button
              onClick={createForecastMonth}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              创建月度预定
            </button>
          </div>
        )}
      </main>

      {/* 智能生成弹窗 */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">智能生成每日预定</h2>
            <p className="text-gray-600 mb-4">
              系统将根据历史数据和星期权重，自动生成 {currentMonth}月 的每日业绩预定。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月度业绩预定
              </label>
              <input
                type="number"
                value={forecastMonth?.monthlyRevenueForecast || 0}
                onChange={(e) => {
                  if (forecastMonth) {
                    setForecastMonth({
                      ...forecastMonth,
                      monthlyRevenueForecast: parseFloat(e.target.value) || 0,
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel 导入弹窗 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">导入 Excel</h2>
            <p className="text-gray-600 mb-4">
              请上传标准格式的 Excel 文件，包含日期和业绩预定金额列。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excel 文件
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                id="excel-upload"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月度业绩预定
              </label>
              <input
                type="number"
                id="monthly-forecast-input"
                placeholder="可选，如果 Excel 中没有"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
                  const monthlyInput = document.getElementById('monthly-forecast-input') as HTMLInputElement;

                  if (!fileInput.files?.length) {
                    alert('请选择文件');
                    return;
                  }

                  const formData = new FormData();
                  formData.append('file', fileInput.files[0]);
                  formData.append('hotelId', hotel?.id || '');
                  formData.append('year', String(currentYear));
                  formData.append('month', String(currentMonth));
                  formData.append('monthlyForecast', monthlyInput.value || '0');

                  try {
                    const response = await fetch('/api/forecast-v2/import', {
                      method: 'POST',
                      body: formData,
                    });

                    const result = await response.json();

                    if (response.ok) {
                      // 显示预览
                      const preview = result.data;
                      // isValid 在 API 响应的顶层，不是在 data 里面
                      if (!result.isValid) {
                        const errorMsgs = preview.validationErrors.map((e: any) => e.message).join('\n');
                        alert('导入校验失败:\n' + errorMsgs);
                        return;
                      }

                      // 确认导入
                      if (confirm(`确认导入?\n文件: ${preview.fileName}\n月度预定: ¥${preview.monthlyForecast}\n每日合计: ¥${preview.dailySum}\n差额: ¥${preview.difference}`)) {
                        const confirmResponse = await fetch('/api/forecast-v2/import', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            hotelId: hotel?.id,
                            year: currentYear,
                            month: currentMonth,
                            monthlyForecast: preview.monthlyForecast,
                            rows: preview.rows,
                            overwrite: true,
                          }),
                        });

                        if (confirmResponse.ok) {
                          const confirmResult = await confirmResponse.json();
                          setForecastMonth(confirmResult.data);
                          validateForecast(confirmResult.data);
                          setIsImportModalOpen(false);
                        }
                      }
                    } else {
                      alert('导入失败: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Import error:', error);
                    alert('导入失败');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                上传并预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
