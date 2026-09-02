'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Types
interface Revenue {
  roomRevenue: number;
  minibarRevenue: number;
  foodRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}

interface VariableCost {
  roomSuppliesCost: number;
  frontDeskItemsCost: number;
  merchandiseCost: number;
  laundryCost: number;
  restaurantCost: number;
  otherVariableCost: number;
  totalVariableCost: number;
}

interface LaborCost {
  frontDeskWages: number;
  housekeepingWages: number;
  restaurantWages: number;
  managementWages: number;
  totalLaborCost: number;
}

interface CommissionCost {
  reviewCommission: number;
  qrCommission: number;
  memberCardCommission: number;
  housekeepingCommission: number;
  totalCommissionCost: number;
}

interface FixedCost {
  rent: number;
  platformPromotionFee: number;
  otherFixedCost: number;
  totalFixedCost: number;
}

interface Energy {
  electricityConsumption: number;
  electricityUnitPrice: number;
  electricityCost: number;
  waterConsumption: number;
  waterUnitPrice: number;
  waterCost: number;
  gasConsumption: number;
  gasUnitPrice: number;
  gasCost: number;
  totalUtilityCost: number;
}

interface CalculationResult {
  totalRevenue: number;
  totalCost: number;
  gop: number;
  gopRate: number;
  occupancyRate: number;
  avgRoomRate: number;
  revpar: number;
}

interface Anomaly {
  id: string;
  type: 'REVENUE' | 'COST';
  severity: 'WARNING' | 'ERROR';
  expectedValue: number;
  actualValue: number;
  deviation: number;
  deviationRate: number;
  description: string;
  status: string;
}

interface TargetComparison {
  target: number | null;
  actual: number;
  variance: number | null;
  varianceRate: number | null;
}

interface ReviewDetail {
  id: string;
  hotel: {
    id: string;
    code: string;
    name: string;
    actualRooms: number;
    regionId: string;
    regionName: string;
  };
  businessDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';
  submittedAt: string | null;
  submittedBy: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  revenue: Revenue | null;
  variableCost: VariableCost | null;
  laborCost: LaborCost | null;
  commissionCost: CommissionCost | null;
  fixedCost: FixedCost | null;
  energy: Energy | null;
  calculationResult: CalculationResult | null;
  targetComparison: {
    revenue: TargetComparison;
    cost: TargetComparison;
    gop: TargetComparison;
  };
  anomalies: Anomaly[];
}

