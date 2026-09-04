import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateDailyAccounting, detectRevenueAnomalies, detectCostAnomalies } from '@/lib/accounting';
import { requireHotelAccess } from '@/lib/api-auth';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * POST /api/hotels/:hotelId/daily-accounting/:businessDate/calculate
 * 执行日核算计算
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { hotelId, businessDate } = await params;

    // 权限检查
    const authUser = await requireHotelAccess(hotelId);
    if (authUser instanceof NextResponse) {
      return authUser;
    }

    // 解析日期
    const date = new Date(businessDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 查询酒店
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // 查询日经营记录及其关联数据
    const dailyOperation = await prisma.dailyOperation.findUnique({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: date,
        },
      },
      include: {
        revenue: true,
        variableCost: true,
        laborCost: true,
        commissionCost: true,
        fixedCost: true,
        energy: true,
        roomStatus: true,
      },
    });

    if (!dailyOperation) {
      return NextResponse.json(
        { error: 'Daily operation record not found. Save draft first.' },
        { status: 404 }
      );
    }

    // 构建计算输入
    const revenue = dailyOperation.revenue;
    const variableCost = dailyOperation.variableCost;
    const laborCost = dailyOperation.laborCost;
    const commissionCost = dailyOperation.commissionCost;
    const fixedCost = dailyOperation.fixedCost;
    const energy = dailyOperation.energy;
    const roomStatus = dailyOperation.roomStatus;

    // 辅助函数：将 Prisma Decimal 转换为 number
    const toNum = (val: unknown): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      // Prisma Decimal 对象
      if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return (val as { toNumber: () => number }).toNumber();
      }
      return Number(val) || 0;
    };

    // 调用计算引擎
    const input = {
      hotelId,
      businessDate: date,
      // 收入
      roomRevenue: toNum(revenue?.roomRevenue),
      minibarRevenue: toNum(revenue?.minibarRevenue),
      foodRevenue: toNum(revenue?.foodRevenue),
      otherRevenue: toNum(revenue?.otherRevenue),
      // 变动成本
      roomSuppliesCost: toNum(variableCost?.roomSuppliesCost),
      frontDeskItemsCost: toNum(variableCost?.frontDeskItemsCost),
      merchandiseCost: toNum(variableCost?.merchandiseCost),
      laundryCost: toNum(variableCost?.laundryCost),
      restaurantCost: toNum(variableCost?.restaurantCost),
      otherVariableCost: toNum(variableCost?.otherVariableCost),
      // 人工成本
      frontDeskWages: toNum(laborCost?.frontDeskWages),
      housekeepingWages: toNum(laborCost?.housekeepingWages),
      restaurantWages: toNum(laborCost?.restaurantWages),
      managementWages: toNum(laborCost?.managementWages),
      // 提成成本
      reviewCommission: toNum(commissionCost?.reviewCommission),
      qrCommission: toNum(commissionCost?.qrCommission),
      memberCardCommission: toNum(commissionCost?.memberCardCommission),
      housekeepingCommission: toNum(commissionCost?.housekeepingCommission),
      // 固定成本
      rent: toNum(fixedCost?.rent),
      platformPromotionFee: toNum(fixedCost?.platformPromotionFee),
      otherFixedCost: toNum(fixedCost?.otherFixedCost),
      // 能耗
      electricityCost: toNum(energy?.electricityCost),
      waterCost: toNum(energy?.waterCost),
      gasCost: toNum(energy?.gasCost),
      // 运营指标 - 来自 RoomStatus (店长录入)
      soldRooms: roomStatus?.soldRooms || 0,
      physicalRoomCount: hotel.physicalRoomCount,
    };

    // 计算
    const result = calculateDailyAccounting(input);

    // 保存计算结果
    const calculationResult = await prisma.calculationResult.upsert({
      where: { dailyOperationId: dailyOperation.id },
      update: {
        totalRevenue: result.totalRevenue,
        totalVariableCost: result.variableCost,
        totalLaborCost: result.laborCost,
        totalCommissionCost: result.commissionCost,
        totalFixedCost: result.fixedCost,
        totalCost: result.totalCost,
        gop: result.gop,
        gopRate: result.gopRate,
        occupancyRate: result.occupancyRate,
        avgRoomRate: result.avgRoomRate,
        revpar: result.revpar,
        isRevenueAnomaly: result.isRevenueAnomaly,
        isCostAnomaly: result.isCostAnomaly,
        calculationVersion: result.calculationVersion,
        calculatedAt: result.calculatedAt,
      },
      create: {
        dailyOperationId: dailyOperation.id,
        totalRevenue: result.totalRevenue,
        totalVariableCost: result.variableCost,
        totalLaborCost: result.laborCost,
        totalCommissionCost: result.commissionCost,
        totalFixedCost: result.fixedCost,
        totalCost: result.totalCost,
        gop: result.gop,
        gopRate: result.gopRate,
        occupancyRate: result.occupancyRate,
        avgRoomRate: result.avgRoomRate,
        revpar: result.revpar,
        isRevenueAnomaly: result.isRevenueAnomaly,
        isCostAnomaly: result.isCostAnomaly,
        calculationVersion: result.calculationVersion,
        calculatedAt: result.calculatedAt,
      },
    });

    // 异常检测 - 获取前一天数据用于比较
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousOperation = await prisma.dailyOperation.findUnique({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: previousDate,
        },
      },
      include: {
        calculationResult: true,
      },
    });

    // 转换前一天的计算结果
    const previousResult = previousOperation?.calculationResult ? {
      hotelId,
      businessDate: previousDate,
      totalRevenue: toNum(previousOperation.calculationResult.totalRevenue),
      totalCost: toNum(previousOperation.calculationResult.totalCost),
      roomRevenue: 0,
      minibarRevenue: 0,
      foodRevenue: 0,
      otherRevenue: 0,
      variableCost: 0,
      laborCost: 0,
      commissionCost: 0,
      fixedCost: 0,
      energyCost: 0,
      gop: 0,
      gopRate: 0,
      occupancyRate: 0,
      avgRoomRate: 0,
      revpar: 0,
      isRevenueAnomaly: false,
      isCostAnomaly: false,
      anomalies: [],
      calculationVersion: '1.0',
      calculatedAt: new Date(),
      inputSnapshot: {} as typeof input,
    } : undefined;

    // 检测收入异常
    const revenueAnomalies = detectRevenueAnomalies(input, result, previousResult);

    // 检测成本异常
    const costAnomalies = detectCostAnomalies(input, result, previousResult);

    // 保存异常记录
    if (revenueAnomalies.length > 0 || costAnomalies.length > 0) {
      // 删除旧异常
      await prisma.anomaly.deleteMany({
        where: { dailyOperationId: dailyOperation.id },
      });

      // 创建新异常
      for (const anomaly of [...revenueAnomalies, ...costAnomalies]) {
        const fieldLabel = anomaly.field === 'totalRevenue' ? '收入' : '成本';
        await prisma.anomaly.create({
          data: {
            dailyOperationId: dailyOperation.id,
            calculationResultId: calculationResult.id,
            type: anomaly.field === 'totalRevenue' ? 'REVENUE' : 'COST',
            severity: anomaly.severity,
            expectedValue: anomaly.expectedValue,
            actualValue: anomaly.actualValue,
            deviation: anomaly.actualValue - anomaly.expectedValue,
            deviationRate: anomaly.deviationRate,
            description: `${fieldLabel}异常: 实际值 ¥${anomaly.actualValue.toFixed(2)} vs 预期值 ¥${anomaly.expectedValue.toFixed(2)} (偏差 ${(anomaly.deviationRate * 100).toFixed(1)}%)`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      calculation: {
        totalRevenue: result.totalRevenue,
        variableCost: result.variableCost,
        laborCost: result.laborCost,
        commissionCost: result.commissionCost,
        fixedCost: result.fixedCost,
        energyCost: result.energyCost,
        totalCost: result.totalCost,
        gop: result.gop,
        gopRate: result.gopRate,
        occupancyRate: result.occupancyRate,
        avgRoomRate: result.avgRoomRate,
        revpar: result.revpar,
      },
      anomalies: [...revenueAnomalies, ...costAnomalies].map(a => {
        const fieldLabel = a.field === 'totalRevenue' ? '收入' : '成本';
        return {
          type: a.field === 'totalRevenue' ? 'REVENUE' : 'COST',
          severity: a.severity,
          message: `${fieldLabel}异常: 实际值 ¥${a.actualValue.toFixed(2)} vs 预期值 ¥${a.expectedValue.toFixed(2)}`,
          actualValue: a.actualValue,
          expectedValue: a.expectedValue,
          deviationRate: a.deviationRate,
        };
      }),
    });
  } catch (error) {
    console.error('Error calculating daily accounting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
