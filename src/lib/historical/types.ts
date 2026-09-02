// ============================================================
// 慧友酒店经营核算平台 - 历史数据模型
// Historical Reference Data Model
// ============================================================

/**
 * 日经营数据（来自 Excel 阿米巴核算表（日））
 */
export interface DailyRecord {
  // 日期
  date: string; // YYYY-MM-DD

  // 收入
  roomRevenue: number;           // 房费收入
  minibarRevenue: number;        // 迷你吧收入
  foodRevenue: number;           // 餐费收入
  otherRevenue: number;          // 其他业务收入
  totalRevenue: number;          // 收入合计

  // 变动成本
  roomSuppliesCost: number;      // 客房耗材
  frontDeskItemsCost: number;    // 前台增值物品
  merchandiseCost: number;       // 小商品成本
  restaurantCost: number;        // 餐厅
  laundryCost: number;           // 洗涤费
  totalVariableCost: number;     // 变动成本合计

  // 固定成本
  rent: number;                  // 租金
  propertyFee: number;           // 物业费
  insurance: number;             // 商业保险费
  networkFee: number;            // 有线网络费
  brandServiceFee: number;       // 品牌服务费
  totalFixedCost: number;        // 固定成本合计

  // 能耗
  electricityCost: number;       // 电费
  waterCost: number;             // 水费
  gasCost: number;               // 天然气费
  totalUtilityCost: number;      // 能耗合计

  // 人工成本（从其他 Sheet 获取）
  laborCost: number;             // 总人工成本

  // 提成成本
  commissionCost: number;        // 提成成本

  // 其他费用
  otherCost: number;             // 其他费用（银行手续费、推广费等）

  // 成本合计
  totalCost: number;             // 总成本

  // GOP
  gop: number;                   // 附加价值（利润）
  gopRate: number;               // 利润率

  // 运营指标
  soldRooms: number;             // 出租间数
  occupancyRate: number;         // 出租率
  adr: number;                   // 平均房价
  revpar: number;                // RevPAR

  // 人员
  staffCount: number;            // 人员数量
}

/**
 * 历史月度汇总数据
 */
export interface MonthlySummary {
  yearMonth: string; // YYYY-MM

  // 收入汇总
  totalRoomRevenue: number;
  totalMinibarRevenue: number;
  totalFoodRevenue: number;
  totalOtherRevenue: number;
  totalRevenue: number;

  // 成本汇总
  totalVariableCost: number;
  totalFixedCost: number;
  totalUtilityCost: number;
  totalLaborCost: number;
  totalCommissionCost: number;
  totalOtherCost: number;
  totalCost: number;

  // GOP
  totalGop: number;
  avgGopRate: number;

  // 运营指标（月均值）
  avgOccupancyRate: number;
  avgAdr: number;
  avgRevpar: number;

  // 出租间数
  totalSoldRooms: number;
  avgSoldRooms: number;

  // 成本结构分析
  costToRevenueRatio: number;    // 成本收入比
  variableCostRatio: number;     // 变动成本率
  fixedCostRatio: number;        // 固定成本率
  laborCostRatio: number;        // 人工成本率
  utilityCostRatio: number;      // 能耗率

  // 每日数据
  dailyRecords: DailyRecord[];

  // 数据统计
  daysCount: number;
  weekendDaysCount: number;
  weekdayDaysCount: number;
}

/**
 * 历史数据结构
 */
export interface HistoricalData {
  hotelId: string;
  hotelCode: string;
  hotelName: string;

  // 原始数据月份
  sourceYearMonth: string; // 来源数据的月份

  // 月度汇总
  monthlySummary: MonthlySummary;

  // 每周分布分析
  weeklyPattern: WeeklyPattern;

  // 成本结构
  costStructure: CostStructure;
}

/**
 * 每周分布模式
 */
export interface WeeklyPattern {
  // 星期几的平均权重 (0=周日, 1=周一, ..., 6=周六)
  dayOfWeekWeights: number[];  // 7 values, sum = 1

  // 周末 vs 工作日权重
  weekendWeight: number;       // 周六+周日合并权重
  weekdayWeight: number;       // 工作日权重

  // 实际数据
  dayOfWeekAverages: number[]; // 每日平均收入
  dayOfWeekTotals: number[];   // 每日总收入
  dayOfWeekCounts: number[];   // 出现次数
}

/**
 * 成本结构分析
 */
export interface CostStructure {
  // 各项成本占比 (相对于总收入)
  variableCostRatio: number;
  laborCostRatio: number;
  commissionCostRatio: number;
  fixedCostRatio: number;
  utilityCostRatio: number;
  otherCostRatio: number;

  // 单房成本
  costPerSoldRoom: number;     // 总成本 / 出租间数
  variableCostPerSoldRoom: number;
  laborCostPerSoldRoom: number;

  // 能耗指标
  electricityCostPerSoldRoom: number;
  avgElectricityPerDay: number;
}

/**
 * 日历权重（用于 Forecast 拆解）
 */
export interface CalendarWeight {
  date: string;           // YYYY-MM-DD
  dayOfWeek: number;      // 0-6 (周日开始)
  isWeekend: boolean;     // 是否周末
  isHoliday: boolean;     // 是否节假日
  weight: number;         // 权重 (归一化后)
  baseWeight: number;     // 基础权重（未归一化）
}
