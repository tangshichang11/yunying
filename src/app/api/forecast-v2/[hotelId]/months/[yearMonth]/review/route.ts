import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';

/**
 * POST /api/forecast-v2/[hotelId]/months/[yearMonth]/review
 * 总监审核 Forecast（批准或拒绝）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string }> }
) {
  try {
    const { hotelId, yearMonth } = await params;
    const body = await request.json();
    const [year, month] = yearMonth.split('-').map(Number);
    const { action, reviewerId, rejectionReason } = body;

    // 查找月度 Forecast
    const forecastMonth = await prisma.forecastMonth.findUnique({
      where: {
        hotelId_year_month: {
          hotelId,
          year,
          month,
        },
      },
      include: {
        dailyForecasts: {
          orderBy: { businessDate: 'asc' },
        },
      },
    });

    if (!forecastMonth) {
      return NextResponse.json(
        { error: '未找到该月份的 Forecast' },
        { status: 404 }
      );
    }

    // 只能是 SUBMITTED 状态才能审核
    if (forecastMonth.status !== ForecastMonthStatus.SUBMITTED) {
      return NextResponse.json(
        { error: '只有已提交的状态才能审核' },
        { status: 400 }
      );
    }

    // 根据操作类型处理
    if (action === 'approve') {
      const updated = await prisma.forecastMonth.update({
        where: { id: forecastMonth.id },
        data: {
          status: ForecastMonthStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedBy: reviewerId || 'unknown',
          rejectionReason: null,
        },
        include: {
          dailyForecasts: {
            orderBy: { businessDate: 'asc' },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: formatForecastMonth(updated as any),
        message: '审核通过',
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: '拒绝时必须提供原因' },
          { status: 400 }
        );
      }

      const updated = await prisma.forecastMonth.update({
        where: { id: forecastMonth.id },
        data: {
          status: ForecastMonthStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: reviewerId || 'unknown',
          rejectionReason,
        },
        include: {
          dailyForecasts: {
            orderBy: { businessDate: 'asc' },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: formatForecastMonth(updated as any),
        message: '已退回',
      });
    } else {
      return NextResponse.json(
        { error: '无效的操作类型' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error reviewing forecast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
