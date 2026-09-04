import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';
import { DailyOperationStatus } from '@prisma/client';

/**
 * GET /api/regional/review
 * 获取区域下所有酒店的待审核日经营数据列表
 */
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 只有 ADMIN 和 REGIONAL_DIRECTOR 可以访问审核列表
    if (authUser.role !== 'ADMIN' && authUser.role !== 'REGIONAL_DIRECTOR') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status') as DailyOperationStatus || 'SUBMITTED';

    // Validate status is a valid DailyOperationStatus
    const validStatuses: DailyOperationStatus[] = ['DRAFT', 'SUBMITTED', 'REJECTED', 'APPROVED'];
    const status: DailyOperationStatus = validStatuses.includes(statusParam) ? statusParam : 'SUBMITTED';

    console.log('User:', authUser.role, authUser.regionId);

    // 先简单查询，看看问题在哪里
    const operations = await prisma.dailyOperation.findMany({
      where: { status },
      take: 5,
    });

    console.log('Operations found:', operations.length);

    // 如果上面的查询成功，再尝试带 include 的查询
    const dailyOperations = await prisma.dailyOperation.findMany({
      where: { status },
      include: {
        hotel: {
          include: {
            region: true,
          },
        },
        revenue: true,
        calculationResult: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: dailyOperations.map(op => ({
        id: op.id,
        hotelId: op.hotelId,
        hotelName: op.hotel?.name,
        businessDate: op.businessDate.toISOString().split('T')[0],
        status: op.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching review list:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
