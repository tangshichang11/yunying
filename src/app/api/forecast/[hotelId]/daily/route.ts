import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ hotelId: string }>;
}

/**
 * GET /api/forecast/:hotelId/daily?date=2026-08-31
 * 获取指定日期的每日预定
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const businessDate = new Date(dateStr);
    const year = businessDate.getFullYear();
    const yearMonth = `${year}-${String(businessDate.getMonth() + 1).padStart(2, '0')}`;

    // 查找生效的计划
    const activePlan = await prisma.forecastPlan.findFirst({
      where: {
        hotelId,
        year,
        status: 'APPROVED', // 只查询已审核通过的计划
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activePlan) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '没有生效的业绩预定计划',
      });
    }

    // 查找月度预定
    const monthlyForecast = await prisma.monthlyForecast.findUnique({
      where: {
        planId_yearMonth: {
          planId: activePlan.id,
          yearMonth,
        },
      },
    });

    if (!monthlyForecast) {
      return NextResponse.json({
        success: true,
        data: null,
        message: `该月 (${yearMonth}) 没有业绩预定`,
      });
    }

    // 查找每日预定
    const dailyForecast = await prisma.dailyForecast.findUnique({
      where: {
        monthlyForecastId_businessDate: {
          monthlyForecastId: monthlyForecast.id,
          businessDate,
        },
      },
    });

    // 计算当月已分配总额
    const monthDailyForecasts = await prisma.dailyForecast.findMany({
      where: { monthlyForecastId: monthlyForecast.id },
    });
    const monthTotal = monthDailyForecasts.reduce(
      (sum, df) => sum + Number(df.expectedRevenue),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        planId: activePlan.id,
        planName: activePlan.name,
        yearMonth,
        businessDate: dateStr,
        dailyForecast: dailyForecast
          ? {
              id: dailyForecast.id,
              expectedRevenue: Number(dailyForecast.expectedRevenue),
            }
          : null,
        monthlyForecast: {
          id: monthlyForecast.id,
          expectedRevenue: Number(monthlyForecast.expectedRevenue),
        },
        monthSummary: {
          monthlyTotal: Number(monthlyForecast.expectedRevenue),
          allocatedTotal: monthTotal,
          remaining: Number(monthlyForecast.expectedRevenue) - monthTotal,
          allocatedCount: monthDailyForecasts.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching daily forecast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
