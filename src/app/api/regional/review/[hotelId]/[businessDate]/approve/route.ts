import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireHotelAccess, getAuthUser } from '@/lib/api-auth';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * POST /api/regional/review/:hotelId/:businessDate/approve
 * 审核通过
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { hotelId, businessDate } = await params;

    // 权限检查
    const authUser = await requireHotelAccess(hotelId);
    if (authUser instanceof NextResponse) {
      return authUser;
    }

    // 只有 ADMIN 和 REGIONAL_DIRECTOR 可以审核
    if (authUser.role !== 'ADMIN' && authUser.role !== 'REGIONAL_DIRECTOR') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 解析日期
    const date = new Date(businessDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
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
    });

    if (!dailyOperation) {
      return NextResponse.json(
        { error: 'Daily operation not found' },
        { status: 404 }
      );
    }

    // 检查状态：只有 SUBMITTED 可以审核
    if (dailyOperation.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only SUBMITTED status can be approved', currentStatus: dailyOperation.status },
        { status: 403 }
      );
    }

    const now = new Date();

    // 更新状态为 APPROVED
    const updated = await prisma.dailyOperation.update({
      where: { id: dailyOperation.id },
      data: {
        status: 'APPROVED',
        reviewedAt: now,
        reviewedBy: authUser.id,
      },
    });

    // 创建审计日志
    await prisma.auditLog.create({
      data: {
        entityType: 'DailyOperation',
        entityId: dailyOperation.id,
        action: 'APPROVE',
        oldValue: { status: dailyOperation.status },
        newValue: { status: 'APPROVED' },
        operatorId: authUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        timestamp: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Approved successfully',
      data: {
        id: updated.id,
        status: updated.status,
        reviewedAt: updated.reviewedAt?.toISOString(),
        reviewedBy: updated.reviewedBy,
      },
    });
  } catch (error) {
    console.error('Error approving daily operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
