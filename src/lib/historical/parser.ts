// ============================================================
// 慧友酒店经营核算平台 - 历史数据解析器
// Historical Data Parser
// 从 Excel 阿米巴核算表（日）解析历史数据
// ============================================================

import { DailyRecord, HistoricalData, MonthlySummary, WeeklyPattern, CostStructure } from './types';

/**
 * Excel 行号到字段的映射
 * 基于对阿米巴核算表（日）的分析
 */
const ROW_MAPPING: Record<number, { field: keyof DailyRecord; section: string }> = {
  5: { field: 'soldRooms', section: 'keyMetrics' },
  6: { field: 'adr', section: 'keyMetrics' },
  7: { field: 'revpar', section: 'keyMetrics' },
  8: { field: 'roomRevenue', section: 'revenue' },
  9: { field: 'minibarRevenue', section: 'revenue' },
  10: { field: 'foodRevenue', section: 'revenue' },
  11: { field: 'otherRevenue', section: 'revenue' },
  12: { field: 'totalRevenue', section: 'revenue' },
  13: { field: 'roomSuppliesCost', section: 'variableCost' },
  14: { field: 'frontDeskItemsCost', section: 'variableCost' },
  15: { field: 'merchandiseCost', section: 'variableCost' },
  16: { field: 'restaurantCost', section: 'variableCost' },
  17: { field: 'laundryCost', section: 'variableCost' },
  18: { field: 'electricityCost', section: 'utility' },
  19: { field: 'waterCost', section: 'utility' },
  20: { field: 'gasCost', section: 'utility' },
  23: { field: 'rent', section: 'fixedCost' },
  24: { field: 'propertyFee', section: 'fixedCost' },
  25: { field: 'insurance', section: 'fixedCost' },
  26: { field: 'networkFee', section: 'fixedCost' },
  27: { field: 'brandServiceFee', section: 'fixedCost' },
  41: { field: 'totalCost', section: 'summary' },
  42: { field: 'gop', section: 'summary' },
  43: { field: 'staffCount', section: 'staff' },
};

const COST_ROW_MAPPING: Record<number, { field: keyof DailyRecord; section: string }> = {
  32: { field: 'otherCost', section: 'otherCost' }, // 银行手续费
  37: { field: 'otherCost', section: 'otherCost' }, // POS手续费
  38: { field: 'otherCost', section: 'otherCost' }, // 推广费
};

/**
 * 从 Excel 读取历史数据
 * @param filePath Excel 文件路径
 * @param sheetName Sheet 名称
 * @param yearMonth 目标年月 (YYYY-MM)
 */
export async function parseHistoricalExcel(
  filePath: string,
  sheetName: string = '阿米巴核算表（日）',
  yearMonth: string = '2024-05'
): Promise<HistoricalData> {
  // 动态导入 xlsx
  const XLSX = await import('xlsx');

  const workbook = XLSX.readFile(filePath, { dataOnly: true } as any);
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);
  }

  // 转换为 JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  // 解析每日数据
  const dailyRecords = parseDailyData(jsonData, yearMonth);

  // 计算月度汇总
  const monthlySummary = calculateMonthlySummary(dailyRecords, yearMonth);

  // 计算每周分布
  const weeklyPattern = calculateWeeklyPattern(dailyRecords);

  // 计算成本结构
  const costStructure = calculateCostStructure(dailyRecords, monthlySummary);

  return {
    hotelId: '', // 后续从数据库查询
    hotelCode: 'LK-YZ-001', // 龙口悦致
    hotelName: '龙口悦致酒店',
    sourceYearMonth: yearMonth,
    monthlySummary,
    weeklyPattern,
    costStructure,
  };
}

/**
 * 解析每日数据
 */
