import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * POST /api/regional/review/:hotelId/:businessDate/reject
 * 驳回
 */
export async function POST(request: NextRequest, { params }: Params) {
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

    // 验证驳回原因
    const { reason } = body;
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
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

    // 检查状态：只有 SUBMITTED 可以驳回
    if (dailyOperation.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only SUBMITTED status can be rejected', currentStatus: dailyOperation.status },
        { status: 403 }
      );
    }

    const now = new Date();

    // 更新状态为 REJECTED
    const updated = await prisma.dailyOperation.update({
      where: { id: dailyOperation.id },
      data: {
        status: 'REJECTED',
        reviewedAt: now,
        reviewedBy: 'regional-director', // TODO: 从 session 获取实际用户ID
        rejectionReason: reason.trim(),
      },
    });

    // 创建审计日志
    await prisma.auditLog.create({
      data: {
        entityType: 'DailyOperation',
        entityId: dailyOperation.id,
        action: 'REJECT',
        oldValue: { status: dailyOperation.status },
        newValue: { status: 'REJECTED', reason: reason.trim() },
        operatorId: 'regional-director', // TODO: 从 session 获取实际用户ID
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        timestamp: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rejected successfully',
      data: {
        id: updated.id,
        status: updated.status,
        reviewedAt: updated.reviewedAt?.toISOString(),
        reviewedBy: updated.reviewedBy,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error rejecting daily operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
