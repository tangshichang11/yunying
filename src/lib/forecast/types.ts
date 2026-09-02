// ============================================================
// 慧友酒店经营核算平台 - Forecast 算法类型
// ============================================================

/**
 * Forecast 拆解算法配置
 */
export interface ForecastAlgorithmConfig {
  // 算法级别 (1-4)
  level: 1 | 2 | 3 | 4;

  // 算法描述
  description: string;

  // 是否使用历史数据
  useHistoricalData: boolean;

  // 是否考虑周末
  considerWeekend: boolean;

  // 是否考虑节假日
  considerHoliday: boolean;
}

/**
 * Forecast 拆解结果
 */
export interface DailyForecastResult {
  date: string;              // YYYY-MM-DD
  dayOfWeek: number;         // 0-6
  isWeekend: boolean;
  isHoliday: boolean;
  expectedRevenue: number;     // 预测金额
  baseWeight: number;         // 基础权重
  normalizedWeight: number;   // 归一化权重
  algorithmLevel: number;      // 使用的算法级别
  algorithmDescription: string;
}

/**
 * Forecast 校验结果
 */
export interface ForecastValidation {
  isValid: boolean;
  monthlyForecast: number;    // 月度预定
  sumOfDaily: number;        // 每日合计
  difference: number;         // 差额
  differencePercentage: number; // 差额百分比
  adjustedFinalDay: string | null; // 被调整的最后一天（如果有）
  errors: string[];
}

/**
 * 节假日配置
 */
export interface HolidayConfig {
  year: number;
  holidays: {
    date: string;      // YYYY-MM-DD
    name: string;      // 节假日名称
    consecutiveDays: number; // 连休天数
  }[];
}
