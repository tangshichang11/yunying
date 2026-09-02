// ============================================================
// Forecast Algorithm Tests
// ============================================================

import {
  generateDailyForecast,
  validateDailyForecast,
  adjustDailyForecast,
} from '../algorithm';
import { WeeklyPattern } from '../historical/types';

describe('Forecast Algorithm', () => {
  describe('generateDailyForecast', () => {
    it('应生成指定月份的所有日期', () => {
      const result = generateDailyForecast('2026-09-01', 1000000);

      // 9月有30天
      expect(result.length).toBe(30);

      // 检查日期格式
      expect(result[0].date).toBe('2026-09-01');
      expect(result[29].date).toBe('2026-09-30');
    });

    it('应正确识别周末', () => {
      const result = generateDailyForecast('2026-09-01', 1000000);

      // 2026年9月1日是周二
      expect(result[0].dayOfWeek).toBe(2); // 周二
      expect(result[0].isWeekend).toBe(false);

      // 2026年9月5日是周六
      expect(result[4].dayOfWeek).toBe(6);
      expect(result[4].isWeekend).toBe(true);

      // 2026年9月6日是周日
      expect(result[5].dayOfWeek).toBe(0);
      expect(result[5].isWeekend).toBe(true);
    });

    it('应保证每日 Forecast 总和等于月度 Forecast', () => {
      const monthlyForecast = 1000000;
      const result = generateDailyForecast('2026-09-01', monthlyForecast);

      const sum = result.reduce((s, r) => s + r.expectedRevenue, 0);
      expect(sum).toBeCloseTo(monthlyForecast, 2);
    });

    it('应使用算法级别 4 (无历史数据)', () => {
      const result = generateDailyForecast('2026-09-01', 1000000);

      expect(result[0].algorithmLevel).toBe(4);
      expect(result[0].algorithmDescription).toBe('无历史数据，使用基础日历权重');
    });

    it('应使用算法级别 1 (有完整历史数据)', () => {
      // 模拟完整历史数据
      const weeklyPattern: WeeklyPattern = {
        dayOfWeekWeights: [0.12, 0.10, 0.12, 0.13, 0.14, 0.19, 0.20],
        weekendWeight: 0.32,
        weekdayWeight: 0.68,
        dayOfWeekAverages: [12000, 10000, 12000, 13000, 14000, 19000, 20000],
        dayOfWeekTotals: [24000, 20000, 24000, 26000, 28000, 38000, 40000],
        dayOfWeekCounts: [2, 2, 2, 2, 2, 2, 2], // 每种至少2天
      };

      const result = generateDailyForecast('2026-09-01', 1000000, weeklyPattern);

      expect(result[0].algorithmLevel).toBe(1);
      expect(result[0].algorithmDescription).toBe('使用历史同期数据');
    });
  });

  describe('validateDailyForecast', () => {
    it('应通过有效验证', () => {
      const result = generateDailyForecast('2026-09-01', 1000000);
      const validation = validateDailyForecast('2026-09-01', 1000000, result);

      // Debug output
      console.log('Validation:', {
        isValid: validation.isValid,
        monthlyForecast: validation.monthlyForecast,
        sumOfDaily: validation.sumOfDaily,
        difference: validation.difference,
        differencePercentage: validation.differencePercentage,
        errors: validation.errors,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.difference).toBeCloseTo(0, 2);
      expect(validation.errors.length).toBe(0);
    });

    it('应检测到大额差异', () => {
      const dailyForecasts = generateDailyForecast('2026-09-01', 1000000);
      // 故意修改一个值
      dailyForecasts[0].expectedRevenue = 100000;

      const validation = validateDailyForecast('2026-09-01', 1000000, dailyForecasts);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('adjustDailyForecast', () => {
    it('应调整单日金额并保持总额一致', () => {
      const original = generateDailyForecast('2026-09-01', 1000000);
      const originalSum = original.reduce((s, r) => s + r.expectedRevenue, 0);

      // 把第一天的金额从 X 改成 50000
      const adjusted = adjustDailyForecast(original, '2026-09-01', 50000, 1000000);
      const adjustedSum = adjusted.reduce((s, r) => s + r.expectedRevenue, 0);

      expect(adjustedSum).toBeCloseTo(originalSum, 2);
    });
  });

  describe('周末权重分析', () => {
    it('周末权重应高于工作日', () => {
      const result = generateDailyForecast('2026-09-01', 1000000);

      // 计算周末平均权重
      const weekendWeights = result
        .filter(r => r.isWeekend)
        .map(r => r.normalizedWeight);
      const weekdayWeights = result
        .filter(r => !r.isWeekend)
        .map(r => r.normalizedWeight);

      const avgWeekendWeight = weekendWeights.reduce((s, w) => s + w, 0) / weekendWeights.length;
      const avgWeekdayWeight = weekdayWeights.reduce((s, w) => s + w, 0) / weekdayWeights.length;

      expect(avgWeekendWeight).toBeGreaterThan(avgWeekdayWeight);
    });
  });
});
