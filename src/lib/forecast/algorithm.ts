// ============================================================
// 慧友酒店经营核算平台 - Forecast 智能拆解算法
// ============================================================

import { ForecastAlgorithmConfig, DailyForecastResult, ForecastValidation } from './types';
import { WeeklyPattern } from '../historical/types';

/**
 * 生成指定月份的天数
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 生成月份的所有日期
 */
function generateMonthDates(yearMonth: string): { date: string; dayOfWeek: number; isWeekend: boolean }[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // JS months are 0-indexed
  const daysInMonth = getDaysInMonth(year, month);

  const dates: { date: string; dayOfWeek: number; isWeekend: boolean }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    dates.push({ date: dateStr, dayOfWeek, isWeekend });
  }

  return dates;
}

/**
 * 获取默认日历权重（当没有历史数据时使用）
 * 基于行业普遍规律：
 * - 周末收入通常高于工作日
 * - 周五、周六最高
 * - 周日次之
 * - 周一最低
 */
function getDefaultCalendarWeights(): number[] {
  // 默认权重: [周日, 周一, 周二, 周三, 周四, 周五, 周六]
  // 基于酒店行业普遍规律
  return [0.12, 0.10, 0.12, 0.13, 0.14, 0.19, 0.20];
}

/**
 * 根据历史数据计算权重
 */
function calculateWeightsFromHistorical(
  weeklyPattern: WeeklyPattern
): number[] {
  // 直接使用历史数据计算的实际权重
  const weights = [...weeklyPattern.dayOfWeekWeights];

  // 检查是否有有效数据
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0 || !isFinite(totalWeight)) {
    return getDefaultCalendarWeights();
  }

  return weights;
}

/**
 * 基础日历权重
 */
function getBaseCalendarWeights(): number[] {
  return getDefaultCalendarWeights();
}

/**
 * 根据历史数据调整权重（考虑样本量）
 */
function adjustWeightsWithHistorical(
  baseWeights: number[],
  historicalWeights: number[],
  historicalCounts: number[]
): number[] {
  // 如果历史数据太少，偏向基础权重
  const totalHistoricalDays = historicalCounts.reduce((sum, c) => sum + c, 0);
  const minDaysForTrust = 10; // 至少需要10天数据才信任历史

  if (totalHistoricalDays < minDaysForTrust) {
    // 历史数据不足，混合使用
    const historicalWeight = totalHistoricalDays / minDaysForTrust;
    const baseWeight = 1 - historicalWeight;

    return baseWeights.map((base, idx) => {
      const hist = historicalWeights[idx] || 0;
      return base * baseWeight + hist * historicalWeight;
    });
  }

  return historicalWeights;
}

/**
 * 选择算法级别
 */
function selectAlgorithmLevel(
  hasHistoricalData: boolean,
  hasSufficientData: boolean,
  historicalCounts: number[]
): ForecastAlgorithmConfig {
  const totalDays = historicalCounts.reduce((sum, c) => sum + c, 0);

  // Level 1: 有足够历史数据（至少有一个完整周）
  if (hasHistoricalData && totalDays >= 7) {
    return {
      level: 1,
      description: '使用历史同期数据',
      useHistoricalData: true,
      considerWeekend: true,
      considerHoliday: false,
    };
  }

  // Level 2: 有部分历史数据
  if (hasHistoricalData && totalDays >= 3) {
    return {
      level: 2,
      description: '使用历史数据（数据量不足，降级）',
      useHistoricalData: true,
      considerWeekend: true,
      considerHoliday: false,
    };
  }

  // Level 3: 历史数据极少，使用星期结构
  if (hasHistoricalData) {
    return {
      level: 3,
      description: '历史数据极少，使用星期结构',
      useHistoricalData: false,
      considerWeekend: true,
      considerHoliday: false,
    };
  }

  // Level 4: 无历史数据
  return {
    level: 4,
    description: '无历史数据，使用基础日历权重',
    useHistoricalData: false,
    considerWeekend: true,
    considerHoliday: false,
  };
}

/**
 * 生成每日 Forecast
 */
