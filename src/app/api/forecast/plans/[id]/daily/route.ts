import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/forecast/plans/:id/daily
 * 批量更新每日预定
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { yearMonth, dailyForecasts } = body;

    if (!yearMonth || !dailyForecasts || !Array.isArray(dailyForecasts)) {
      return NextResponse.json(
        { error: 'yearMonth and dailyForecasts array are required' },
        { status: 400 }
      );
    }

    // 检查计划是否存在且为 DRAFT 状态
    const plan = await prisma.forecastPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    if (plan.status !== 'DRAFT') {
      return NextResponse.json(
        { error: '只能编辑 DRAFT 状态的计划' },
        { status: 400 }
      );
    }

    // 查找月度预定
    const monthlyForecast = await prisma.monthlyForecast.findUnique({
      where: {
        planId_yearMonth: {
          planId: id,
          yearMonth,
        },
      },
    });

    if (!monthlyForecast) {
      return NextResponse.json(
        { error: '请先创建月度预定' },
        { status: 400 }
      );
    }

    // 批量更新每日预定
    const results = [];
    for (const df of dailyForecasts) {
      const daily = await prisma.dailyForecast.upsert({
        where: {
          monthlyForecastId_businessDate: {
            monthlyForecastId: monthlyForecast.id,
            businessDate: new Date(df.businessDate),
          },
        },
        update: {
          expectedRevenue: df.expectedRevenue,
        },
        create: {
          monthlyForecastId: monthlyForecast.id,
          businessDate: new Date(df.businessDate),
          expectedRevenue: df.expectedRevenue,
        },
      });
      results.push(daily);
    }

    // 计算当月汇总
    const allDaily = await prisma.dailyForecast.findMany({
      where: { monthlyForecastId: monthlyForecast.id },
    });
    const dailySum = allDaily.reduce(
      (sum, df) => sum + Number(df.expectedRevenue),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        monthlyForecast,
        dailyForecasts: results,
        summary: {
          monthlyForecast: Number(monthlyForecast.expectedRevenue),
          dailySum,
          variance: Number(monthlyForecast.expectedRevenue) - dailySum,
          isBalanced: Math.abs(Number(monthlyForecast.expectedRevenue) - dailySum) < 0.01,
        },
      },
    });
  } catch (error) {
    console.error('Error updating daily forecasts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
