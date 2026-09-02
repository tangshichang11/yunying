// ============================================================
// 慧友酒店经营核算平台 - Forecast V2 类型定义
// ============================================================

import { Decimal } from '@prisma/client/runtime/library';

// Forecast 月度状态
export type ForecastMonthStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

// 月度 Forecast 响应
export interface ForecastMonthResponse {
  id: string;
  hotelId: string;
  year: number;
  month: number;
  monthlyRevenueForecast: number;
  status: ForecastMonthStatus;
  submittedAt: string | null;
  submittedBy: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  dailyForecasts: ForecastDayResponse[];
}

// 每日 Forecast 响应
export interface ForecastDayResponse {
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
  createdAt: string;
  updatedAt: string;
}

// 创建月度 Forecast 请求
export interface CreateForecastMonthRequest {
  hotelId: string;
  year: number;
  month: number;
  monthlyRevenueForecast: number;
}

// 更新月度 Forecast 请求
export interface UpdateForecastMonthRequest {
  monthlyRevenueForecast?: number;
}

// 更新每日 Forecast 请求
export interface UpdateForecastDayRequest {
  finalAmount: number;
}

// 智能生成请求
export interface GenerateDailyForecastRequest {
  monthlyForecast: number;
}

// Excel 导入数据行
export interface ExcelImportRow {
  date: string;
  revenue: number;
}

// Excel 导入预览响应
export interface ExcelImportPreview {
  fileName: string;
  yearMonth: string;
  monthlyForecast: number;
  dailySum: number;
  difference: number;
  rows: ExcelImportRow[];
  validationErrors: ValidationError[];
}

// 校验错误
export interface ValidationError {
  type: 'MISSING_DATE' | 'DUPLICATE_DATE' | 'NEGATIVE_VALUE' | 'DATE_RANGE_INVALID' | 'SUM_MISMATCH';
  message: string;
  details?: string;
}

// 校验结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  monthlyForecast: number;
  dailySum: number;
  difference: number;
}

// 重新平衡请求
export interface RebalanceRequest {
  lockedDays: string[]; // 被锁定的日期列表 (businessDate)
}

// 提交审核请求
export interface SubmitForReviewRequest {
  operatorId: string;
}

// 审核请求 (总监)
export interface ApproveRequest {
  reviewerId: string;
}

export interface RejectRequest {
  reviewerId: string;
  reason: string;
}

// 响应辅助函数
export function formatForecastMonth(month: {
  id: string;
  hotelId: string;
  year: number;
  month: number;
  monthlyRevenueForecast: Decimal;
  status: ForecastMonthStatus;
  submittedAt: Date | null;
  submittedBy: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  dailyForecasts: Array<{
    id: string;
    forecastMonthId: string;
    businessDate: Date;
    dayOfWeek: number;
    isWeekend: boolean;
    isHoliday: boolean;
    systemSuggestedAmount: Decimal;
    manualAmount: Decimal | null;
    finalAmount: Decimal;
    isManuallyAdjusted: boolean;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): ForecastMonthResponse {
  return {
    id: month.id,
    hotelId: month.hotelId,
    year: month.year,
    month: month.month,
    monthlyRevenueForecast: Number(month.monthlyRevenueForecast),
    status: month.status,
    submittedAt: month.submittedAt?.toISOString() ?? null,
    submittedBy: month.submittedBy,
    reviewedAt: month.reviewedAt?.toISOString() ?? null,
    reviewedBy: month.reviewedBy,
    rejectionReason: month.rejectionReason,
    createdAt: month.createdAt.toISOString(),
    updatedAt: month.updatedAt.toISOString(),
    dailyForecasts: month.dailyForecasts.map(formatForecastDay),
  };
}

export function formatForecastDay(day: {
  id: string;
  forecastMonthId: string;
  businessDate: Date;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  systemSuggestedAmount: Decimal;
  manualAmount: Decimal | null;
  finalAmount: Decimal;
  isManuallyAdjusted: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ForecastDayResponse {
  // 格式化日期为 YYYY-MM-DD，使用本地时区
  const d = day.businessDate;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${dayStr}`;

  return {
    id: day.id,
    forecastMonthId: day.forecastMonthId,
    businessDate: dateStr,
    dayOfWeek: day.dayOfWeek,
    isWeekend: day.isWeekend,
    isHoliday: day.isHoliday,
    systemSuggestedAmount: Number(day.systemSuggestedAmount),
    manualAmount: day.manualAmount !== null ? Number(day.manualAmount) : null,
    finalAmount: Number(day.finalAmount),
    isManuallyAdjusted: day.isManuallyAdjusted,
    isLocked: day.isLocked,
    createdAt: day.createdAt.toISOString(),
    updatedAt: day.updatedAt.toISOString(),
  };
}
