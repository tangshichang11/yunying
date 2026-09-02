// ============================================================
// 慧友酒店经营核算平台 - 单元测试
// ============================================================

import {
  toNumber,
  calculateTotalRevenue,
  calculateVariableCost,
  calculateLaborCost,
  calculateCommissionCost,
  calculateFixedCost,
  calculateEnergyCost,
  calculateTotalCost,
  calculateOperationalMetrics,
  calculateDailyAccounting,
  validateAccountingRules,
  roundMoney,
  ACCOUNTING_RULES,
} from '../calculate';

describe('会计计算引擎 - 工具函数', () => {
  describe('toNumber', () => {
    it('应正确处理 null', () => {
      expect(toNumber(null)).toBe(0);
    });

    it('应正确处理 undefined', () => {
      expect(toNumber(undefined)).toBe(0);
    });

    it('应正确处理空字符串', () => {
      expect(toNumber('')).toBe(0);
    });

    it('应正确处理零值字符串', () => {
      expect(toNumber('0')).toBe(0);
      expect(toNumber('0.00')).toBe(0);
      expect(toNumber('-')).toBe(0);
    });

    it('应正确解析有效数字字符串', () => {
      expect(toNumber('123.45')).toBe(123.45);
      expect(toNumber('  456  ')).toBe(456);
    });

    it('应正确处理无效字符串', () => {
      expect(toNumber('abc')).toBe(0);
    });

    it('应正确处理数字', () => {
      expect(toNumber(0)).toBe(0);
      expect(toNumber(100)).toBe(100);
      expect(toNumber(-50)).toBe(-50);
      expect(toNumber(123.456)).toBe(123.456);
    });
  });

  describe('roundMoney', () => {
    it('应保留2位小数', () => {
      expect(roundMoney(100.123)).toBe(100.12);
      expect(roundMoney(100.126)).toBe(100.13);
      expect(roundMoney(100)).toBe(100);
    });
  });
});

describe('会计计算引擎 - 收入计算', () => {
  it('应正确计算总收入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 1000,
      minibarRevenue: 100,
      foodRevenue: 200,
      otherRevenue: 50,
    };

    expect(calculateTotalRevenue(input)).toBe(1350);
  });

  it('应处理缺失的收入字段', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 1000,
    };

    expect(calculateTotalRevenue(input)).toBe(1000);
  });

  it('应处理全为0的收入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 0,
      minibarRevenue: 0,
      foodRevenue: 0,
      otherRevenue: 0,
    };

    expect(calculateTotalRevenue(input)).toBe(0);
  });
});

describe('会计计算引擎 - 成本计算', () => {
  describe('calculateVariableCost', () => {
    it('应正确计算变动成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        roomSuppliesCost: 100,
        frontDeskItemsCost: 50,
        merchandiseCost: 30,
        laundryCost: 20,
        restaurantCost: 10,
        otherVariableCost: 5,
      };

      expect(calculateVariableCost(input)).toBe(215);
    });

    it('应处理部分缺失字段', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        roomSuppliesCost: 100,
        merchandiseCost: 30,
      };

      expect(calculateVariableCost(input)).toBe(130);
    });
  });

  describe('calculateLaborCost', () => {
    it('应正确计算人工成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        frontDeskWages: 500,
        housekeepingWages: 400,
        restaurantWages: 300,
        managementWages: 200,
      };

      expect(calculateLaborCost(input)).toBe(1400);
    });
  });

  describe('calculateCommissionCost', () => {
    it('应正确计算提成成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        reviewCommission: 100,
        qrCommission: 50,
        memberCardCommission: 30,
        housekeepingCommission: 20,
      };

      expect(calculateCommissionCost(input)).toBe(200);
    });
  });

  describe('calculateFixedCost', () => {
    it('应正确计算固定成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        rent: 1000,
        platformPromotionFee: 500,
        otherFixedCost: 100,
      };

      expect(calculateFixedCost(input)).toBe(1600);
    });
  });

  describe('calculateEnergyCost', () => {
    it('应正确计算能耗成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        electricityCost: 300,
        waterCost: 50,
        gasCost: 20,
      };

      expect(calculateEnergyCost(input)).toBe(370);
    });
  });

  describe('calculateTotalCost', () => {
    it('应正确计算总成本', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        // 变动成本
        roomSuppliesCost: 100,
        frontDeskItemsCost: 50,
        merchandiseCost: 30,
        laundryCost: 20,
        restaurantCost: 10,
        otherVariableCost: 5,
        // 人工成本
        frontDeskWages: 500,
        housekeepingWages: 400,
        restaurantWages: 300,
        managementWages: 200,
        // 提成成本
        reviewCommission: 100,
        qrCommission: 50,
        memberCardCommission: 30,
        housekeepingCommission: 20,
        // 固定成本
        rent: 1000,
        platformPromotionFee: 500,
        otherFixedCost: 100,
        // 能耗
        electricityCost: 300,
        waterCost: 50,
        gasCost: 20,
      };

      const result = calculateTotalCost(input);
      expect(result.variableCost).toBe(215);
      expect(result.laborCost).toBe(1400);
      expect(result.commissionCost).toBe(200);
      expect(result.fixedCost).toBe(1600);
      expect(result.energyCost).toBe(370);
      expect(result.totalCost).toBe(3785);
    });
  });
});

