'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Hotel {
  id: string;
  code: string;
  name: string;
  physicalRoomCount: number;
  regionName: string;
}

interface Revenue {
  id?: string;
  roomRevenue: number;
  minibarRevenue: number;
  foodRevenue: number;
  otherRevenue: number;
  totalRevenue?: number;
}

interface VariableCost {
  id?: string;
  roomSuppliesCost: number;
  frontDeskItemsCost: number;
  merchandiseCost: number;
  laundryCost: number;
  restaurantCost: number;
  otherVariableCost: number;
  totalVariableCost?: number;
}

interface LaborCost {
  id?: string;
  frontDeskWages: number;
  housekeepingWages: number;
  restaurantWages: number;
  managementWages: number;
  totalLaborCost?: number;
}

interface CommissionCost {
  id?: string;
  reviewCommission: number;
  qrCommission: number;
  memberCardCommission: number;
  housekeepingCommission: number;
  totalCommissionCost?: number;
}

interface FixedCost {
  id?: string;
  rent: number;
  platformPromotionFee: number;
  otherFixedCost: number;
  totalFixedCost?: number;
}

interface Energy {
  id?: string;
  electricityConsumption: number;
  electricityUnitPrice: number;
  electricityCost?: number;
  waterConsumption: number;
  waterUnitPrice: number;
  waterCost?: number;
  gasConsumption: number;
  gasUnitPrice: number;
  gasCost?: number;
  totalUtilityCost?: number;
}

interface RoomStatus {
  id?: string;
  soldRooms: number;  // 实际出租房间数 (CONFIRMED)
}

interface DailyTarget {
  revenueTarget: number;
  costTarget: number;
  gopTarget: number;
}

interface CalculationResult {
  totalRevenue: number;
  variableCost: number;
  laborCost: number;
  commissionCost: number;
  fixedCost: number;
  energyCost: number;
  totalCost: number;
  gop: number;
  gopRate: number;
  occupancyRate: number;
  avgRoomRate: number;
  revpar: number;
}

interface Anomaly {
  type: 'REVENUE' | 'COST';
  severity: 'WARNING' | 'ERROR';
  message: string;
  actualValue: number;
  expectedValue: number;
  deviationRate: number;
}

interface DailyAccountingData {
  hotel: Hotel;
  businessDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  submissionDeadline: string;
  isPastDeadline: boolean;
  lastSavedAt: string | null;
  revenue: Revenue | null;
  variableCost: VariableCost | null;
  laborCost: LaborCost | null;
  commissionCost: CommissionCost | null;
  fixedCost: FixedCost | null;
  energy: Energy | null;
  calculationResult: CalculationResult | null;
  roomStatus: RoomStatus | null;
  target: DailyTarget | null;
}

type Status = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: '已提交', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: '已驳回', color: 'bg-red-100 text-red-800' },
  APPROVED: { label: '已审核', color: 'bg-green-100 text-green-800' },
};

// Mock data for demo - in production this would come from auth session
const MOCK_HOTEL_ID = 'cmthyo9ho000414p9l1pl4ifx';
const MOCK_HOTEL = {
  id: 'cmthyo9ho000414p9l1pl4ifx',
  code: 'LK-YZ-001',
  name: '龙口悦致酒店',
  physicalRoomCount: 120,
  regionName: '龙口区域',
};