function parseDailyData(jsonData: any[][], yearMonth: string): DailyRecord[] {
  const records: DailyRecord[] = [];
  const year = parseInt(yearMonth.split('-')[0]);
  const month = parseInt(yearMonth.split('-')[1]);

  // 每天有4列数据: 预定业绩, 实绩业绩, 差异金额, 差异占比
  // 从第4列(索引3)开始，每4列一天

  for (let day = 1; day <= 31; day++) {
    const colStart = 3 + (day - 1) * 4; // 0-indexed

    // 检查这天的数据是否存在
    if (colStart + 1 >= jsonData[0].length) break;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr);

    // 跳过无效日期
    if (isNaN(date.getTime())) continue;

    // 获取各字段数据
    const getRowValue = (rowIndex: number): number => {
      if (rowIndex >= jsonData.length) return 0;
      const row = jsonData[rowIndex];
      if (!row || colStart + 1 >= row.length) return 0;
      const val = row[colStart + 1]; // 实绩业绩列
      return typeof val === 'number' ? val : 0;
    };

    const soldRooms = getRowValue(4);
    const adr = getRowValue(5);
    const revpar = getRowValue(6);
    const roomRevenue = getRowValue(7);
    const minibarRevenue = getRowValue(8);
    const foodRevenue = getRowValue(9);
    const otherRevenue = getRowValue(10);
    const totalRevenue = getRowValue(11);
    const roomSuppliesCost = getRowValue(12);
    const frontDeskItemsCost = getRowValue(13);
    const merchandiseCost = getRowValue(14);
    const restaurantCost = getRowValue(15);
    const laundryCost = getRowValue(16);
    const electricityCost = getRowValue(17);
    const waterCost = getRowValue(18);
    const gasCost = getRowValue(19);
    const rent = getRowValue(22);
    const propertyFee = getRowValue(23);
    const insurance = getRowValue(24);
    const networkFee = getRowValue(25);
    const brandServiceFee = getRowValue(26);
    const totalCost = getRowValue(40);
    const gop = getRowValue(41);
    const staffCount = getRowValue(42);

    // 计算变动成本合计
    const totalVariableCost = roomSuppliesCost + frontDeskItemsCost + merchandiseCost + restaurantCost + laundryCost;

    // 计算固定成本合计
    const totalFixedCost = rent + propertyFee + insurance + networkFee + brandServiceFee;

    // 计算能耗合计
    const totalUtilityCost = electricityCost + waterCost + gasCost;

    // 计算利润率
    const gopRate = totalRevenue > 0 ? gop / totalRevenue : 0;

    // 计算出租率（需要 physicalRoomCount）
    // 暂时用 soldRooms / 120 (120 是龙口悦致的房间数)
    const physicalRoomCount = 120;
    const occupancyRate = physicalRoomCount > 0 ? soldRooms / physicalRoomCount : 0;

    records.push({
      date: dateStr,
      roomRevenue,
      minibarRevenue,
      foodRevenue,
      otherRevenue,
      totalRevenue,
      roomSuppliesCost,
      frontDeskItemsCost,
      merchandiseCost,
      restaurantCost,
      laundryCost,
      totalVariableCost,
      rent,
      propertyFee,
      insurance,
      networkFee,
      brandServiceFee,
      totalFixedCost,
      electricityCost,
      waterCost,
      gasCost,
      totalUtilityCost,
      laborCost: 0, // 需要从其他 Sheet 获取
      commissionCost: 0, // 需要从其他 Sheet 获取
      otherCost: 0, // 需要解析
      totalCost,
      gop,
      gopRate,
      soldRooms,
      occupancyRate,
      adr,
      revpar,
      staffCount,
    });
  }

  return records;
}

/**
 * 计算月度汇总
 */
function calculateMonthlySummary(records: DailyRecord[], yearMonth: string): MonthlySummary {
  if (records.length === 0) {
    return {
      yearMonth,
      totalRoomRevenue: 0,
      totalMinibarRevenue: 0,
      totalFoodRevenue: 0,
      totalOtherRevenue: 0,
      totalRevenue: 0,
      totalVariableCost: 0,
      totalFixedCost: 0,
      totalUtilityCost: 0,
      totalLaborCost: 0,
      totalCommissionCost: 0,
      totalOtherCost: 0,
      totalCost: 0,
      totalGop: 0,
      avgGopRate: 0,
      avgOccupancyRate: 0,
      avgAdr: 0,
      avgRevpar: 0,
      totalSoldRooms: 0,
      avgSoldRooms: 0,
      dailyRecords: [],
      daysCount: 0,
      weekendDaysCount: 0,
      weekdayDaysCount: 0,
      costToRevenueRatio: 0,
      variableCostRatio: 0,
      fixedCostRatio: 0,
      laborCostRatio: 0,
      utilityCostRatio: 0,
    };
  }

  // 汇总各项数据
  let totalRoomRevenue = 0;
  let totalMinibarRevenue = 0;
  let totalFoodRevenue = 0;
  let totalOtherRevenue = 0;
  let totalRevenue = 0;
  let totalVariableCost = 0;
  let totalFixedCost = 0;
  let totalUtilityCost = 0;
  let totalLaborCost = 0;
  let totalCost = 0;
  let totalGop = 0;
  let totalSoldRooms = 0;
  let weekendDaysCount = 0;
  let weekdayDaysCount = 0;

  for (const record of records) {
    totalRoomRevenue += record.roomRevenue;
    totalMinibarRevenue += record.minibarRevenue;
    totalFoodRevenue += record.foodRevenue;
    totalOtherRevenue += record.otherRevenue;
    totalRevenue += record.totalRevenue;
    totalVariableCost += record.totalVariableCost;
    totalFixedCost += record.totalFixedCost;
    totalUtilityCost += record.totalUtilityCost;
    totalLaborCost += record.laborCost;
    totalCost += record.totalCost;
    totalGop += record.gop;
    totalSoldRooms += record.soldRooms;

    const date = new Date(record.date);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDaysCount++;
    } else {
      weekdayDaysCount++;
    }
  }

  const daysCount = records.length;
  const avgGopRate = totalRevenue > 0 ? totalGop / totalRevenue : 0;
  const avgOccupancyRate = records.reduce((sum, r) => sum + r.occupancyRate, 0) / daysCount;
  const avgAdr = totalSoldRooms > 0 ? totalRoomRevenue / totalSoldRooms : 0;
  const avgRevpar = avgOccupancyRate * avgAdr;
  const avgSoldRooms = totalSoldRooms / daysCount;

  const costToRevenueRatio = totalRevenue > 0 ? totalCost / totalRevenue : 0;
  const variableCostRatio = totalRevenue > 0 ? totalVariableCost / totalRevenue : 0;
  const fixedCostRatio = totalRevenue > 0 ? totalFixedCost / totalRevenue : 0;
  const laborCostRatio = totalRevenue > 0 ? totalLaborCost / totalRevenue : 0;
  const utilityCostRatio = totalRevenue > 0 ? totalUtilityCost / totalRevenue : 0;

  return {
    yearMonth,
    totalRoomRevenue,
    totalMinibarRevenue,
    totalFoodRevenue,
    totalOtherRevenue,
    totalRevenue,
    totalVariableCost,
    totalFixedCost,
    totalUtilityCost,
    totalLaborCost: 0,
    totalCommissionCost: 0,
    totalOtherCost: 0,
    totalCost,
    totalGop,
    avgGopRate,
    avgOccupancyRate,
    avgAdr,
    avgRevpar,
    totalSoldRooms,
    avgSoldRooms,
    dailyRecords: records,
    daysCount,
    weekendDaysCount,
    weekdayDaysCount,
    costToRevenueRatio,
    variableCostRatio,
    fixedCostRatio,
    laborCostRatio,
    utilityCostRatio,
  };
}

