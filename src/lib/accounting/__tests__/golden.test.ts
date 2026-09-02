// ============================================================
// 慧友酒店经营核算平台 - Golden Test
// 使用真实龙口悦致酒店 Excel 数据
// ============================================================

import { calculateDailyAccounting, validateAccountingRules, toNumber } from '../calculate';

/**
 * 龙口悦致酒店 - 8月1日实际数据
 * 来源: 龙口悦致.xlsx
 */
const LONGKOU_DAY1_AUGUST: Parameters<typeof calculateDailyAccounting>[0] = {
  hotelId: 'longkou-yuezhi',
  businessDate: new Date('2026-08-01'),

  // 收入
  roomRevenue: 37739.01,
  minibarRevenue: 0,
  foodRevenue: 0,
  otherRevenue: 0,

  // 变动成本
  roomSuppliesCost: 1071.937,       // 客房耗材
  frontDeskItemsCost: 36.4417,       // 前台增值物品
  merchandiseCost: 0,               // 小商品
  laundryCost: 845.4,               // 洗涤费
  restaurantCost: 410,               // 餐厅
  otherVariableCost: 0,

  // 人工成本 - 待确认，无法从Excel验证
  frontDeskWages: 0,
  housekeepingWages: 0,
  restaurantWages: 0,
  managementWages: 0,

  // 提成成本 - 待确认，无法从Excel验证
  reviewCommission: 0,
  qrCommission: 0,
  memberCardCommission: 0,
  housekeepingCommission: 0,

  // 固定成本
  rent: 6251.22580645161,           // 租金
  platformPromotionFee: 0,          // 平台推广费
  otherFixedCost: 0,               // 其他固定成本（物业/保险等）

  // 能耗
  electricityCost: 2754.8675,       // 电费
  waterCost: 169.6,                 // 水费
  gasCost: 0,                       // 天然气

  // 运营指标
  soldRooms: 146,                  // 实际出租房间数
  physicalRoomCount: 133,          // 物理总房间数
};

/**
 * 龙口悦致酒店 - 8月1日 Excel原始数据（用于对比验证）
 */
const LONGKOU_DAY1_EXCEL = {
  入住间数: 146,
  实际间数: 133,
  房费收入: 37739.01,
  收入合计: 37739.01,
  客房耗材: 1071.937,
  前台增值物品: 36.4417,
  小商品成本: 0,
  餐厅: 410,
  洗涤费: 845.4,
  电费: 2754.8675,
  水费: 169.6,
  租金: 6251.22580645161,
  成本合计: 13289.3167225806,
};

