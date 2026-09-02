import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';

/**
 * POST /api/forecast-v2/[hotelId]/months/[yearMonth]/rebalance
 * 重新平衡剩余日期的 Forecast
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string }> }
) {
  try {
    const { hotelId, yearMonth } = await params;
    const body = await request.json();
    const [year, month] = yearMonth.split('-').map(Number);

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

    // 只有 DRAFT 或 REJECTED 状态才能重新平衡
    if (
      forecastMonth.status !== ForecastMonthStatus.DRAFT &&
      forecastMonth.status !== ForecastMonthStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: '当前状态不允许重新平衡' },
        { status: 400 }
      );
    }

    const monthlyForecast = Number(forecastMonth.monthlyRevenueForecast);

    // 分离已锁定和未锁定的日期
    const lockedDays = forecastMonth.dailyForecasts.filter((df) => df.isLocked);
    const unlockedDays = forecastMonth.dailyForecasts.filter((df) => !df.isLocked);

    // 计算已锁定日期的总金额
    const lockedSum = lockedDays.reduce(
      (sum, df) => sum + Number(df.finalAmount),
      0
    );

    // 计算剩余预算
    const remainingBudget = monthlyForecast - lockedSum;

    // 计算未锁定日期的数量
    const unlockedCount = unlockedDays.length;

    if (unlockedCount === 0) {
      return NextResponse.json(
        { error: '所有日期都已锁定，无法重新平衡' },
        { status: 400 }
      );
    }

    if (remainingBudget < 0) {
      return NextResponse.json(
        { error: '锁定日期的总额已超过月度预定，无法重新平衡' },
        { status: 400 }
      );
    }

    // 计算未锁定日期的平均值（用于初始分配）
    const avgPerDay = remainingBudget / unlockedCount;

    // 检查是否有历史权重可以参考（如果有的话）
    // 目前暂时使用平均分配
    let finalAmounts: number[];
    const totalDays = forecastMonth.dailyForecasts.length;

    if (totalDays === 31 || totalDays === 30) {
      // 按天数平均分配
      finalAmounts = unlockedDays.map(() =>
        Math.round((avgPerDay / 100) * 100) / 100
      );
    } else {
      // 其他月份按天数平均
      finalAmounts = unlockedDays.map(() =>
        Math.round((avgPerDay / 100) * 100) / 100
      );
    }

    // 调整最后一天的金额以确保总额精确匹配
    const allocatedSum = finalAmounts.reduce((sum, amt) => sum + amt, 0);
    const adjustment = Math.round((remainingBudget - allocatedSum) * 100) / 100;
    finalAmounts[finalAmounts.length - 1] += adjustment;

    // 更新未锁定的日期
    await Promise.all(
      unlockedDays.map((day, index) =>
        prisma.forecastDay.update({
          where: { id: day.id },
          data: {
            finalAmount: finalAmounts[index],
            isLocked: false, // 重新平衡后解锁
            isManuallyAdjusted: false,
            manualAmount: null,
          },
        })
      )
    );

    // 获取更新后的数据
    const updatedMonth = await prisma.forecastMonth.findUnique({
      where: { id: forecastMonth.id },
      include: {
        dailyForecasts: {
          orderBy: { businessDate: 'asc' },
        },
      },
    });

    // 验证最终总额
    const finalSum = updatedMonth!.dailyForecasts.reduce(
      (sum, df) => sum + Number(df.finalAmount),
      0
    );
    const finalDiff = Math.abs(monthlyForecast - finalSum);

    return NextResponse.json({
      success: true,
      data: formatForecastMonth(updatedMonth as any),
      rebalanceInfo: {
        lockedDaysCount: lockedDays.length,
        unlockedDaysCount: unlockedDays.length,
        remainingBudget,
        allocatedSum: finalSum,
        finalDifference: finalDiff,
        isBalanced: finalDiff < 1,
      },
    });
  } catch (error) {
    console.error('Error rebalancing forecasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