export default function DailyAccountingPage() {
  // Get today's date as default
  const today = new Date().toISOString().split('T')[0];
  const [businessDate, setBusinessDate] = useState(today);
  const [hotelId] = useState(MOCK_HOTEL_ID);

  const [data, setData] = useState<DailyAccountingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [revenue, setRevenue] = useState<Revenue>({
    roomRevenue: 0,
    minibarRevenue: 0,
    foodRevenue: 0,
    otherRevenue: 0,
  });

  const [variableCost, setVariableCost] = useState<VariableCost>({
    roomSuppliesCost: 0,
    frontDeskItemsCost: 0,
    merchandiseCost: 0,
    laundryCost: 0,
    restaurantCost: 0,
    otherVariableCost: 0,
  });

  const [laborCost, setLaborCost] = useState<LaborCost>({
    frontDeskWages: 0,
    housekeepingWages: 0,
    restaurantWages: 0,
    managementWages: 0,
  });

  const [commissionCost, setCommissionCost] = useState<CommissionCost>({
    reviewCommission: 0,
    qrCommission: 0,
    memberCardCommission: 0,
    housekeepingCommission: 0,
  });

  const [fixedCost, setFixedCost] = useState<FixedCost>({
    rent: 0,
    platformPromotionFee: 0,
    otherFixedCost: 0,
  });

  const [energy, setEnergy] = useState<Energy>({
    electricityConsumption: 0,
    electricityUnitPrice: 0.77,
    waterConsumption: 0,
    waterUnitPrice: 5.3,
    gasConsumption: 0,
    gasUnitPrice: 0,
  });

  const [roomStatus, setRoomStatus] = useState<RoomStatus>({
    soldRooms: 0,
  });

  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/daily-accounting/${businessDate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await res.json();

      // Use mock hotel if API returns no hotel
      json.hotel = MOCK_HOTEL;
      setData(json);

      // Update form state
      if (json.revenue) {
        setRevenue(json.revenue);
      }
      if (json.variableCost) {
        setVariableCost(json.variableCost);
      }
      if (json.laborCost) {
        setLaborCost(json.laborCost);
      }
      if (json.commissionCost) {
        setCommissionCost(json.commissionCost);
      }
      if (json.fixedCost) {
        setFixedCost(json.fixedCost);
      }
      if (json.energy) {
        setEnergy({
          electricityConsumption: json.energy.electricityConsumption || 0,
          electricityUnitPrice: json.energy.electricityUnitPrice || 0.77,
          waterConsumption: json.energy.waterConsumption || 0,
          waterUnitPrice: json.energy.waterUnitPrice || 5.3,
          gasConsumption: json.energy.gasConsumption || 0,
          gasUnitPrice: json.energy.gasUnitPrice || 0,
        });
      }
      if (json.roomStatus) {
        setRoomStatus({
          soldRooms: json.roomStatus.soldRooms || 0,
        });
      }
      if (json.calculationResult) {
        // Combine calculationResult with separate cost data
        setCalculationResult({
          ...json.calculationResult,
          variableCost: json.variableCost?.totalVariableCost || 0,
          laborCost: json.laborCost?.totalLaborCost || 0,
          commissionCost: json.commissionCost?.totalCommissionCost || 0,
          fixedCost: json.fixedCost?.totalFixedCost || 0,
          energyCost: json.energy?.totalUtilityCost || 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [hotelId, businessDate]);

  // Fetch data on mount and when hotelId/businessDate changes
  // This is a valid pattern for initial data loading in React
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, businessDate]);

  // Save draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/daily-accounting/${businessDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenue,
          variableCost,
          laborCost,
          commissionCost,
          fixedCost,
          energy,
          roomStatus,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to save draft');
      }
      const json = await res.json();
      setSuccessMessage('草稿保存成功');
      setData(prev => prev ? { ...prev, status: json.data.status, lastSavedAt: json.data.lastSavedAt } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  // Calculate
  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);
    try {
      // Save first
      await handleSaveDraft();

      const res = await fetch(`/api/hotels/${hotelId}/daily-accounting/${businessDate}/calculate`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to calculate');
      }
      const json = await res.json();

      setCalculationResult(json.calculation);
      setAnomalies(json.anomalies || []);

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCalculating(false);
    }
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/daily-accounting/${businessDate}/submit`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to submit');
      }
      const json = await res.json();
      setSuccessMessage('提交成功，请等待审核');
      setData(prev => prev ? { ...prev, status: 'SUBMITTED', submittedAt: json.data.submittedAt } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if editing is allowed
  const canEdit = data?.status === 'DRAFT' || data?.status === 'REJECTED';

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
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
              <h1 className="text-2xl font-bold text-gray-900">
                {MOCK_HOTEL.name}
              </h1>
              <p className="text-gray-500">{MOCK_HOTEL.regionName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  营业日期
                </label>
                <input
                  type="date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">状态:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  STATUS_LABELS[data?.status as Status]?.color || 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[data?.status as Status]?.label || data?.status || 'DRAFT'}
              </span>
            </div>
            {data?.status === 'REJECTED' && data.rejectionReason && (
              <div className="text-red-600 text-sm">
                驳回原因: {data.rejectionReason}
              </div>
            )}
            <div className="text-sm text-gray-500">
              截止时间: {data?.submissionDeadline ? formatDateTime(data.submissionDeadline) : '-'}
              {data?.isPastDeadline && (
                <span className="text-red-600 ml-2">(已过截止时间)</span>
              )}
            </div>
            {data?.lastSavedAt && (
              <div className="text-sm text-gray-500">
                最后保存: {formatDateTime(data.lastSavedAt)}
              </div>
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
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Master Data - Read Only */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">酒店基础资料</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">酒店名称</div>
                  <div className="font-medium">{data?.hotel.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">酒店编码</div>
                  <div className="font-medium">{data?.hotel.code}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">区域</div>
                  <div className="font-medium">{data?.hotel.regionName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">物理总房间数</div>
                  <div className="font-medium">{data?.hotel.physicalRoomCount}</div>
                  <div className="text-xs text-gray-400">[系统]</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">营业日期</div>
                  <div className="font-medium">{data?.businessDate}</div>
                </div>
              </div>
            </div>

            {/* Daily Target - Read Only */}
            {data?.target && (
              <div className="bg-blue-50 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">今日目标</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-blue-600">收入目标</div>
                    <div className="font-bold text-blue-800">{formatCurrency(data.target.revenueTarget)}</div>
                    <div className="text-xs text-blue-500">[总监维护]</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">成本目标</div>
                    <div className="font-bold text-blue-800">{formatCurrency(data.target.costTarget)}</div>
                    <div className="text-xs text-blue-500">[总监维护]</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">GOP目标</div>
                    <div className="font-bold text-blue-800">{formatCurrency(data.target.gopTarget)}</div>
                    <div className="text-xs text-blue-500">[总监维护]</div>
                  </div>
                </div>
              </div>
            )}

            {/* Room Status Section - Manager Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">经营基础数据</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入住间数
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={roomStatus.soldRooms === 0 ? '' : String(roomStatus.soldRooms)}
                    onChange={(e) => setRoomStatus({ ...roomStatus, soldRooms: parseInt(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                  <div className="text-xs text-gray-400 mt-1">[店长录入]</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                * 出租率 = 入住间数 / 物理总房间数（系统自动计算）
              </div>
            </div>

            {/* Revenue Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">收入 <span className="text-xs font-normal text-gray-500">[店长录入]</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    房费收入
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={revenue.roomRevenue === 0 ? '' : String(revenue.roomRevenue)}
                    onChange={(e) => setRevenue({ ...revenue, roomRevenue: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    迷你吧收入
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={revenue.minibarRevenue === 0 ? '' : String(revenue.minibarRevenue)}
                    onChange={(e) => setRevenue({ ...revenue, minibarRevenue: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    餐费收入
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={revenue.foodRevenue === 0 ? '' : String(revenue.foodRevenue)}
                    onChange={(e) => setRevenue({ ...revenue, foodRevenue: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    其他业务收入
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={revenue.otherRevenue === 0 ? '' : String(revenue.otherRevenue)}
                    onChange={(e) => setRevenue({ ...revenue, otherRevenue: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Variable Cost Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">变动成本</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客房耗材
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.roomSuppliesCost === 0 ? '' : String(variableCost.roomSuppliesCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, roomSuppliesCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前台增值物品
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.frontDeskItemsCost === 0 ? '' : String(variableCost.frontDeskItemsCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, frontDeskItemsCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    小商品成本
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.merchandiseCost === 0 ? '' : String(variableCost.merchandiseCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, merchandiseCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    洗涤费
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.laundryCost === 0 ? '' : String(variableCost.laundryCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, laundryCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    餐厅成本
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.restaurantCost === 0 ? '' : String(variableCost.restaurantCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, restaurantCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    其他变动成本
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={variableCost.otherVariableCost === 0 ? '' : String(variableCost.otherVariableCost)}
                    onChange={(e) => setVariableCost({ ...variableCost, otherVariableCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Labor Cost Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">人工成本</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前台工资
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={laborCost.frontDeskWages === 0 ? '' : String(laborCost.frontDeskWages)}
                    onChange={(e) => setLaborCost({ ...laborCost, frontDeskWages: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客房工资
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={laborCost.housekeepingWages === 0 ? '' : String(laborCost.housekeepingWages)}
                    onChange={(e) => setLaborCost({ ...laborCost, housekeepingWages: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    餐厅工资
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={laborCost.restaurantWages === 0 ? '' : String(laborCost.restaurantWages)}
                    onChange={(e) => setLaborCost({ ...laborCost, restaurantWages: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    管理工资
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={laborCost.managementWages === 0 ? '' : String(laborCost.managementWages)}
                    onChange={(e) => setLaborCost({ ...laborCost, managementWages: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Commission Cost Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">提成成本</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前台好评提成
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={commissionCost.reviewCommission === 0 ? '' : String(commissionCost.reviewCommission)}
                    onChange={(e) => setCommissionCost({ ...commissionCost, reviewCommission: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前台二维码提成
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={commissionCost.qrCommission === 0 ? '' : String(commissionCost.qrCommission)}
                    onChange={(e) => setCommissionCost({ ...commissionCost, qrCommission: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会员卡提成
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={commissionCost.memberCardCommission === 0 ? '' : String(commissionCost.memberCardCommission)}
                    onChange={(e) => setCommissionCost({ ...commissionCost, memberCardCommission: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客房提成
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={commissionCost.housekeepingCommission === 0 ? '' : String(commissionCost.housekeepingCommission)}
                    onChange={(e) => setCommissionCost({ ...commissionCost, housekeepingCommission: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Cost Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">固定成本</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    租金
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={fixedCost.rent === 0 ? '' : String(fixedCost.rent)}
                    onChange={(e) => setFixedCost({ ...fixedCost, rent: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    平台推广费
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={fixedCost.platformPromotionFee === 0 ? '' : String(fixedCost.platformPromotionFee)}
                    onChange={(e) => setFixedCost({ ...fixedCost, platformPromotionFee: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    其他固定成本
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={fixedCost.otherFixedCost === 0 ? '' : String(fixedCost.otherFixedCost)}
                    onChange={(e) => setFixedCost({ ...fixedCost, otherFixedCost: parseFloat(e.target.value) || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Energy Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">能耗</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电消耗量 (度)
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={energy.electricityConsumption === 0 ? '' : Number(energy.electricityConsumption).toFixed(2)}
                    onChange={(e) => setEnergy({ ...energy, electricityConsumption: Math.round(parseFloat(e.target.value) * 100) / 100 || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电单价 (元/度)
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={energy.electricityUnitPrice === 0 ? '' : Number(energy.electricityUnitPrice).toFixed(2)}
                    onChange={(e) => setEnergy({ ...energy, electricityUnitPrice: Math.round(parseFloat(e.target.value) * 100) / 100 || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电费
                  </label>
                  <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                    {formatCurrency(energy.electricityConsumption * energy.electricityUnitPrice)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    水消耗量 (吨)
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={energy.waterConsumption === 0 ? '' : Number(energy.waterConsumption).toFixed(2)}
                    onChange={(e) => setEnergy({ ...energy, waterConsumption: Math.round(parseFloat(e.target.value) * 100) / 100 || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    水单价 (元/吨)
                  </label>
                  <input
                    type="text" inputMode="decimal"
                    value={energy.waterUnitPrice === 0 ? '' : Number(energy.waterUnitPrice).toFixed(2)}
                    onChange={(e) => setEnergy({ ...energy, waterUnitPrice: Math.round(parseFloat(e.target.value) * 100) / 100 || 0 })}
                    disabled={!canEdit}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    水费
                  </label>
                  <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50">
                    {formatCurrency(energy.waterConsumption * energy.waterUnitPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results & Actions */}
          <div className="space-y-6">
            {/* Calculation Results */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">核算结果</h2>
              {calculationResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">收入合计</span>
                    <span className="font-medium">{formatCurrency(calculationResult.totalRevenue)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-500 mb-2">成本分解</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">变动成本</span>
                      <span>{formatCurrency(calculationResult.variableCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">人工成本</span>
                      <span>{formatCurrency(calculationResult.laborCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">提成成本</span>
                      <span>{formatCurrency(calculationResult.commissionCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">固定成本</span>
                      <span>{formatCurrency(calculationResult.fixedCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">能耗成本</span>
                      <span>{formatCurrency(calculationResult.energyCost)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">总成本</span>
                      <span className="font-medium text-red-600">{formatCurrency(calculationResult.totalCost)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 bg-blue-50 -mx-4 px-4 py-3 rounded">
                    <div className="flex justify-between">
                      <span className="text-blue-800 font-medium">GOP</span>
                      <span className="text-blue-800 font-bold text-xl">{formatCurrency(calculationResult.gop)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-600 text-sm">GOP率</span>
                      <span className="text-blue-600 text-sm">{formatPercentage(calculationResult.gopRate)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-500 mb-2">运营指标 <span className="text-xs">[系统计算]</span></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">出租率</span>
                      <span>{formatPercentage(calculationResult.occupancyRate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">平均房价 ADR</span>
                      <span>{formatCurrency(calculationResult.avgRoomRate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">RevPAR</span>
                      <span>{formatCurrency(calculationResult.revpar)}</span>
                    </div>
                  </div>
                  {data?.target && (
                    <div className="border-t pt-3">
                      <div className="text-sm text-gray-500 mb-2">目标完成</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">收入完成率</span>
                        <span className={calculationResult.totalRevenue >= data.target.revenueTarget ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(calculationResult.totalRevenue / data.target.revenueTarget)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">GOP完成率</span>
                        <span className={calculationResult.gop >= data.target.gopTarget ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(calculationResult.gop / data.target.gopTarget)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  点击「计算」获取核算结果
                </div>
              )}
            </div>

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">异常提醒</h2>
                <div className="space-y-2">
                  {anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
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
                      <p className="text-sm text-gray-600 mt-1">{anomaly.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
              <div className="space-y-3">
                {canEdit && (
                  <>
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存草稿'}
                    </button>
                    <button
                      onClick={handleCalculate}
                      disabled={calculating}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                      {calculating ? '计算中...' : '计算'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                      {submitting ? '提交中...' : '提交审核'}
                    </button>
                  </>
                )}
                {!canEdit && (
                  <div className="text-center text-gray-500 py-4">
                    {data?.status === 'SUBMITTED' && '数据已提交，等待审核'}
                    {data?.status === 'APPROVED' && '数据已审核通过'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