/**
 * 计算每周分布模式
 */
function calculateWeeklyPattern(records: DailyRecord[]): WeeklyPattern {
  // 初始化每天的数据
  const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];

  // 累加每天的收入
  for (const record of records) {
    const date = new Date(record.date);
    const dayOfWeek = date.getDay();
    dayOfWeekTotals[dayOfWeek] += record.totalRevenue;
    dayOfWeekCounts[dayOfWeek]++;
  }

  // 计算每天的平均收入
  const dayOfWeekAverages = dayOfWeekTotals.map((total, idx) =>
    dayOfWeekCounts[idx] > 0 ? total / dayOfWeekCounts[idx] : 0
  );

  // 计算总权重
  const totalRevenue = dayOfWeekTotals.reduce((sum, val) => sum + val, 0);

  // 计算权重（归一化）
  const dayOfWeekWeights = dayOfWeekAverages.map(avg => totalRevenue > 0 ? avg / totalRevenue : 0);

  // 计算周末和工作日权重
  // 周日 = 0, 周六 = 6
  const sundayWeight = dayOfWeekWeights[0];
  const saturdayWeight = dayOfWeekWeights[6];
  const weekendWeight = sundayWeight + saturdayWeight;
  const weekdayWeight = dayOfWeekWeights[1] + dayOfWeekWeights[2] + dayOfWeekWeights[3] + dayOfWeekWeights[4] + dayOfWeekWeights[5];

  return {
    dayOfWeekWeights,
    weekendWeight,
    weekdayWeight,
    dayOfWeekAverages,
    dayOfWeekTotals,
    dayOfWeekCounts,
  };
}

/**
 * 计算成本结构
 */
function calculateCostStructure(records: DailyRecord[], monthlySummary: MonthlySummary): CostStructure {
  const totalRevenue = monthlySummary.totalRevenue;
  const totalSoldRooms = monthlySummary.totalSoldRooms;

  // 各项成本占比
  const variableCostRatio = totalRevenue > 0 ? monthlySummary.totalVariableCost / totalRevenue : 0;
  const fixedCostRatio = totalRevenue > 0 ? monthlySummary.totalFixedCost / totalRevenue : 0;
  const utilityCostRatio = totalRevenue > 0 ? monthlySummary.totalUtilityCost / totalRevenue : 0;
  const laborCostRatio = totalRevenue > 0 ? monthlySummary.totalLaborCost / totalRevenue : 0;

  // 单房成本
  const costPerSoldRoom = totalSoldRooms > 0 ? monthlySummary.totalCost / totalSoldRooms : 0;
  const variableCostPerSoldRoom = totalSoldRooms > 0 ? monthlySummary.totalVariableCost / totalSoldRooms : 0;
  const laborCostPerSoldRoom = totalSoldRooms > 0 ? monthlySummary.totalLaborCost / totalSoldRooms : 0;

  // 能耗指标
  const electricityCostPerSoldRoom = totalSoldRooms > 0 ? monthlySummary.totalUtilityCost / totalSoldRooms : 0;
  const avgElectricityPerDay = records.length > 0
    ? records.reduce((sum, r) => sum + r.electricityCost, 0) / records.length
    : 0;

  return {
    variableCostRatio,
    laborCostRatio,
    commissionCostRatio: 0,
    fixedCostRatio,
    utilityCostRatio,
    otherCostRatio: 0,
    costPerSoldRoom,
    variableCostPerSoldRoom,
    laborCostPerSoldRoom,
    electricityCostPerSoldRoom,
    avgElectricityPerDay,
  };
}