type Status = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  REJECTED: { label: '已驳回', color: 'bg-red-100 text-red-800' },
  APPROVED: { label: '已审核', color: 'bg-green-100 text-green-800' },
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.hotelId as string;
  const businessDate = params.businessDate as string;

  const [data, setData] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/regional/review/${hotelId}/${businessDate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [hotelId, businessDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Approve
  const handleApprove = async () => {
    setActionLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/regional/review/${hotelId}/${businessDate}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to approve');
      }
      setActionSuccess('审核通过成功');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('请填写驳回原因');
      return;
    }
    setActionLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/regional/review/${hotelId}/${businessDate}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to reject');
      }
      setActionSuccess('驳回成功');
      setShowRejectModal(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">数据不存在</div>
      </div>
    );
  }

  const canReview = data.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.hotel.name}</h1>
              <p className="text-gray-500">{data.hotel.regionName} | {data.businessDate}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_LABELS[data.status].color}`}>
                {STATUS_LABELS[data.status].label}
              </span>
              <button
                onClick={() => router.push('/regional/review')}
                className="text-gray-600 hover:text-gray-800"
              >
                返回列表
              </button>
            </div>
          </div>

          {/* Submission Info */}
          <div className="mt-4 flex gap-6 text-sm text-gray-500">
            <div>提交时间: {formatDateTime(data.submittedAt)}</div>
            {data.reviewedAt && <div>审核时间: {formatDateTime(data.reviewedAt)}</div>}
            {data.rejectionReason && (
              <div className="text-red-600">驳回原因: {data.rejectionReason}</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}
      {actionSuccess && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionSuccess}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">收入</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">房费收入</div>
                  <div className="text-lg font-medium">{formatCurrency(data.revenue?.roomRevenue || 0)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">迷你吧收入</div>
                  <div className="text-lg font-medium">{formatCurrency(data.revenue?.minibarRevenue || 0)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">餐费收入</div>
                  <div className="text-lg font-medium">{formatCurrency(data.revenue?.foodRevenue || 0)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">其他业务收入</div>
                  <div className="text-lg font-medium">{formatCurrency(data.revenue?.otherRevenue || 0)}</div>
                </div>
                <div className="col-span-2 border-t pt-4 mt-4">
                  <div className="text-sm text-gray-500">收入合计</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.revenue?.totalRevenue || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Costs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">成本分解</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-2">变动成本</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>客房耗材: {formatCurrency(data.variableCost?.roomSuppliesCost || 0)}</div>
                    <div>前台物品: {formatCurrency(data.variableCost?.frontDeskItemsCost || 0)}</div>
                    <div>小商品: {formatCurrency(data.variableCost?.merchandiseCost || 0)}</div>
                    <div>洗涤费: {formatCurrency(data.variableCost?.laundryCost || 0)}</div>
                    <div>餐厅成本: {formatCurrency(data.variableCost?.restaurantCost || 0)}</div>
                    <div>其他: {formatCurrency(data.variableCost?.otherVariableCost || 0)}</div>
                  </div>
                  <div className="text-right font-medium mt-2">
                    变动成本合计: {formatCurrency(data.variableCost?.totalVariableCost || 0)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">人工成本</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>前台: {formatCurrency(data.laborCost?.frontDeskWages || 0)}</div>
                    <div>客房: {formatCurrency(data.laborCost?.housekeepingWages || 0)}</div>
                    <div>餐厅: {formatCurrency(data.laborCost?.restaurantWages || 0)}</div>
                    <div>管理: {formatCurrency(data.laborCost?.managementWages || 0)}</div>
                  </div>
                  <div className="text-right font-medium mt-2">
                    人工成本合计: {formatCurrency(data.laborCost?.totalLaborCost || 0)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">提成成本</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>好评提成: {formatCurrency(data.commissionCost?.reviewCommission || 0)}</div>
                    <div>二维码提成: {formatCurrency(data.commissionCost?.qrCommission || 0)}</div>
                    <div>会员卡提成: {formatCurrency(data.commissionCost?.memberCardCommission || 0)}</div>
                    <div>客房提成: {formatCurrency(data.commissionCost?.housekeepingCommission || 0)}</div>
                  </div>
                  <div className="text-right font-medium mt-2">
                    提成成本合计: {formatCurrency(data.commissionCost?.totalCommissionCost || 0)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">固定成本</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>租金: {formatCurrency(data.fixedCost?.rent || 0)}</div>
                    <div>平台推广费: {formatCurrency(data.fixedCost?.platformPromotionFee || 0)}</div>
                    <div>其他固定成本: {formatCurrency(data.fixedCost?.otherFixedCost || 0)}</div>
                  </div>
                  <div className="text-right font-medium mt-2">
                    固定成本合计: {formatCurrency(data.fixedCost?.totalFixedCost || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Energy */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">能耗</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-2">电费</div>
                  <div className="text-sm">
                    消耗量: {data.energy?.electricityConsumption || 0} 度
                  </div>
                  <div className="text-sm">
                    单价: {formatCurrency(data.energy?.electricityUnitPrice || 0)} /度
                  </div>
                  <div className="text-lg font-medium mt-1">
                    {formatCurrency(data.energy?.electricityCost || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">水费</div>
                  <div className="text-sm">
                    消耗量: {data.energy?.waterConsumption || 0} 吨
                  </div>
                  <div className="text-sm">
                    单价: {formatCurrency(data.energy?.waterUnitPrice || 0)} /吨
                  </div>
                  <div className="text-lg font-medium mt-1">
                    {formatCurrency(data.energy?.waterCost || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Anomalies */}
            {data.anomalies.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">异常</h2>
                <div className="space-y-2">
                  {data.anomalies.map(anomaly => (
                    <div
                      key={anomaly.id}
                      className={`p-3 rounded ${
                        anomaly.severity === 'ERROR' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            anomaly.severity === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {anomaly.severity === 'ERROR' ? '错误' : '警告'}
                        </span>
                        <span className="text-sm font-medium">
                          {anomaly.type === 'REVENUE' ? '收入异常' : '成本异常'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Calculation Result (from backend) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">核算结果</h2>
              {data.calculationResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">收入合计</span>
                    <span className="font-medium">{formatCurrency(data.calculationResult.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">总成本</span>
                    <span className="font-medium text-red-600">{formatCurrency(data.calculationResult.totalCost)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-blue-800 font-medium">GOP</span>
                      <span className="text-blue-800 font-bold text-xl">
                        {formatCurrency(data.calculationResult.gop)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-600 text-sm">GOP率</span>
                      <span className="text-blue-600 text-sm">
                        {formatPercentage(data.calculationResult.gopRate)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">出租率</span>
                      <span>{formatPercentage(data.calculationResult.occupancyRate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">平均房价</span>
                      <span>{formatCurrency(data.calculationResult.avgRoomRate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">RevPAR</span>
                      <span>{formatCurrency(data.calculationResult.revpar)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无计算结果</div>
              )}
            </div>

            {/* Target Comparison */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">目标对比</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">收入</div>
                  <div className="flex justify-between text-sm">
                    <span>目标</span>
                    <span>{data.targetComparison.revenue.target !== null ? formatCurrency(data.targetComparison.revenue.target) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>实际</span>
                    <span>{formatCurrency(data.targetComparison.revenue.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>差异</span>
                    <span className={data.targetComparison.revenue.variance && data.targetComparison.revenue.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.targetComparison.revenue.variance !== null ? formatCurrency(data.targetComparison.revenue.variance) : '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">成本</div>
                  <div className="flex justify-between text-sm">
                    <span>目标</span>
                    <span>{data.targetComparison.cost.target !== null ? formatCurrency(data.targetComparison.cost.target) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>实际</span>
                    <span>{formatCurrency(data.targetComparison.cost.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>差异</span>
                    <span className={data.targetComparison.cost.variance && data.targetComparison.cost.variance <= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.targetComparison.cost.variance !== null ? formatCurrency(data.targetComparison.cost.variance) : '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">GOP</div>
                  <div className="flex justify-between text-sm">
                    <span>目标</span>
                    <span>{data.targetComparison.gop.target !== null ? formatCurrency(data.targetComparison.gop.target) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>实际</span>
                    <span>{formatCurrency(data.targetComparison.gop.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>差异</span>
                    <span className={data.targetComparison.gop.variance && data.targetComparison.gop.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.targetComparison.gop.variance !== null ? formatCurrency(data.targetComparison.gop.variance) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {canReview && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">审核操作</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                  >
                    {actionLoading ? '处理中...' : '审核通过'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded disabled:opacity-50"
                  >
                    驳回
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">驳回原因</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写驳回原因（必填）"
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
