// ============================================================
// 慧友酒店经营核算平台 - 核算引擎导出
// ============================================================

// 类型导出
export type {
  DailyAccountingInput,
  DailyAccountingResult,
  CostBreakdown,
  OperationalMetrics,
  AnomalyInfo,
  RuleValidation,
} from './types';

export { ZERO_VALUE_CONFIG, ANOMALY_THRESHOLDS } from './types';

// 函数导出
export {
  // 工具函数
  toNumber,
  roundMoney,
  calculatePercentage,
  calculateRate,
  isValidPositive,

  // 收入计算
  calculateTotalRevenue,

  // 成本计算
  calculateVariableCost,
  calculateLaborCost,
  calculateCommissionCost,
  calculateFixedCost,
  calculateEnergyCost,
  calculateTotalCost,

  // 运营指标
  calculateOperationalMetrics,

  // 异常检测
  detectRevenueAnomalies,
  detectCostAnomalies,

  // 核心计算
  calculateDailyAccounting,

  // 规则验证
  ACCOUNTING_RULES,
  validateAccountingRules,
} from './calculate';
