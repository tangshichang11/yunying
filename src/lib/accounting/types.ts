// ============================================================
// 慧友酒店经营核算平台 - 核算引擎类型定义
// ============================================================

/**
 * 日核算输入
 * 所有字段都是可选的，兼容各种数据完整性场景
 */
export interface DailyAccountingInput {
  // 基本信息
  hotelId: string;
  businessDate: Date;

  // 收入
  roomRevenue?: number | null;      // 房费收入
  minibarRevenue?: number | null;   // 迷你吧收入
  foodRevenue?: number | null;      // 餐费收入
  otherRevenue?: number | null;     // 其他业务收入

  // 变动成本
  roomSuppliesCost?: number | null;    // 客房耗材
  frontDeskItemsCost?: number | null;   // 前台增值物品
  merchandiseCost?: number | null;      // 小商品
  laundryCost?: number | null;         // 洗涤费
  restaurantCost?: number | null;       // 餐厅成本
  otherVariableCost?: number | null;    // 其他变动成本

  // 人工成本
  frontDeskWages?: number | null;      // 前台工资
  housekeepingWages?: number | null;    // 客房工资
  restaurantWages?: number | null;      // 餐厅工资
  managementWages?: number | null;      // 管理工资

  // 提成成本
  reviewCommission?: number | null;         // 好评提成
  qrCommission?: number | null;              // 二维码提成
  memberCardCommission?: number | null;       // 会员卡提成
  housekeepingCommission?: number | null;    // 客房提成

  // 固定成本
  rent?: number | null;                    // 租金
  platformPromotionFee?: number | null;     // 平台推广费
  otherFixedCost?: number | null;           // 其他固定成本

  // 能耗
  electricityCost?: number | null;  // 电费
  waterCost?: number | null;        // 水费
  gasCost?: number | null;          // 天然气

  // 运营指标 (CONFIRMED 命名)
  soldRooms?: number | null;          // 实际出租房间数 (原 occupiedRooms)
  physicalRoomCount?: number | null;  // 物理总房间数 (原 actualRooms)
}

/**
 * 成本明细
 */
export interface CostBreakdown {
  variableCost: number;
  laborCost: number;
  commissionCost: number;
  fixedCost: number;
  energyCost: number;
  totalCost: number;
}

/**
 * 运营指标
 */
export interface OperationalMetrics {
  occupancyRate: number;  // 出租率
  avgRoomRate: number;     // 平均房价
  revpar: number;          // 每可供房收入
}

/**
 * 异常信息
 */
export interface AnomalyInfo {
  field: string;
  expectedValue: number;
  actualValue: number;
  deviationRate: number;
  severity: 'WARNING' | 'ERROR';
}

/**
 * 日核算结果
 */
export interface DailyAccountingResult {
  // 输入回显
  hotelId: string;
  businessDate: Date;

  // 收入
  roomRevenue: number;
  minibarRevenue: number;
  foodRevenue: number;
  otherRevenue: number;
  totalRevenue: number;

  // 成本分解
  variableCost: number;
  laborCost: number;
  commissionCost: number;
  fixedCost: number;
  energyCost: number;
  totalCost: number;

  // GOP (核心指标)
  gop: number;
  gopRate: number;

  // 运营指标
  occupancyRate: number;
  avgRoomRate: number;
  revpar: number;

  // 异常标记
  isRevenueAnomaly: boolean;
  isCostAnomaly: boolean;
  anomalies: AnomalyInfo[];

  // 计算元数据
  calculationVersion: string;
  calculatedAt: Date;

  // 输入数据快照（用于审计）
  inputSnapshot: DailyAccountingInput;
}

/**
 * 规则验证结果
 */
export interface RuleValidation {
  ruleId: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 零值处理配置
 */
export const ZERO_VALUE_CONFIG = {
  // 视为零值的字符串
  zeroStrings: ['0', '0.00', '-'],
  // 允许的最小正数（小于此值视为0）
  minPositiveValue: 0.001,
} as const;

/**
 * 异常检测阈值
 */
export const ANOMALY_THRESHOLDS = {
  // 收入异常：单日变化超过此比例触发 WARNING
  revenueWarningRate: 0.3,     // 30%
  // 收入异常：单日变化超过此比例触发 ERROR
  revenueErrorRate: 0.5,       // 50%
  // 成本异常：单日变化超过此比例触发 WARNING
  costWarningRate: 0.4,        // 40%
  // 成本异常：单日变化超过此比例触发 ERROR
  costErrorRate: 0.7,          // 70%
} as const;