describe('Golden Test - 龙口悦致酒店 8月1日', () => {
  let result: ReturnType<typeof calculateDailyAccounting>;

  beforeAll(() => {
    result = calculateDailyAccounting(LONGKOU_DAY1_AUGUST);
  });

  describe('收入验证', () => {
    it('收入合计应与Excel一致', () => {
      expect(result.totalRevenue).toBe(LONGKOU_DAY1_EXCEL.收入合计);
    });

    it('房费收入应与Excel一致', () => {
      expect(result.roomRevenue).toBe(LONGKOU_DAY1_EXCEL.房费收入);
    });

    it('其他收入项应为0', () => {
      expect(result.minibarRevenue).toBe(0);
      expect(result.foodRevenue).toBe(0);
      expect(result.otherRevenue).toBe(0);
    });
  });

  describe('成本验证', () => {
    it('变动成本计算应正确', () => {
      // 客房耗材 + 前台增值物品 + 小商品 + 餐厅 + 洗涤费
      const expectedVariableCost = toNumber(LONGKOU_DAY1_EXCEL.客房耗材) +
        toNumber(LONGKOU_DAY1_EXCEL.前台增值物品) +
        toNumber(LONGKOU_DAY1_EXCEL.小商品成本) +
        toNumber(LONGKOU_DAY1_EXCEL.餐厅) +
        toNumber(LONGKOU_DAY1_EXCEL.洗涤费);

      expect(result.variableCost).toBeCloseTo(expectedVariableCost, 2);
    });

    it('能耗成本计算应正确', () => {
      const expectedEnergyCost = toNumber(LONGKOU_DAY1_EXCEL.电费) +
        toNumber(LONGKOU_DAY1_EXCEL.水费);

      expect(result.energyCost).toBeCloseTo(expectedEnergyCost, 2);
    });

    it('固定成本（租金）应与Excel一致', () => {
      expect(result.fixedCost).toBeCloseTo(LONGKOU_DAY1_EXCEL.租金, 2);
    });

    it('人工成本应为0（未确认）', () => {
      expect(result.laborCost).toBe(0);
    });

    it('提成成本应为0（未确认）', () => {
      expect(result.commissionCost).toBe(0);
    });
  });

  describe('GOP验证', () => {
    it('GOP = 收入 - 成本', () => {
      const expectedGop = toNumber(LONGKOU_DAY1_EXCEL.收入合计) - result.totalCost;
      expect(result.gop).toBeCloseTo(expectedGop, 0);
    });

    it('GOP率应在合理范围', () => {
      // 24449 / 37739 ≈ 0.648
      expect(result.gopRate).toBeGreaterThan(0.6);
      expect(result.gopRate).toBeLessThan(0.7);
    });
  });

  describe('运营指标验证', () => {
    it('出租率应正确计算', () => {
      const expectedOccupancyRate = toNumber(LONGKOU_DAY1_EXCEL.入住间数) / toNumber(LONGKOU_DAY1_EXCEL.实际间数);
      expect(result.occupancyRate).toBeCloseTo(expectedOccupancyRate, 4);
    });

    it('平均房价应正确计算', () => {
      const expectedAvgRoomRate = toNumber(LONGKOU_DAY1_EXCEL.房费收入) / toNumber(LONGKOU_DAY1_EXCEL.入住间数);
      expect(result.avgRoomRate).toBeCloseTo(expectedAvgRoomRate, 2);
    });

    it('RevPAR应正确计算（使用房费收入，不是收入合计）', () => {
      // RevPAR = roomRevenue / physicalRoomCount
      // 注意：这里使用的是 roomRevenue，不是 totalRevenue
      const expectedRevpar = toNumber(LONGKOU_DAY1_EXCEL.房费收入) / toNumber(LONGKOU_DAY1_EXCEL.实际间数);
      expect(result.revpar).toBeCloseTo(expectedRevpar, 2);
    });
  });

  describe('规则验证', () => {
    it('应通过所有核算规则', () => {
      const validations = validateAccountingRules(result);
      const failedRules = validations.filter(v => !v.passed);

      if (failedRules.length > 0) {
        console.log('Failed validations:', failedRules);
      }

      expect(failedRules.length).toBe(0);
    });
  });

  describe('NEED_CONFIRMATION 项目', () => {
    it('人工成本: 工资数据待确认', () => {
      // 工资数据需要从工资录入Sheet获取，当前无法验证
      expect(result.laborCost).toBe(0);
    });

    it('提成成本: 提成数据待确认', () => {
      // 提成数据需要从提成录入Sheet获取，当前无法验证
      expect(result.commissionCost).toBe(0);
    });

    it('固定成本: 其他固定成本待确认', () => {
      // 物业费、保险等需要从固定费用录入Sheet获取
      expect(result.fixedCost).toBeCloseTo(LONGKOU_DAY1_EXCEL.租金, 2);
    });
  });

  describe('输出完整性', () => {
    it('应包含输入快照', () => {
      expect(result.inputSnapshot).toBeDefined();
      expect(result.inputSnapshot.hotelId).toBe('longkou-yuezhi');
    });

    it('应包含计算版本', () => {
      expect(result.calculationVersion).toBe('1.0.0');
    });

    it('应包含计算时间戳', () => {
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('应包含异常信息数组', () => {
      expect(result.anomalies).toBeInstanceOf(Array);
    });
  });
});

describe('Golden Test - 边界数据', () => {
  it('应处理零收入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 0,
      minibarRevenue: 0,
      foodRevenue: 0,
      otherRevenue: 0,
    };

    const result = calculateDailyAccounting(input);
    expect(result.totalRevenue).toBe(0);
    expect(result.gop).toBe(0);
    expect(result.gopRate).toBe(0);
  });

  it('应处理零成本', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 10000,
    };

    const result = calculateDailyAccounting(input);
    expect(result.totalCost).toBe(0);
    expect(result.gop).toBe(10000);
    expect(result.gopRate).toBe(1);
  });

  it('应处理空字符串输入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: '0' as unknown as number,
      minibarRevenue: '' as unknown as number,
    };

    const result = calculateDailyAccounting(input);
    expect(result.totalRevenue).toBe(0);
  });

  it('应处理null输入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: null,
    };

    const result = calculateDailyAccounting(input);
    expect(result.totalRevenue).toBe(0);
  });
});