export function generateDailyForecast(
  yearMonth: string,
  monthlyForecast: number,
  weeklyPattern?: WeeklyPattern
): DailyForecastResult[] {
  const dates = generateMonthDates(yearMonth);
  const daysInMonth = dates.length;

  // 选择算法
  const hasHistoricalData = weeklyPattern !== undefined;
  const historicalCounts = weeklyPattern?.dayOfWeekCounts || [0, 0, 0, 0, 0, 0, 0];
  const hasSufficientData = hasHistoricalData && historicalCounts.reduce((s, c) => s + c, 0) >= daysInMonth;

  const algorithm = selectAlgorithmLevel(hasHistoricalData, hasSufficientData, historicalCounts);

  // 计算基础权重
  let baseWeights: number[];

  if (algorithm.useHistoricalData && weeklyPattern) {
    const historicalWeights = calculateWeightsFromHistorical(weeklyPattern);
    const defaultWeights = getBaseCalendarWeights();
    baseWeights = adjustWeightsWithHistorical(defaultWeights, historicalWeights, historicalCounts);
  } else {
    baseWeights = getBaseCalendarWeights();
  }

  // 计算每个月各星期几的出现次数
  const dayOfWeekCountsInMonth = [0, 0, 0, 0, 0, 0, 0]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  for (const { dayOfWeek } of dates) {
    dayOfWeekCountsInMonth[dayOfWeek]++;
  }

  // 计算考虑实际天数后的日权重
  // 原始权重是"周权重"（一周内的分布），需要转换为"日权重"（一天占月总额的比例）
  // 转换方法：weekly_weight / 7 = daily_rate（该天占一周的比例）
  // 再乘以该天在月中出现的次数，并归一化
  const weeklyToDaily = baseWeights.map(w => w / 7); // 转换为日权重
  const monthlyAdjustedDailyWeights = weeklyToDaily.map((w, idx) => w * dayOfWeekCountsInMonth[idx]);
  const totalMonthlyDailyWeight = monthlyAdjustedDailyWeights.reduce((sum, w) => sum + w, 0);

  // 生成每日预测
  const dailyForecasts: DailyForecastResult[] = [];

  for (const { date, dayOfWeek, isWeekend } of dates) {
    // 日权重 = (该天周权重 / 7) × 月中出现次数 / 总日权重
    // 但这样得到的是"该类型天"的总比例，需要除以该类型天的出现次数才是单日比例
    const perDayWeight = totalMonthlyDailyWeight > 0
      ? (monthlyAdjustedDailyWeights[dayOfWeek] / dayOfWeekCountsInMonth[dayOfWeek]) / totalMonthlyDailyWeight
      : weeklyToDaily[dayOfWeek];
    const baseWeight = perDayWeight;

    dailyForecasts.push({
      date,
      dayOfWeek,
      isWeekend,
      isHoliday: false, // TODO: 节假日识别
      expectedRevenue: 0, // 先计算权重
      baseWeight,
      normalizedWeight: perDayWeight,
      algorithmLevel: algorithm.level,
      algorithmDescription: algorithm.description,
    });
  }

  // 计算每天的实际金额
  // 使用整数运算（以分为单位）避免浮点数精度问题
  const monthlyInCents = Math.round(monthlyForecast * 100);
  let allocatedTotalCents = 0;

  for (let i = 0; i < dailyForecasts.length; i++) {
    if (i < dailyForecasts.length - 1) {
      // 以分为单位计算，然后转回元
      const amountCents = Math.round(monthlyInCents * dailyForecasts[i].normalizedWeight);
      const amount = amountCents / 100;
      dailyForecasts[i].expectedRevenue = amount;
      allocatedTotalCents += amountCents;
    }
  }

  // 最后一天 = 总计 - 已分配（确保总额精确一致，不四舍五入）
  const lastDayAmountCents = monthlyInCents - allocatedTotalCents;
  dailyForecasts[daysInMonth - 1].expectedRevenue = lastDayAmountCents / 100;

  return dailyForecasts;
}

/**
 * 校验 Forecast 总计
 */
export function validateDailyForecast(
  yearMonth: string,
  monthlyForecast: number,
  dailyForecasts: DailyForecastResult[]
): ForecastValidation {
  const sumOfDaily = dailyForecasts.reduce((sum, df) => sum + df.expectedRevenue, 0);
  const difference = monthlyForecast - sumOfDaily;
  const differencePercentage = monthlyForecast > 0 ? Math.abs(difference) / monthlyForecast : 0;

  const errors: string[] = [];

  // 检查是否有异常大的差异
  if (differencePercentage > 0.01) { // 超过1%
    errors.push(`差额过大: ¥${difference.toFixed(2)} (${(differencePercentage * 100).toFixed(2)}%)`);
  }

  // 检查是否每一天都有值
  for (let i = 0; i < dailyForecasts.length; i++) {
    if (dailyForecasts[i].expectedRevenue < 0) {
      errors.push(`Day ${i + 1} 金额为负数`);
    }
  }

  return {
    isValid: errors.length === 0,
    monthlyForecast,
    sumOfDaily: Math.round(sumOfDaily * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    differencePercentage: Math.round(differencePercentage * 10000) / 10000,
    adjustedFinalDay: difference !== 0 ? dailyForecasts[dailyForecasts.length - 1].date : null,
    errors,
  };
}

/**
 * 调整单日金额（用于店长手动修改）
 */
export function adjustDailyForecast(
  dailyForecasts: DailyForecastResult[],
  date: string,
  newAmount: number,
  monthlyForecast: number
): DailyForecastResult[] {
  const index = dailyForecasts.findIndex(df => df.date === date);
  if (index === -1) {
    throw new Error(`Date ${date} not found`);
  }

  const oldAmount = dailyForecasts[index].expectedRevenue;
  const difference = newAmount - oldAmount;

  // 更新被调整的日期
  const updated = [...dailyForecasts];
  updated[index] = { ...updated[index], expectedRevenue: newAmount };

  // 调整最后一天以保持总额不变
  const lastIndex = updated.length - 1;
  if (lastIndex !== index) {
    updated[lastIndex] = {
      ...updated[lastIndex],
      expectedRevenue: updated[lastIndex].expectedRevenue - difference,
    };
  }

  return updated;
}

/**
 * 重新归一化权重（当手动调整后需要重新计算）
 */
export function renormalizeDailyForecast(
  dailyForecasts: DailyForecastResult[],
  monthlyForecast: number
): DailyForecastResult[] {
  const total = dailyForecasts.reduce((sum, df) => sum + df.expectedRevenue, 0);
  if (total === 0) return dailyForecasts;

  const ratio = monthlyForecast / total;

  return dailyForecasts.map(df => ({
    ...df,
    normalizedWeight: df.normalizedWeight * ratio,
  }));
}
