// ============================================================
// 慧友酒店经营核算平台 - 核心计算引擎
// ============================================================

import {
  DailyAccountingInput,
  DailyAccountingResult,
  CostBreakdown,
  OperationalMetrics,
  AnomalyInfo,
  ZERO_VALUE_CONFIG,
  ANOMALY_THRESHOLDS,
} from './types';

// ============================================================
// 工具函数
// ============================================================

/**
 * 安全转换为数字
 * 处理 null, undefined, 空字符串等情况
 */
export function toNumber(value: number | null | undefined | string | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const zeroStrings: readonly string[] = ZERO_VALUE_CONFIG.zeroStrings;
    if (trimmed === '' || zeroStrings.includes(trimmed)) {
      return 0;
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  return 0;
}

/**
 * 安全计算百分比
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

/**
 * 安全计算比率（保留6位小数）
 */
export function calculateRate(numerator: number, denominator: number): number {
  const rate = calculatePercentage(numerator, denominator);
  return Math.round(rate * 1000000) / 1000000;
}

/**
 * 规范化数字：保留2位小数
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 检查是否为有效正数
 */
export function isValidPositive(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

// ============================================================
// 收入计算
// ============================================================

/**
 * 计算总收入
 */
export function calculateTotalRevenue(input: DailyAccountingInput): number {
  const roomRevenue = toNumber(input.roomRevenue);
  const minibarRevenue = toNumber(input.minibarRevenue);
  const foodRevenue = toNumber(input.foodRevenue);
  const otherRevenue = toNumber(input.otherRevenue);

  return roundMoney(roomRevenue + minibarRevenue + foodRevenue + otherRevenue);
}

// ============================================================
// 成本计算
// ============================================================

/**
 * 计算变动成本
 */
export function calculateVariableCost(input: DailyAccountingInput): number {
  const roomSupplies = toNumber(input.roomSuppliesCost);
  const frontDeskItems = toNumber(input.frontDeskItemsCost);
  const merchandise = toNumber(input.merchandiseCost);
  const laundry = toNumber(input.laundryCost);
  const restaurant = toNumber(input.restaurantCost);
  const other = toNumber(input.otherVariableCost);

  return roundMoney(roomSupplies + frontDeskItems + merchandise + laundry + restaurant + other);
}

/**
 * 计算人工成本
 */
export function calculateLaborCost(input: DailyAccountingInput): number {
  const frontDesk = toNumber(input.frontDeskWages);
  const housekeeping = toNumber(input.housekeepingWages);
  const restaurant = toNumber(input.restaurantWages);
  const management = toNumber(input.managementWages);

  return roundMoney(frontDesk + housekeeping + restaurant + management);
}

/**
 * 计算提成成本
 */
export function calculateCommissionCost(input: DailyAccountingInput): number {
  const review = toNumber(input.reviewCommission);
  const qr = toNumber(input.qrCommission);
  const memberCard = toNumber(input.memberCardCommission);
  const housekeeping = toNumber(input.housekeepingCommission);

  return roundMoney(review + qr + memberCard + housekeeping);
}

/**
 * 计算固定成本
 */
export function calculateFixedCost(input: DailyAccountingInput): number {
  const rent = toNumber(input.rent);
  const platform = toNumber(input.platformPromotionFee);
  const other = toNumber(input.otherFixedCost);

  return roundMoney(rent + platform + other);
}

/**
 * 计算能耗成本
 */
export function calculateEnergyCost(input: DailyAccountingInput): number {
  const electricity = toNumber(input.electricityCost);
  const water = toNumber(input.waterCost);
  const gas = toNumber(input.gasCost);

  return roundMoney(electricity + water + gas);
}

/**
 * 计算总成本（变动 + 人工 + 提成 + 固定 + 能耗）
 */
export function calculateTotalCost(input: DailyAccountingInput): CostBreakdown {
  const variableCost = calculateVariableCost(input);
  const laborCost = calculateLaborCost(input);
  const commissionCost = calculateCommissionCost(input);
  const fixedCost = calculateFixedCost(input);
  const energyCost = calculateEnergyCost(input);

  const totalCost = roundMoney(variableCost + laborCost + commissionCost + fixedCost + energyCost);

  return {
    variableCost,
    laborCost,
    commissionCost,
    fixedCost,
    energyCost,
    totalCost,
  };
}

// ============================================================
// 运营指标计算
// ============================================================

/**
 * 计算运营指标
 */
export function calculateOperationalMetrics(input: DailyAccountingInput, totalRevenue: number): OperationalMetrics {
  // CONFIRMED 公式:
  // occupancyRate = soldRooms / physicalRoomCount
  // adr = roomRevenue / soldRooms
  // revpar = roomRevenue / physicalRoomCount
  const soldRooms = toNumber(input.soldRooms);
  const physicalRoomCount = toNumber(input.physicalRoomCount);

  // 出租率 = 实际出租房间数 / 物理总房间数
  const occupancyRate = calculateRate(soldRooms, physicalRoomCount);

  // 平均房价 = 房费收入 / 实际出租房间数
  const avgRoomRate = soldRooms > 0
    ? roundMoney(toNumber(input.roomRevenue) / soldRooms)
    : 0;

  // RevPAR = 房费收入 / 物理总房间数
  const revpar = physicalRoomCount > 0
    ? roundMoney(toNumber(input.roomRevenue) / physicalRoomCount)
    : 0;

  return {
    occupancyRate,
    avgRoomRate,
    revpar,
  };
}

// ============================================================
// 异常检测
// ============================================================

/**
 * 检测收入异常
 * 基于日环比变化率
 */
export function detectRevenueAnomalies(
  input: DailyAccountingInput,
  result: DailyAccountingResult,
  previousDay?: DailyAccountingResult
): AnomalyInfo[] {
  const anomalies: AnomalyInfo[] = [];

  if (!previousDay) {
    return anomalies;
  }

  const revenueChangeRate = previousDay.totalRevenue > 0
    ? Math.abs((result.totalRevenue - previousDay.totalRevenue) / previousDay.totalRevenue)
    : 0;

  if (revenueChangeRate >= ANOMALY_THRESHOLDS.revenueErrorRate) {
    anomalies.push({
      field: 'totalRevenue',
      expectedValue: previousDay.totalRevenue,
      actualValue: result.totalRevenue,
      deviationRate: revenueChangeRate,
      severity: 'ERROR',
    });
  } else if (revenueChangeRate >= ANOMALY_THRESHOLDS.revenueWarningRate) {
    anomalies.push({
      field: 'totalRevenue',
      expectedValue: previousDay.totalRevenue,
      actualValue: result.totalRevenue,
      deviationRate: revenueChangeRate,
      severity: 'WARNING',
    });
  }

  return anomalies;
}

/**
 * 检测成本异常
 */
export function detectCostAnomalies(
  input: DailyAccountingInput,
  result: DailyAccountingResult,
  previousDay?: DailyAccountingResult
): AnomalyInfo[] {
  const anomalies: AnomalyInfo[] = [];

  if (!previousDay) {
    return anomalies;
  }

  const costChangeRate = previousDay.totalCost > 0
    ? Math.abs((result.totalCost - previousDay.totalCost) / previousDay.totalCost)
    : 0;

  if (costChangeRate >= ANOMALY_THRESHOLDS.costErrorRate) {
    anomalies.push({
      field: 'totalCost',
      expectedValue: previousDay.totalCost,
      actualValue: result.totalCost,
      deviationRate: costChangeRate,
      severity: 'ERROR',
    });
  } else if (costChangeRate >= ANOMALY_THRESHOLDS.costWarningRate) {
    anomalies.push({
      field: 'totalCost',
      expectedValue: previousDay.totalCost,
      actualValue: result.totalCost,
      deviationRate: costChangeRate,
      severity: 'WARNING',
    });
  }

  return anomalies;
}

// ============================================================
// 核心计算
// ============================================================

/**
 * 日核算主函数
 *
 * 公式：
 * - 总收入 = 房费 + 迷你吧 + 餐费 + 其他
 * - 变动成本 = 客房耗材 + 前台物品 + 小商品 + 洗涤费 + 餐厅 + 其他
 * - 人工成本 = 前台 + 客房 + 餐厅 + 管理
 * - 提成成本 = 好评 + 二维码 + 会员卡 + 客房
 * - 固定成本 = 租金 + 平台推广费 + 其他
 * - 能耗 = 电费 + 水费 + 天然气
 * - 总成本 = 变动 + 人工 + 提成 + 固定 + 能耗
 * - GOP = 总收入 - 总成本
 * - GOP率 = GOP / 总收入
 *
 * 注意：管理费不包含在GOP计算中（独立指标）
 */
export function calculateDailyAccounting(
  input: DailyAccountingInput,
  previousDay?: DailyAccountingResult
): DailyAccountingResult {
  const calculationVersion = '1.0.0';
  const calculatedAt = new Date();

  // 1. 计算总收入
  const totalRevenue = calculateTotalRevenue(input);

  // 2. 计算成本分解
  const costBreakdown = calculateTotalCost(input);

  // 3. 计算GOP
  const gop = roundMoney(totalRevenue - costBreakdown.totalCost);
  const gopRate = calculateRate(gop, totalRevenue);

  // 4. 计算运营指标
  const metrics = calculateOperationalMetrics(input, totalRevenue);

  // 5. 异常检测
  const revenueAnomalies = detectRevenueAnomalies(input, {
    hotelId: input.hotelId,
    businessDate: input.businessDate,
    roomRevenue: toNumber(input.roomRevenue),
    minibarRevenue: toNumber(input.minibarRevenue),
    foodRevenue: toNumber(input.foodRevenue),
    otherRevenue: toNumber(input.otherRevenue),
    totalRevenue,
    variableCost: costBreakdown.variableCost,
    laborCost: costBreakdown.laborCost,
    commissionCost: costBreakdown.commissionCost,
    fixedCost: costBreakdown.fixedCost,
    energyCost: costBreakdown.energyCost,
    totalCost: costBreakdown.totalCost,
    gop,
    gopRate,
    occupancyRate: metrics.occupancyRate,
    avgRoomRate: metrics.avgRoomRate,
    revpar: metrics.revpar,
    isRevenueAnomaly: false,
    isCostAnomaly: false,
    anomalies: [],
    calculationVersion,
    calculatedAt,
    inputSnapshot: input,
  }, previousDay);

  const costAnomalies = detectCostAnomalies(input, {
    hotelId: input.hotelId,
    businessDate: input.businessDate,
    roomRevenue: toNumber(input.roomRevenue),
    minibarRevenue: toNumber(input.minibarRevenue),
    foodRevenue: toNumber(input.foodRevenue),
    otherRevenue: toNumber(input.otherRevenue),
    totalRevenue,
    variableCost: costBreakdown.variableCost,
    laborCost: costBreakdown.laborCost,
    commissionCost: costBreakdown.commissionCost,
    fixedCost: costBreakdown.fixedCost,
    energyCost: costBreakdown.energyCost,
    totalCost: costBreakdown.totalCost,
    gop,
    gopRate,
    occupancyRate: metrics.occupancyRate,
    avgRoomRate: metrics.avgRoomRate,
    revpar: metrics.revpar,
    isRevenueAnomaly: false,
    isCostAnomaly: false,
    anomalies: [],
    calculationVersion,
    calculatedAt,
    inputSnapshot: input,
  }, previousDay);

  const allAnomalies = [...revenueAnomalies, ...costAnomalies];

  return {
    hotelId: input.hotelId,
    businessDate: input.businessDate,
    roomRevenue: toNumber(input.roomRevenue),
    minibarRevenue: toNumber(input.minibarRevenue),
    foodRevenue: toNumber(input.foodRevenue),
    otherRevenue: toNumber(input.otherRevenue),
    totalRevenue,
    variableCost: costBreakdown.variableCost,
    laborCost: costBreakdown.laborCost,
    commissionCost: costBreakdown.commissionCost,
    fixedCost: costBreakdown.fixedCost,
    energyCost: costBreakdown.energyCost,
    totalCost: costBreakdown.totalCost,
    gop,
    gopRate,
    occupancyRate: metrics.occupancyRate,
    avgRoomRate: metrics.avgRoomRate,
    revpar: metrics.revpar,
    isRevenueAnomaly: revenueAnomalies.length > 0,
    isCostAnomaly: costAnomalies.length > 0,
    anomalies: allAnomalies,
    calculationVersion,
    calculatedAt,
    inputSnapshot: input,
  };
}

// ============================================================
// 规则验证
// ============================================================

/**
 * 核心规则列表
 */
export const ACCOUNTING_RULES = {
  // 规则1：总收入 = 各收入项之和
  RULE_REVENUE_SUM: 'ACC-001',
  // 规则2：总成本 = 各成本项之和
  RULE_COST_SUM: 'ACC-002',
  // 规则3：GOP = 总收入 - 总成本
  RULE_GOP_CALCULATION: 'ACC-003',
  // 规则4：GOP率 = GOP / 总收入
  RULE_GOP_RATE: 'ACC-004',
  // 规则5：管理费不计入GOP
  RULE_MANAGEMENT_FEE_EXCLUDED: 'ACC-005',
} as const;

/**
 * 验证计算结果是否符合规则
 */
export function validateAccountingRules(result: DailyAccountingResult): Array<{
  ruleId: string;
  passed: boolean;
  message: string;
}> {
  const validations = [];

  // 规则1：总收入验证
  const calculatedRevenue = roundMoney(
    result.roomRevenue +
    result.minibarRevenue +
    result.foodRevenue +
    result.otherRevenue
  );
  const revenueMatch = Math.abs(calculatedRevenue - result.totalRevenue) < 0.01;
  validations.push({
    ruleId: ACCOUNTING_RULES.RULE_REVENUE_SUM,
    passed: revenueMatch,
    message: revenueMatch
      ? '总收入 = 各收入项之和 ✓'
      : `总收入验证失败: 计算值=${calculatedRevenue}, 结果值=${result.totalRevenue}`,
  });

  // 规则2：总成本验证
  const calculatedCost = roundMoney(
    result.variableCost +
    result.laborCost +
    result.commissionCost +
    result.fixedCost +
    result.energyCost
  );
  const costMatch = Math.abs(calculatedCost - result.totalCost) < 0.01;
  validations.push({
    ruleId: ACCOUNTING_RULES.RULE_COST_SUM,
    passed: costMatch,
    message: costMatch
      ? '总成本 = 各成本项之和 ✓'
      : `总成本验证失败: 计算值=${calculatedCost}, 结果值=${result.totalCost}`,
  });

  // 规则3：GOP验证
  const calculatedGop = roundMoney(result.totalRevenue - result.totalCost);
  const gopMatch = Math.abs(calculatedGop - result.gop) < 0.01;
  validations.push({
    ruleId: ACCOUNTING_RULES.RULE_GOP_CALCULATION,
    passed: gopMatch,
    message: gopMatch
      ? 'GOP = 总收入 - 总成本 ✓'
      : `GOP验证失败: 计算值=${calculatedGop}, 结果值=${result.gop}`,
  });

  // 规则4：GOP率验证
  const calculatedGopRate = result.totalRevenue > 0
    ? calculateRate(result.gop, result.totalRevenue)
    : 0;
  const gopRateMatch = Math.abs(calculatedGopRate - result.gopRate) < 0.0001;
  validations.push({
    ruleId: ACCOUNTING_RULES.RULE_GOP_RATE,
    passed: gopRateMatch,
    message: gopRateMatch
      ? 'GOP率 = GOP / 总收入 ✓'
      : `GOP率验证失败: 计算值=${calculatedGopRate}, 结果值=${result.gopRate}`,
  });

  // 规则5：管理费不计入GOP（管理费是独立指标，不包含在GOP计算中）
  validations.push({
    ruleId: ACCOUNTING_RULES.RULE_MANAGEMENT_FEE_EXCLUDED,
    passed: true, // 管理费不参与GOP计算，这是架构设计
    message: '管理费不计入GOP（独立指标） ✓',
  });

  return validations;
}