describe('Golden Test - 数据追溯性', () => {
  it('输入快照应保留原始值', () => {
    const originalInput = {
      hotelId: 'longkou-yuezhi',
      businessDate: new Date('2026-08-01'),
      roomRevenue: 37739.01,
    };

    const result = calculateDailyAccounting(originalInput);

    expect(result.inputSnapshot.roomRevenue).toBe(37739.01);
    expect(result.inputSnapshot.hotelId).toBe('longkou-yuezhi');
  });

  it('计算结果应可反向验证', () => {
    const result = calculateDailyAccounting(LONGKOU_DAY1_AUGUST);

    // 反向验证: 总成本 = 变动 + 人工 + 提成 + 固定 + 能耗
    const reconstructedTotalCost =
      result.variableCost +
      result.laborCost +
      result.commissionCost +
      result.fixedCost +
      result.energyCost;

    expect(Math.abs(reconstructedTotalCost - result.totalCost)).toBeLessThan(0.01);
  });
});

/**
 * 测试结果汇总
 */
describe('TEST SUMMARY', () => {
  it('龙口悦致8月1日核算结果', () => {
    const result = calculateDailyAccounting(LONGKOU_DAY1_AUGUST);

    console.log('='.repeat(50));
    console.log('龙口悦致酒店 - 8月1日核算结果');
    console.log('='.repeat(50));
    console.log(`收入合计: ${result.totalRevenue}`);
    console.log(`  - 房费收入: ${result.roomRevenue}`);
    console.log(`  - 迷你吧: ${result.minibarRevenue}`);
    console.log(`  - 餐费: ${result.foodRevenue}`);
    console.log(`  - 其他: ${result.otherRevenue}`);
    console.log('');
    console.log(`成本分解:`);
    console.log(`  - 变动成本: ${result.variableCost}`);
    console.log(`  - 人工成本: ${result.laborCost}`);
    console.log(`  - 提成成本: ${result.commissionCost}`);
    console.log(`  - 固定成本: ${result.fixedCost}`);
    console.log(`  - 能耗成本: ${result.energyCost}`);
    console.log(`  - 总成本: ${result.totalCost}`);
    console.log('');
    console.log(`GOP: ${result.gop} (${(result.gopRate * 100).toFixed(2)}%)`);
    console.log('');
    console.log(`运营指标:`);
    console.log(`  - 出租房间数: ${LONGKOU_DAY1_AUGUST.soldRooms}`);
    console.log(`  - 物理总房间数: ${LONGKOU_DAY1_AUGUST.physicalRoomCount}`);
    console.log(`  - 出租率: ${(result.occupancyRate * 100).toFixed(2)}%`);
    console.log(`  - 平均房价: ${result.avgRoomRate.toFixed(2)}`);
    console.log(`  - RevPAR: ${result.revpar.toFixed(2)}`);
    console.log('');
    console.log(`Excel数据对比:`);
    console.log(`  - Excel收入合计: ${LONGKOU_DAY1_EXCEL.收入合计}`);
    console.log(`  - Excel成本合计: ${LONGKOU_DAY1_EXCEL.成本合计}`);
    console.log(`  - 计算成本合计: ${result.totalCost.toFixed(2)}`);
    console.log(`  - 差异: ${(result.totalCost - LONGKOU_DAY1_EXCEL.成本合计).toFixed(2)}`);
    console.log('='.repeat(50));

    // 验证规则
    const validations = validateAccountingRules(result);
    console.log('');
    console.log('规则验证结果:');
    validations.forEach(v => {
      console.log(`  [${v.passed ? 'PASS' : 'FAIL'}] ${v.ruleId}: ${v.message}`);
    });

    expect(result.totalRevenue).toBe(LONGKOU_DAY1_EXCEL.收入合计);
  });
});
