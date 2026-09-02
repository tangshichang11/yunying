import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/regional/review
 * 获取区域下所有酒店的待审核日经营数据列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'SUBMITTED';
    const regionId = searchParams.get('regionId');

    // 构建查询条件
    const whereClause: Record<string, unknown> = {
      status,
    };

    // 如果指定了 regionId，只查询该区域下的酒店
    if (regionId) {
      whereClause.hotel = {
        regionId,
      };
    }

    // 查询日经营记录
    const dailyOperations = await prisma.dailyOperation.findMany({
      where: whereClause,
      include: {
        hotel: {
          include: {
            region: true,
          },
        },
        revenue: true,
        calculationResult: true,
        anomalies: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // 收集所有 hotelId 和 businessDate 用于批量查询目标
    const hotelIds = [...new Set(dailyOperations.map(op => op.hotelId))];
    const businessDates = [...new Set(dailyOperations.map(op => op.businessDate))];

    // 批量查询目标数据
    const targets = await prisma.dailyTarget.findMany({
      where: {
        hotelId: { in: hotelIds },
        businessDate: { in: businessDates },
      },
    });

    // 创建 target 查找映射
    const targetMap = new Map(
      targets.map(t => [`${t.hotelId}-${t.businessDate.toISOString().split('T')[0]}`, t])
    );

    // 转换为响应格式
    const result = dailyOperations.map(op => {
      const dateKey = op.businessDate.toISOString().split('T')[0];
      const target = targetMap.get(`${op.hotelId}-${dateKey}`);

      return {
        id: op.id,
        hotelId: op.hotelId,
        hotelName: op.hotel.name,
        hotelCode: op.hotel.code,
        regionId: op.hotel.regionId,
        regionName: op.hotel.region.name,
        businessDate: dateKey,
        submittedAt: op.submittedAt?.toISOString() || null,
        status: op.status,
        // 收入数据
        revenue: op.revenue ? {
          totalRevenue: Number(op.revenue.totalRevenue),
        } : null,
        // 计算结果
        calculationResult: op.calculationResult ? {
          totalRevenue: Number(op.calculationResult.totalRevenue),
          totalCost: Number(op.calculationResult.totalCost),
          gop: Number(op.calculationResult.gop),
          gopRate: Number(op.calculationResult.gopRate),
          isRevenueAnomaly: op.calculationResult.isRevenueAnomaly,
          isCostAnomaly: op.calculationResult.isCostAnomaly,
        } : null,
        // 异常数量
        anomalyCount: op.anomalies.length,
        // 目标数据
        target: target ? {
          revenueTarget: Number(target.revenueTarget),
          costTarget: Number(target.costTarget),
          gopTarget: Number(target.gopTarget),
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error fetching review list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
