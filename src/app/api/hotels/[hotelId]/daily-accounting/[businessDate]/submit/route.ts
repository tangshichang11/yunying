import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * POST /api/hotels/:hotelId/daily-accounting/:businessDate/submit
 * 提交日经营数据审核
 */
export async function POST(request: NextRequest, { params }: Params) {
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
      },
    });

    if (!dailyOperation) {
      return NextResponse.json(
        { error: 'Daily operation record not found. Save draft first.' },
        { status: 404 }
      );
    }

    // 检查状态：只有 DRAFT 或 REJECTED 可以提交
    if (dailyOperation.status !== 'DRAFT' && dailyOperation.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Cannot submit in current status', currentStatus: dailyOperation.status },
        { status: 403 }
      );
    }

    // 检查必填字段
    const validationErrors: string[] = [];

    // 辅助函数：将 Prisma Decimal 转换为 number
    const toNum = (val: unknown): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return (val as { toNumber: () => number }).toNumber();
      }
      return Number(val) || 0;
    };

    // 收入校验
    if (!dailyOperation.revenue) {
      validationErrors.push('收入数据未填写');
    } else {
      if (toNum(dailyOperation.revenue.roomRevenue) < 0) {
        validationErrors.push('房费收入不能为负数');
      }
      if (toNum(dailyOperation.revenue.minibarRevenue) < 0) {
        validationErrors.push('迷你吧收入不能为负数');
      }
      if (toNum(dailyOperation.revenue.foodRevenue) < 0) {
        validationErrors.push('餐费收入不能为负数');
      }
      if (toNum(dailyOperation.revenue.otherRevenue) < 0) {
        validationErrors.push('其他业务收入不能为负数');
      }
    }

    // 成本校验 (成本可以为0但不能为负)
    if (dailyOperation.variableCost) {
      if (toNum(dailyOperation.variableCost.roomSuppliesCost) < 0) {
        validationErrors.push('客房耗材成本不能为负数');
      }
      if (toNum(dailyOperation.variableCost.frontDeskItemsCost) < 0) {
        validationErrors.push('前台增值物品成本不能为负数');
      }
      if (toNum(dailyOperation.variableCost.merchandiseCost) < 0) {
        validationErrors.push('小商品成本不能为负数');
      }
      if (toNum(dailyOperation.variableCost.laundryCost) < 0) {
        validationErrors.push('洗涤费不能为负数');
      }
      if (toNum(dailyOperation.variableCost.restaurantCost) < 0) {
        validationErrors.push('餐厅成本不能为负数');
      }
    }

    if (dailyOperation.fixedCost) {
      if (toNum(dailyOperation.fixedCost.rent) < 0) {
        validationErrors.push('租金不能为负数');
      }
      if (toNum(dailyOperation.fixedCost.platformPromotionFee) < 0) {
        validationErrors.push('平台推广费不能为负数');
      }
      if (toNum(dailyOperation.fixedCost.otherFixedCost) < 0) {
        validationErrors.push('其他固定成本不能为负数');
      }
    }

    // 能耗校验
    if (dailyOperation.energy) {
      if (toNum(dailyOperation.energy.electricityConsumption) < 0) {
        validationErrors.push('电消耗量不能为负数');
      }
      if (toNum(dailyOperation.energy.electricityUnitPrice) < 0) {
        validationErrors.push('电单价不能为负数');
      }
      if (toNum(dailyOperation.energy.waterConsumption) < 0) {
        validationErrors.push('水消耗量不能为负数');
      }
      if (toNum(dailyOperation.energy.waterUnitPrice) < 0) {
        validationErrors.push('水单价不能为负数');
      }
    }

    // 如果有验证错误，返回
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // 计算提交截止时间
    const deadline = new Date(date);
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(18, 0, 0, 0);

    // 检查是否已过截止时间
    const now = new Date();
    const isPastDeadline = now > deadline;

    // 更新状态为 SUBMITTED
    const updated = await prisma.dailyOperation.update({
      where: { id: dailyOperation.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        submittedBy: 'hotel-manager', // TODO: 从session获取实际用户ID
      },
    });

    // 创建审计日志
    await prisma.auditLog.create({
      data: {
        entityType: 'DailyOperation',
        entityId: dailyOperation.id,
        action: 'SUBMIT',
        oldValue: { status: dailyOperation.status },
        newValue: { status: 'SUBMITTED' },
        operatorId: 'hotel-manager', // TODO: 从session获取实际用户ID
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        timestamp: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submitted for review successfully',
      data: {
        id: updated.id,
        status: updated.status,
        submittedAt: updated.submittedAt?.toISOString(),
        isPastDeadline,
        deadline: deadline.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error submitting daily accounting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
