// ============================================================
// Forecast 校验工具
// ============================================================

import { ValidationError, ValidationResult, ExcelImportRow } from './types';

/**
 * 获取某年月的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取日期对应的星期几
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * 检查是否是周末
 */
export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 校验 Excel 导入数据
 */
export function validateExcelImport(
  rows: ExcelImportRow[],
  providedMonthlyForecast?: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (rows.length === 0) {
    errors.push({
      type: 'DATE_RANGE_INVALID',
      message: '导入数据为空',
      details: '请确保 Excel 中包含有效的日期和金额数据',
    });
    return {
      isValid: false,
      errors,
      monthlyForecast: providedMonthlyForecast || 0,
      dailySum: 0,
      difference: 0,
    };
  }

  // 检查日期完整性和重复性
  const dates = new Set<string>();
  const dateSet = new Set<string>();

  for (const row of rows) {
    // 检查日期格式
    if (!row.date || !/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(row.date)) {
      errors.push({
        type: 'DATE_RANGE_INVALID',
        message: `日期格式无效: ${row.date}`,
        details: '日期应为 YYYY-MM-DD 或 YYYY/MM/DD 格式',
      });
      continue;
    }

    // 标准化日期
    const normalizedDate = row.date.replace(/\//g, '-');
    const [yearStr, monthStr, dayStr] = normalizedDate.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    // 检查日期是否有效
    const dateObj = new Date(year, month - 1, day);
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      errors.push({
        type: 'DATE_RANGE_INVALID',
        message: `无效日期: ${row.date}`,
        details: '日期不存在',
      });
      continue;
    }

    // 检查重复日期
    if (dates.has(normalizedDate)) {
      errors.push({
        type: 'DUPLICATE_DATE',
        message: `重复日期: ${row.date}`,
        details: '同一日期出现多次',
      });
    }
    dates.add(normalizedDate);
    dateSet.add(normalizedDate);
  }

  // 计算每日合计
  const dailySum = rows.reduce((sum, row) => sum + (row.revenue || 0), 0);

  // 如果提供了月度预告，校验合计是否一致
  let monthlyForecast = providedMonthlyForecast || 0;
  if (providedMonthlyForecast !== undefined) {
    const difference = providedMonthlyForecast - dailySum;
    if (Math.abs(difference) > 0.01) {
      errors.push({
        type: 'SUM_MISMATCH',
        message: `月度预定与每日合计不一致`,
        details: `差额: ¥${difference.toFixed(2)}`,
      });
    }
  }

  // 检查负数
  for (const row of rows) {
    if (row.revenue < 0) {
      errors.push({
        type: 'NEGATIVE_VALUE',
        message: `金额为负数: ${row.date}`,
        details: `金额: ¥${row.revenue.toFixed(2)}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    monthlyForecast,
    dailySum,
    difference: monthlyForecast - dailySum,
  };
}

/**
 * 校验 Forecast 月度数据完整性
 */
export function validateForecastMonth(
  dailyForecasts: Array<{ businessDate: string | Date; finalAmount: number; isLocked?: boolean }>,
  monthlyForecast: number,
  year: number,
  month: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const expectedDays = getDaysInMonth(year, month);

  // 检查日期数量
  if (dailyForecasts.length !== expectedDays) {
    errors.push({
      type: 'DATE_RANGE_INVALID',
      message: `日期不完整: 预期 ${expectedDays} 天，实际 ${dailyForecasts.length} 天`,
      details: `缺少 ${expectedDays - dailyForecasts.length} 天数据`,
    });
  }

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (d: string | Date): string => {
    if (d instanceof Date) {
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dy}-${dm}-${dd}`;
    }
    // 如果是字符串，尝试解析
    if (typeof d === 'string') {
      // 已经是 YYYY-MM-DD 格式
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return d;
      }
      // ISO 格式
      return d.split('T')[0];
    }
    return '';
  };

  // 收集并排序日期
  const dates = new Set<string>();
  for (const day of dailyForecasts) {
    const dateStr = formatDate(day.businessDate);
    dates.add(dateStr);
  }

  // 检查是否缺少日期
  for (let d = 1; d <= expectedDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!dates.has(dateStr)) {
      errors.push({
        type: 'MISSING_DATE',
        message: `缺少日期: ${dateStr}`,
        details: `${month}月应该有 ${expectedDays} 天数据`,
      });
    }
  }

  // 检查重复日期
  const uniqueDates = new Set(dates);
  if (uniqueDates.size !== dates.size) {
    errors.push({
      type: 'DUPLICATE_DATE',
      message: '存在重复日期',
    });
  }

  // 检查负数
  for (const day of dailyForecasts) {
    if (day.finalAmount < 0) {
      errors.push({
        type: 'NEGATIVE_VALUE',
        message: `金额为负数: ${day.businessDate}`,
        details: `金额: ¥${day.finalAmount.toFixed(2)}`,
      });
    }
  }

  // 计算每日合计
  const dailySum = dailyForecasts.reduce((sum, day) => sum + day.finalAmount, 0);
  const difference = monthlyForecast - dailySum;

  // 检查合计是否一致
  if (Math.abs(difference) > 0.01) {
    errors.push({
      type: 'SUM_MISMATCH',
      message: `月度预定与每日合计不一致`,
      details: `差额: ¥${difference.toFixed(2)}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    monthlyForecast,
    dailySum,
    difference,
  };
}

/**
 * 校验是否可以提交
 */
export function canSubmit(
  dailyForecasts: Array<{ finalAmount: number }>,
  monthlyForecast: number
): ValidationResult {
  return validateForecastMonth(
    dailyForecasts.map((f) => ({
      businessDate: '',
      finalAmount: f.finalAmount,
    })),
    monthlyForecast,
    0,
    0
  );
}