describe('会计计算引擎 - 运营指标', () => {
  it('应正确计算运营指标', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 10000,
      soldRooms: 100,
      physicalRoomCount: 133,
    };

    const result = calculateOperationalMetrics(input, 10000);
    // Occupancy = 100 / 133 = 0.7518797...
    expect(result.occupancyRate).toBeCloseTo(100 / 133, 4);
    // ADR = 10000 / 100 = 100
    expect(result.avgRoomRate).toBe(100);
    // RevPAR = 10000 / 133 = 75.19...
    expect(result.revpar).toBeCloseTo(10000 / 133, 2);
  });

  it('应处理除零情况', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 10000,
      soldRooms: 0,
      physicalRoomCount: 0,
    };

    const result = calculateOperationalMetrics(input, 10000);
    expect(result.occupancyRate).toBe(0);
    expect(result.avgRoomRate).toBe(0);
    expect(result.revpar).toBe(0);
  });
});

describe('会计计算引擎 - 主函数', () => {
  it('应正确执行完整核算流程', () => {
    const input = {
      hotelId: 'test-hotel',
      businessDate: new Date('2026-08-01'),
      // 收入
      roomRevenue: 37739.01,
      minibarRevenue: 0,
      foodRevenue: 0,
      otherRevenue: 0,
      // 变动成本
      roomSuppliesCost: 1071.937,
      frontDeskItemsCost: 36.4417,
      merchandiseCost: 0,
      laundryCost: 845.4,
      restaurantCost: 410,
      otherVariableCost: 0,
      // 人工成本
      frontDeskWages: 0,
      housekeepingWages: 0,
      restaurantWages: 0,
      managementWages: 0,
      // 提成成本
      reviewCommission: 0,
      qrCommission: 0,
      memberCardCommission: 0,
      housekeepingCommission: 0,
      // 固定成本
      rent: 6251.23,
      platformPromotionFee: 0,
      otherFixedCost: 0,
      // 能耗
      electricityCost: 2754.8675,
      waterCost: 169.6,
      gasCost: 0,
      // 运营指标
      soldRooms: 146,
      physicalRoomCount: 133,
    };

    const result = calculateDailyAccounting(input);

    // 验证总收入
    expect(result.totalRevenue).toBe(37739.01);

    // 验证成本分解
    expect(result.variableCost).toBeCloseTo(2363.78, 2); // 1071.937 + 36.4417 + 0 + 845.4 + 410 + 0
    expect(result.laborCost).toBe(0);
    expect(result.commissionCost).toBe(0);
    expect(result.fixedCost).toBeCloseTo(6251.23, 2);
    expect(result.energyCost).toBeCloseTo(2924.47, 2); // 2754.8675 + 169.6 + 0

    // 验证总成本
    const expectedTotalCost = 2363.78 + 6251.23 + 2924.47; // = 11539.48
    expect(result.totalCost).toBeCloseTo(expectedTotalCost, 0);

    // 验证GOP
    const expectedGop = 37739.01 - expectedTotalCost;
    expect(result.gop).toBeCloseTo(expectedGop, 0);

    // 验证GOP率
    expect(result.gopRate).toBeCloseTo(expectedGop / 37739.01, 2);

    // 验证运营指标
    // Occupancy = 146 / 133 = 1.0977...
    expect(result.occupancyRate).toBeCloseTo(146 / 133, 4);
    // ADR = 37739.01 / 146 = 258.49...
    expect(result.avgRoomRate).toBeCloseTo(37739.01 / 146, 2);
    // RevPAR = 37739.01 / 133 = 283.75...
    expect(result.revpar).toBeCloseTo(37739.01 / 133, 2);
  });

  it('应处理全零输入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
    };

    const result = calculateDailyAccounting(input);

    expect(result.totalRevenue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.gop).toBe(0);
    expect(result.gopRate).toBe(0);
  });

  it('应处理负数输入', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: -100,
    };

    const result = calculateDailyAccounting(input);

    expect(result.totalRevenue).toBe(-100);
    expect(result.gop).toBe(-100);
  });
});

