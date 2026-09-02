import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/forecast/plans/:id/validate
 * 校验月度预定与每日预定是否匹配
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // 获取计划及所有月度/每日预定
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

    // 校验每个月的汇总
    const validationResults = plan.monthlyForecasts.map(mf => {
      const dailySum = mf.dailyForecasts.reduce(
        (sum, df) => sum + Number(df.expectedRevenue),
        0
      );
      const monthlyValue = Number(mf.expectedRevenue);
      const variance = monthlyValue - dailySum;
      const isBalanced = Math.abs(variance) < 0.01; // 允许浮点数误差

      return {
        yearMonth: mf.yearMonth,
        monthlyForecast: monthlyValue,
        dailySum,
        variance,
        isBalanced,
        dailyCount: mf.dailyForecasts.length,
      };
    });

    // 整体校验结果
    const allBalanced = validationResults.every(r => r.isBalanced);
    const totalMonthly = validationResults.reduce((sum, r) => sum + r.monthlyForecast, 0);
    const totalDaily = validationResults.reduce((sum, r) => sum + r.dailySum, 0);

    return NextResponse.json({
      success: true,
      data: {
        planId: id,
        isValid: allBalanced,
        validationResults,
        summary: {
          totalMonthly,
          totalDaily,
          totalVariance: totalMonthly - totalDaily,
          isBalanced: Math.abs(totalMonthly - totalDaily) < 0.01,
          monthCount: validationResults.length,
          balancedMonthCount: validationResults.filter(r => r.isBalanced).length,
        },
      },
    });
  } catch (error) {
    console.error('Error validating forecast plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
