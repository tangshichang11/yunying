// ============================================================
// 慧友酒店经营核算平台 - 运营指标测试
// 测试 Occupancy, ADR, RevPAR 计算
//
// 慧友确认的口径:
// - Occupancy = soldRooms / physicalRoomCount
// - ADR = roomRevenue / soldRooms
// - RevPAR = roomRevenue / physicalRoomCount
// ============================================================

import { calculateDailyAccounting } from '../calculate';

describe('运营指标测试 - Occupancy, ADR, RevPAR', () => {
  describe('慧友确认的业务口径验证', () => {
    it('使用用户提供的测试数据验证', () => {
      // 测试数据（来自用户）
      // physicalRoomCount = 120
      // soldRooms = 104
      // roomRevenue = 25015.24
      // totalRevenue = 29866.23

      const input = {
        hotelId: 'test-hotel',
        businessDate: new Date('2026-09-01'),
        roomRevenue: 25015.24,
        minibarRevenue: 800,
        foodRevenue: 3000,
        otherRevenue: 1000,
        // 成本项全为0以便单独验证运营指标
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        // 运营指标
        soldRooms: 104,
        physicalRoomCount: 120,
      };

      const result = calculateDailyAccounting(input);

      // 预期结果
      // Occupancy = 104 / 120 = 0.8666667... (86.67%)
      const expectedOccupancy = 104 / 120;

      // ADR = 25015.24 / 104 = 240.5311538...
      const expectedAdr = 25015.24 / 104;

      // RevPAR = 25015.24 / 120 = 208.4603333...
      const expectedRevpar = 25015.24 / 120;

      // 验证 Occupancy
      expect(result.occupancyRate).toBeCloseTo(expectedOccupancy, 4);

      // 验证 ADR (avgRoomRate)
      expect(result.avgRoomRate).toBeCloseTo(expectedAdr, 2);

      // 验证 RevPAR
      expect(result.revpar).toBeCloseTo(expectedRevpar, 2);
    });

    it('验证 RevPAR = ADR × Occupancy', () => {
      const input = {
        hotelId: 'test-hotel',
        businessDate: new Date('2026-09-01'),
        roomRevenue: 25015.24,
        minibarRevenue: 0,
        foodRevenue: 0,
        otherRevenue: 0,
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        soldRooms: 104,
        physicalRoomCount: 120,
      };

      const result = calculateDailyAccounting(input);

      // RevPAR = ADR × Occupancy 验证
      const expectedRevparFromFormula = result.avgRoomRate * result.occupancyRate;
      expect(result.revpar).toBeCloseTo(expectedRevparFromFormula, 2);
    });

    it('验证 ADR 和 RevPAR 使用 roomRevenue 而非 totalRevenue', () => {
      const input = {
        hotelId: 'test-hotel',
        businessDate: new Date('2026-09-01'),
        roomRevenue: 25015.24,
        minibarRevenue: 4851, // 额外收入
        foodRevenue: 0,
        otherRevenue: 0,
        soldRooms: 104,
        physicalRoomCount: 120,
      };

      const result = calculateDailyAccounting(input);

      // totalRevenue = 25015.24 + 4851 = 29866.24
      expect(result.totalRevenue).toBeCloseTo(29866.24, 2);

      // ADR 应该用 roomRevenue / soldRooms = 25015.24 / 104
      expect(result.avgRoomRate).toBeCloseTo(25015.24 / 104, 2);

      // RevPAR 应该用 roomRevenue / physicalRoomCount = 25015.24 / 120
      expect(result.revpar).toBeCloseTo(25015.24 / 120, 2);

      // 错误用法 (totalRevenue / soldRooms) 的结果会是 29866.24 / 104 = 287.18
      // 这不应该等于 avgRoomRate
      expect(result.avgRoomRate).not.toBeCloseTo(29866.24 / 104, 2);
    });
  });

  describe('基本计算公式验证', () => {
    it('给定 totalRooms=80, occupiedRooms=61, roomRevenue=28000', () => {
      const input = {
        hotelId: 'test-hotel',
        businessDate: new Date('2026-08-31'),
        roomRevenue: 28000,
        minibarRevenue: 0,
        foodRevenue: 0,
        otherRevenue: 0,
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        soldRooms: 61,
        physicalRoomCount: 80,
      };

      const result = calculateDailyAccounting(input);

      // 期望计算结果
      // Occupancy = 61 / 80 = 0.7625 (76.25%)
      // ADR = 28000 / 61 = 458.74
      // RevPAR = 28000 / 80 = 350

      expect(result.occupancyRate).toBeCloseTo(61 / 80, 4);
      expect(result.avgRoomRate).toBeCloseTo(28000 / 61, 2);
      expect(result.revpar).toBeCloseTo(28000 / 80, 2);
    });

    it('验证 RevPAR = ADR × Occupancy', () => {
      const input = {
        hotelId: 'test-hotel',
        businessDate: new Date('2026-08-31'),
        roomRevenue: 28000,
        minibarRevenue: 0,
        foodRevenue: 0,
        otherRevenue: 0,
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        soldRooms: 61,
        physicalRoomCount: 80,
      };

      const result = calculateDailyAccounting(input);

      // RevPAR = ADR × Occupancy 验证
      const expectedRevparFromFormula = result.avgRoomRate * result.occupancyRate;
      expect(result.revpar).toBeCloseTo(expectedRevparFromFormula, 2);
    });
  });

  describe('边界条件测试', () => {
    it('soldRooms = 0 时应返回 0', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        roomRevenue: 0,
        minibarRevenue: 0,
        foodRevenue: 0,
        otherRevenue: 0,
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        soldRooms: 0,
        physicalRoomCount: 80,
      };

      const result = calculateDailyAccounting(input);
      expect(result.occupancyRate).toBe(0);
      expect(result.avgRoomRate).toBe(0);
      expect(result.revpar).toBe(0);
    });

    it('physicalRoomCount = 0 时 Occupancy 和 RevPAR 应返回 0，但 ADR 取决于 soldRooms', () => {
      const input = {
        hotelId: 'test',
        businessDate: new Date(),
        roomRevenue: 10000,
        minibarRevenue: 0,
        foodRevenue: 0,
        otherRevenue: 0,
        roomSuppliesCost: 0,
        frontDeskItemsCost: 0,
        merchandiseCost: 0,
        laundryCost: 0,
        restaurantCost: 0,
        otherVariableCost: 0,
        frontDeskWages: 0,
        housekeepingWages: 0,
        restaurantWages: 0,
        managementWages: 0,
        reviewCommission: 0,
        qrCommission: 0,
        memberCardCommission: 0,
        housekeepingCommission: 0,
        rent: 0,
        platformPromotionFee: 0,
        otherFixedCost: 0,
        electricityCost: 0,
        waterCost: 0,
        gasCost: 0,
        soldRooms: 50,
        physicalRoomCount: 0,
      };

      const result = calculateDailyAccounting(input);
      // Occupancy = soldRooms / physicalRoomCount = 50 / 0 = 0 (除零保护)
      expect(result.occupancyRate).toBe(0);
      // ADR = roomRevenue / soldRooms = 10000 / 50 = 200 (不依赖 physicalRoomCount)
      expect(result.avgRoomRate).toBe(200);
      // RevPAR = roomRevenue / physicalRoomCount = 10000 / 0 = 0 (除零保护)
      expect(result.revpar).toBe(0);
    });
  });

  describe('龙口悦致酒店数据验证', () => {
    it('使用真实数据验证计算', () => {
      // 龙口悦致酒店
      // physicalRoomCount: 120
      // soldRooms: 104
      // roomRevenue: 25015.24

      const input = {
        hotelId: 'cmtgxss9y0004rcsvwg4epp83',
        businessDate: new Date('2026-09-01'),
        roomRevenue: 25015.24,
        minibarRevenue: 800,
        foodRevenue: 3000,
        otherRevenue: 1000,
        roomSuppliesCost: 850,
        frontDeskItemsCost: 220,
        merchandiseCost: 180,
        laundryCost: 380,
        restaurantCost: 1200,
        otherVariableCost: 240,
        frontDeskWages: 500,
        housekeepingWages: 800,
        restaurantWages: 600,
        managementWages: 400,
        reviewCommission: 210,
        qrCommission: 155,
        memberCardCommission: 110,
        housekeepingCommission: 310,
        rent: 500,
        platformPromotionFee: 300,
        otherFixedCost: 200,
        electricityCost: 680,
        waterCost: 367.5,
        gasCost: 154,
        soldRooms: 104,
        physicalRoomCount: 120,
      };

      const result = calculateDailyAccounting(input);

      // 验证总收入
      expect(result.totalRevenue).toBeCloseTo(29815.24, 2); // 25015.24 + 800 + 3000 + 1000

      // 验证成本分解
      expect(result.variableCost).toBeCloseTo(3070, 2);  // 850+220+180+380+1200+240
      expect(result.laborCost).toBeCloseTo(2300, 2);     // 500+800+600+400
      expect(result.commissionCost).toBeCloseTo(785, 2); // 210+155+110+310
      expect(result.fixedCost).toBeCloseTo(1000, 2);     // 500+300+200
      expect(result.energyCost).toBeCloseTo(1201.5, 2);  // 680+367.5+154

      // 验证总成本
      expect(result.totalCost).toBeCloseTo(8356.5, 2);

      // 验证GOP
      expect(result.gop).toBeCloseTo(21458.74, 2); // 29815.24 - 8356.5

      // 验证运营指标
      // Occupancy = 104 / 120 = 0.8667
      expect(result.occupancyRate).toBeCloseTo(104 / 120, 4);
      // ADR = 25015.24 / 104 = 240.53
      expect(result.avgRoomRate).toBeCloseTo(25015.24 / 104, 2);
      // RevPAR = 25015.24 / 120 = 208.46
      expect(result.revpar).toBeCloseTo(25015.24 / 120, 2);

      // 验证 RevPAR = ADR × Occupancy
      expect(result.revpar).toBeCloseTo(result.avgRoomRate * result.occupancyRate, 2);
    });
  });
});