describe('会计计算引擎 - 规则验证', () => {
  it('应通过所有规则验证', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 10000,
      minibarRevenue: 1000,
      foodRevenue: 500,
      otherRevenue: 100,
      roomSuppliesCost: 500,
      frontDeskItemsCost: 100,
      merchandiseCost: 50,
      laundryCost: 30,
      restaurantCost: 20,
      otherVariableCost: 10,
      frontDeskWages: 500,
      housekeepingWages: 400,
      restaurantWages: 300,
      managementWages: 200,
      reviewCommission: 100,
      qrCommission: 50,
      memberCardCommission: 30,
      housekeepingCommission: 20,
      rent: 1000,
      platformPromotionFee: 500,
      otherFixedCost: 100,
      electricityCost: 300,
      waterCost: 50,
      gasCost: 20,
      soldRooms: 100,
      physicalRoomCount: 133,
    };

    const result = calculateDailyAccounting(input);
    const validations = validateAccountingRules(result);

    expect(validations.length).toBe(5);

    // 规则1: 总收入
    expect(validations.find(v => v.ruleId === ACCOUNTING_RULES.RULE_REVENUE_SUM)?.passed).toBe(true);

    // 规则2: 总成本
    expect(validations.find(v => v.ruleId === ACCOUNTING_RULES.RULE_COST_SUM)?.passed).toBe(true);

    // 规则3: GOP计算
    expect(validations.find(v => v.ruleId === ACCOUNTING_RULES.RULE_GOP_CALCULATION)?.passed).toBe(true);

    // 规则4: GOP率
    expect(validations.find(v => v.ruleId === ACCOUNTING_RULES.RULE_GOP_RATE)?.passed).toBe(true);

    // 规则5: 管理费排除
    expect(validations.find(v => v.ruleId === ACCOUNTING_RULES.RULE_MANAGEMENT_FEE_EXCLUDED)?.passed).toBe(true);
  });
});

describe('会计计算引擎 - 边界情况', () => {
  it('应处理极大数值', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 999999999.99,
      minibarRevenue: 999999999.99,
      foodRevenue: 999999999.99,
      otherRevenue: 999999999.99,
    };

    const result = calculateDailyAccounting(input);

    expect(result.totalRevenue).toBe(3999999999.96);
  });

  it('应处理极小数值', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 0.001,
      minibarRevenue: 0.002,
    };

    const result = calculateDailyAccounting(input);

    expect(result.totalRevenue).toBe(0);
  });

  it('应正确保留小数精度', () => {
    const input = {
      hotelId: 'test',
      businessDate: new Date(),
      roomRevenue: 100.126,
      minibarRevenue: 0,
      foodRevenue: 0,
      otherRevenue: 0,
    };

    const result = calculateDailyAccounting(input);

    expect(result.totalRevenue).toBe(100.13);
  });
});
