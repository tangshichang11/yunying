import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forecast/plans/:id
 * 获取目标计划详情
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const plan = await prisma.forecastPlan.findUnique({
      where: { id },
      include: {
        monthlyForecasts: {
          include: {
            dailyForecasts: {
              orderBy: { businessDate: 'asc' },
            },
          },
          orderBy: { yearMonth: 'asc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // 计算每个月的汇总
    const monthlySummaries = plan.monthlyForecasts.map(mf => {
      const dailySum = mf.dailyForecasts.reduce(
        (sum, df) => sum + Number(df.expectedRevenue),
        0
      );
      return {
        yearMonth: mf.yearMonth,
        monthlyForecast: Number(mf.expectedRevenue),
        dailySum,
        variance: Number(mf.expectedRevenue) - dailySum,
        isBalanced: Math.abs(Number(mf.expectedRevenue) - dailySum) < 0.01,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        monthlySummaries,
      },
    });
  } catch (error) {
    console.error('Error fetching forecast plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
