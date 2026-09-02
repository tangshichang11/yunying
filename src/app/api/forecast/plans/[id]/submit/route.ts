import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/forecast/plans/:id/submit
 * 提交审核 (DRAFT → SUBMITTED)
 * 只有校验通过才能提交
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // 获取计划
    const plan = await prisma.forecastPlan.findUnique({
      where: { id },
      include: {
        monthlyForecasts: {
          include: {
            dailyForecasts: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.status !== 'DRAFT') {
      return NextResponse.json(
        { error: '只能提交 DRAFT 状态的计划' },
        { status: 400 }
      );
    }

    // 校验每个月的汇总
    const validationErrors = [];
    for (const mf of plan.monthlyForecasts) {
      const dailySum = mf.dailyForecasts.reduce(
        (sum, df) => sum + Number(df.expectedRevenue),
        0
      );
      const variance = Math.abs(Number(mf.expectedRevenue) - dailySum);

      if (variance >= 0.01) {
        validationErrors.push({
          yearMonth: mf.yearMonth,
          monthlyForecast: Number(mf.expectedRevenue),
          dailySum,
          variance: Number(mf.expectedRevenue) - dailySum,
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: '每日预定合计与月度预定不一致，禁止提交',
          data: {
            validationErrors,
            summary: {
              monthlyTotal: validationErrors.reduce((sum, e) => sum + e.monthlyForecast, 0),
              dailyTotal: validationErrors.reduce((sum, e) => sum + e.dailySum, 0),
              totalVariance: validationErrors.reduce((sum, e) => sum + e.variance, 0),
            },
          },
        },
        { status: 400 }
      );
    }

    // 更新状态为 SUBMITTED
    const updatedPlan = await prisma.forecastPlan.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: '提交成功，请等待区域总监审核',
    });
  } catch (error) {
    console.error('Error submitting forecast plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
