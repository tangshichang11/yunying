import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

// 辅助函数：确保值为数字
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || 0;
}

/**
 * GET /api/hotels/:hotelId/daily-accounting/:businessDate
 * 获取指定酒店指定日期的日经营数据
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
        roomStatus: true,
      },
    });

    // 查询日目标
    const dailyTarget = await prisma.dailyTarget.findUnique({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: date,
        },
      },
    });

    // 计算提交截止时间 (businessDate + 1 day 18:00)
    const deadline = new Date(date);
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(18, 0, 0, 0);

    // 计算是否已过截止时间
    const now = new Date();
    const isPastDeadline = now > deadline;

    // 计算最后保存时间
    const lastSavedAt = dailyOperation?.updatedAt || null;

    return NextResponse.json({
      hotel: {
        id: hotel.id,
        code: hotel.code,
        name: hotel.name,
        physicalRoomCount: hotel.physicalRoomCount,
        regionId: hotel.regionId,
        regionName: hotel.region.name,
      },
      businessDate: date.toISOString().split('T')[0],
      status: dailyOperation?.status || 'DRAFT',
      submittedAt: dailyOperation?.submittedAt || null,
      reviewedAt: dailyOperation?.reviewedAt || null,
      rejectionReason: dailyOperation?.rejectionReason || null,
      submissionDeadline: deadline.toISOString(),
      isPastDeadline,
      lastSavedAt: lastSavedAt ? lastSavedAt.toISOString() : null,
      revenue: dailyOperation?.revenue ? {
        roomRevenue: dailyOperation.revenue.roomRevenue,
        minibarRevenue: dailyOperation.revenue.minibarRevenue,
        foodRevenue: dailyOperation.revenue.foodRevenue,
        otherRevenue: dailyOperation.revenue.otherRevenue,
      } : null,
      variableCost: dailyOperation?.variableCost || null,
      laborCost: dailyOperation?.laborCost || null,
      commissionCost: dailyOperation?.commissionCost || null,
      fixedCost: dailyOperation?.fixedCost || null,
      energy: dailyOperation?.energy || null,
      calculationResult: dailyOperation?.calculationResult || null,
      roomStatus: dailyOperation?.roomStatus || null,
      target: dailyTarget ? {
        revenueTarget: dailyTarget.revenueTarget,
        costTarget: dailyTarget.costTarget,
        gopTarget: dailyTarget.gopTarget,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching daily accounting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/hotels/:hotelId/daily-accounting/:businessDate
 * 创建或更新日经营数据 (保存草稿)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { hotelId, businessDate } = await params;
    const body = await request.json();

    // 解析日期
    const date = new Date(businessDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 验证酒店存在
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // 查询现有记录
    const existing = await prisma.dailyOperation.findUnique({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: date,
        },
      },
    });

    // 检查状态：只有 DRAFT 或 REJECTED 状态才能编辑
    if (existing && existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Cannot edit record in current status', currentStatus: existing.status },
        { status: 403 }
      );
    }

    // 计算提交截止时间
    const submissionDeadline = new Date(date);
    submissionDeadline.setDate(submissionDeadline.getDate() + 1);
    submissionDeadline.setHours(18, 0, 0, 0);

    // 创建或更新日经营记录
    const dailyOperation = await prisma.dailyOperation.upsert({
      where: {
        hotelId_businessDate: {
          hotelId,
          businessDate: date,
        },
      },
      update: {
        // 状态保持不变 (草稿保存不改变状态)
        status: existing?.status === 'REJECTED' ? 'DRAFT' : (existing?.status || 'DRAFT'),
      },
      create: {
        hotelId,
        businessDate: date,
        status: 'DRAFT',
        submissionDeadline,
      },
    });

    // 更新关联数据
    const {
      revenue,
      variableCost,
      laborCost,
      commissionCost,
      fixedCost,
      energy,
      roomStatus,
    } = body;

    // 更新收入
    if (revenue) {
      const roomRevenue = toNumber(revenue.roomRevenue);
      const minibarRevenue = toNumber(revenue.minibarRevenue);
      const foodRevenue = toNumber(revenue.foodRevenue);
      const otherRevenue = toNumber(revenue.otherRevenue);
      const totalRevenue = roomRevenue + minibarRevenue + foodRevenue + otherRevenue;

      await prisma.revenue.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          roomRevenue,
          minibarRevenue,
          foodRevenue,
          otherRevenue,
          totalRevenue,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          roomRevenue,
          minibarRevenue,
          foodRevenue,
          otherRevenue,
          totalRevenue,
        },
      });
    }

    // 更新变动成本
    if (variableCost) {
      const roomSuppliesCost = toNumber(variableCost.roomSuppliesCost);
      const frontDeskItemsCost = toNumber(variableCost.frontDeskItemsCost);
      const merchandiseCost = toNumber(variableCost.merchandiseCost);
      const laundryCost = toNumber(variableCost.laundryCost);
      const restaurantCost = toNumber(variableCost.restaurantCost);
      const otherVariableCost = toNumber(variableCost.otherVariableCost);
      const totalVariableCost = roomSuppliesCost + frontDeskItemsCost + merchandiseCost + laundryCost + restaurantCost + otherVariableCost;

      await prisma.variableCost.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          roomSuppliesCost,
          frontDeskItemsCost,
          merchandiseCost,
          laundryCost,
          restaurantCost,
          otherVariableCost,
          totalVariableCost,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          roomSuppliesCost,
          frontDeskItemsCost,
          merchandiseCost,
          laundryCost,
          restaurantCost,
          otherVariableCost,
          totalVariableCost,
        },
      });
    }

    // 更新人工成本
    if (laborCost) {
      const frontDeskWages = toNumber(laborCost.frontDeskWages);
      const housekeepingWages = toNumber(laborCost.housekeepingWages);
      const restaurantWages = toNumber(laborCost.restaurantWages);
      const managementWages = toNumber(laborCost.managementWages);
      const totalLaborCost = frontDeskWages + housekeepingWages + restaurantWages + managementWages;

      await prisma.laborCost.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          frontDeskWages,
          housekeepingWages,
          restaurantWages,
          managementWages,
          totalLaborCost,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          frontDeskWages,
          housekeepingWages,
          restaurantWages,
          managementWages,
          totalLaborCost,
        },
      });
    }

    // 更新提成成本
    if (commissionCost) {
      await prisma.commissionCost.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          reviewCommission: toNumber(commissionCost.reviewCommission),
          qrCommission: toNumber(commissionCost.qrCommission),
          memberCardCommission: toNumber(commissionCost.memberCardCommission),
          housekeepingCommission: toNumber(commissionCost.housekeepingCommission),
          totalCommissionCost:
            toNumber(commissionCost.reviewCommission) +
            toNumber(commissionCost.qrCommission) +
            toNumber(commissionCost.memberCardCommission) +
            toNumber(commissionCost.housekeepingCommission),
        },
        create: {
          dailyOperationId: dailyOperation.id,
          reviewCommission: toNumber(commissionCost.reviewCommission),
          qrCommission: toNumber(commissionCost.qrCommission),
          memberCardCommission: toNumber(commissionCost.memberCardCommission),
          housekeepingCommission: toNumber(commissionCost.housekeepingCommission),
          totalCommissionCost:
            toNumber(commissionCost.reviewCommission) +
            toNumber(commissionCost.qrCommission) +
            toNumber(commissionCost.memberCardCommission) +
            toNumber(commissionCost.housekeepingCommission),
        },
      });
    }

    // 更新固定成本
    if (fixedCost) {
      const rent = toNumber(fixedCost.rent);
      const platformPromotionFee = toNumber(fixedCost.platformPromotionFee);
      const otherFixedCost = toNumber(fixedCost.otherFixedCost);
      const totalFixedCost = rent + platformPromotionFee + otherFixedCost;

      await prisma.fixedCost.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          rent,
          platformPromotionFee,
          otherFixedCost,
          totalFixedCost,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          rent,
          platformPromotionFee,
          otherFixedCost,
          totalFixedCost,
        },
      });
    }

    // 更新能耗
    if (energy) {
      const electricityConsumption = toNumber(energy.electricityConsumption);
      const electricityUnitPrice = toNumber(energy.electricityUnitPrice);
      const waterConsumption = toNumber(energy.waterConsumption);
      const waterUnitPrice = toNumber(energy.waterUnitPrice);
      const gasConsumption = toNumber(energy.gasConsumption);
      const gasUnitPrice = toNumber(energy.gasUnitPrice);

      const electricityCost = Math.round(electricityConsumption * electricityUnitPrice * 100) / 100;
      const waterCost = Math.round(waterConsumption * waterUnitPrice * 100) / 100;
      const gasCost = Math.round(gasConsumption * gasUnitPrice * 100) / 100;
      const totalUtilityCost = electricityCost + waterCost + gasCost;

      await prisma.energy.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          electricityConsumption,
          electricityUnitPrice,
          electricityCost,
          waterConsumption,
          waterUnitPrice,
          waterCost,
          gasConsumption,
          gasUnitPrice,
          gasCost,
          totalUtilityCost,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          electricityConsumption,
          electricityUnitPrice,
          electricityCost,
          waterConsumption,
          waterUnitPrice,
          waterCost,
          gasConsumption,
          gasUnitPrice,
          gasCost,
          totalUtilityCost,
        },
      });
    }

    // 更新房态数据
    if (roomStatus) {
      await prisma.roomStatus.upsert({
        where: { dailyOperationId: dailyOperation.id },
        update: {
          soldRooms: roomStatus.soldRooms ?? 0,
        },
        create: {
          dailyOperationId: dailyOperation.id,
          soldRooms: roomStatus.soldRooms ?? 0,
        },
      });
    }

    // 重新查询更新后的数据
    const updated = await prisma.dailyOperation.findUnique({
      where: { id: dailyOperation.id },
      include: {
        revenue: true,
        variableCost: true,
        laborCost: true,
        commissionCost: true,
        fixedCost: true,
        energy: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      data: {
        hotelId,
        businessDate,
        status: updated?.status,
        lastSavedAt: updated?.updatedAt?.toISOString(),
        revenue: updated?.revenue,
        variableCost: updated?.variableCost,
        laborCost: updated?.laborCost,
        commissionCost: updated?.commissionCost,
        fixedCost: updated?.fixedCost,
        energy: updated?.energy,
      },
    });
  } catch (error) {
    console.error('Error saving daily accounting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
