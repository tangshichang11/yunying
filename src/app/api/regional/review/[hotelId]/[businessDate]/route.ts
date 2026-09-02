import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * GET /api/regional/review/:hotelId/:businessDate
 * 获取指定酒店指定日期的审核详情
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { hotelId, businessDate } = await params;

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
      include: { region: true },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // 查询日经营记录
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
        calculationResult: true,
        anomalies: true,
      },
    });

    if (!dailyOperation) {
      return NextResponse.json(
        { error: 'Daily operation not found' },
        { status: 404 }
      );
    }

    // 查询目标数据 (DailyTarget 是按 hotelId + businessDate 关联到 Hotel)
    const target = await prisma.dailyTarget.findUnique({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: date,
        },
      },
    });

    const calcResult = dailyOperation.calculationResult;

    const revenueTarget = target ? Number(target.revenueTarget) : null;
    const actualRevenue = calcResult ? Number(calcResult.totalRevenue) : 0;
    const revenueVariance = revenueTarget ? actualRevenue - revenueTarget : null;
    const revenueVarianceRate = revenueTarget ? (revenueVariance || 0) / revenueTarget : null;

    const costTarget = target ? Number(target.costTarget) : null;
    const actualCost = calcResult ? Number(calcResult.totalCost) : 0;
    const costVariance = costTarget ? actualCost - costTarget : null;
    const costVarianceRate = costTarget ? (costVariance || 0) / costTarget : null;

    const gopTarget = target ? Number(target.gopTarget) : null;
    const actualGop = calcResult ? Number(calcResult.gop) : 0;
    const gopVariance = gopTarget ? actualGop - gopTarget : null;
    const gopVarianceRate = gopTarget ? (gopVariance || 0) / gopTarget : null;

    return NextResponse.json({
      success: true,
      data: {
        // 基本信息
        id: dailyOperation.id,
        hotel: {
          id: hotel.id,
          code: hotel.code,
          name: hotel.name,
          physicalRoomCount: hotel.physicalRoomCount,
          regionId: hotel.regionId,
          regionName: hotel.region.name,
        },
        businessDate: dailyOperation.businessDate.toISOString().split('T')[0],
        status: dailyOperation.status,
        submittedAt: dailyOperation.submittedAt?.toISOString() || null,
        submittedBy: dailyOperation.submittedBy,
        reviewedAt: dailyOperation.reviewedAt?.toISOString() || null,
        reviewedBy: dailyOperation.reviewedBy,
        rejectionReason: dailyOperation.rejectionReason,

        // 收入
        revenue: dailyOperation.revenue ? {
          roomRevenue: Number(dailyOperation.revenue.roomRevenue),
          minibarRevenue: Number(dailyOperation.revenue.minibarRevenue),
          foodRevenue: Number(dailyOperation.revenue.foodRevenue),
          otherRevenue: Number(dailyOperation.revenue.otherRevenue),
          totalRevenue: Number(dailyOperation.revenue.totalRevenue),
        } : null,

        // 变动成本
        variableCost: dailyOperation.variableCost ? {
          roomSuppliesCost: Number(dailyOperation.variableCost.roomSuppliesCost),
          frontDeskItemsCost: Number(dailyOperation.variableCost.frontDeskItemsCost),
          merchandiseCost: Number(dailyOperation.variableCost.merchandiseCost),
          laundryCost: Number(dailyOperation.variableCost.laundryCost),
          restaurantCost: Number(dailyOperation.variableCost.restaurantCost),
          otherVariableCost: Number(dailyOperation.variableCost.otherVariableCost),
          totalVariableCost: Number(dailyOperation.variableCost.totalVariableCost),
        } : null,

        // 人工成本
        laborCost: dailyOperation.laborCost ? {
          frontDeskWages: Number(dailyOperation.laborCost.frontDeskWages),
          housekeepingWages: Number(dailyOperation.laborCost.housekeepingWages),
          restaurantWages: Number(dailyOperation.laborCost.restaurantWages),
          managementWages: Number(dailyOperation.laborCost.managementWages),
          totalLaborCost: Number(dailyOperation.laborCost.totalLaborCost),
        } : null,

        // 提成成本
        commissionCost: dailyOperation.commissionCost ? {
          reviewCommission: Number(dailyOperation.commissionCost.reviewCommission),
          qrCommission: Number(dailyOperation.commissionCost.qrCommission),
          memberCardCommission: Number(dailyOperation.commissionCost.memberCardCommission),
          housekeepingCommission: Number(dailyOperation.commissionCost.housekeepingCommission),
          totalCommissionCost: Number(dailyOperation.commissionCost.totalCommissionCost),
        } : null,

        // 固定成本
        fixedCost: dailyOperation.fixedCost ? {
          rent: Number(dailyOperation.fixedCost.rent),
          platformPromotionFee: Number(dailyOperation.fixedCost.platformPromotionFee),
          otherFixedCost: Number(dailyOperation.fixedCost.otherFixedCost),
          totalFixedCost: Number(dailyOperation.fixedCost.totalFixedCost),
        } : null,

        // 能耗
        energy: dailyOperation.energy ? {
          electricityConsumption: Number(dailyOperation.energy.electricityConsumption),
          electricityUnitPrice: Number(dailyOperation.energy.electricityUnitPrice),
          electricityCost: Number(dailyOperation.energy.electricityCost),
          waterConsumption: Number(dailyOperation.energy.waterConsumption),
          waterUnitPrice: Number(dailyOperation.energy.waterUnitPrice),
          waterCost: Number(dailyOperation.energy.waterCost),
          gasConsumption: Number(dailyOperation.energy.gasConsumption),
          gasUnitPrice: Number(dailyOperation.energy.gasUnitPrice),
          gasCost: Number(dailyOperation.energy.gasCost),
          totalUtilityCost: Number(dailyOperation.energy.totalUtilityCost),
        } : null,

        // 计算结果 (来自后端计算)
        calculationResult: calcResult ? {
          totalRevenue: Number(calcResult.totalRevenue),
          totalCost: Number(calcResult.totalCost),
          gop: Number(calcResult.gop),
          gopRate: Number(calcResult.gopRate),
          occupancyRate: Number(calcResult.occupancyRate),
          avgRoomRate: Number(calcResult.avgRoomRate),
          revpar: Number(calcResult.revpar),
        } : null,

        // 目标与实际对比
        targetComparison: {
          revenue: {
            target: revenueTarget,
            actual: actualRevenue,
            variance: revenueVariance,
            varianceRate: revenueVarianceRate,
          },
          cost: {
            target: costTarget,
            actual: actualCost,
            variance: costVariance,
            varianceRate: costVarianceRate,
          },
          gop: {
            target: gopTarget,
            actual: actualGop,
            variance: gopVariance,
            varianceRate: gopVarianceRate,
          },
        },

        // 异常
        anomalies: dailyOperation.anomalies.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          expectedValue: Number(a.expectedValue),
          actualValue: Number(a.actualValue),
          deviation: Number(a.deviation),
          deviationRate: Number(a.deviationRate),
          description: a.description,
          status: a.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching review detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
