import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastDay } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';

/**
 * PUT /api/forecast-v2/[hotelId]/months/[yearMonth]/days/[date]
 * 更新单日 Forecast（店长人工调整）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string; date: string }> }
) {
  try {
    const { hotelId, yearMonth, date } = await params;
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
        dailyForecasts: true,
      },
    });

    if (!forecastMonth) {
      return NextResponse.json(
        { error: '未找到该月份的 Forecast' },
        { status: 404 }
      );
    }

    // 只有 DRAFT 或 REJECTED 状态才能修改
    if (
      forecastMonth.status !== ForecastMonthStatus.DRAFT &&
      forecastMonth.status !== ForecastMonthStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: '当前状态不允许修改' },
        { status: 400 }
      );
    }

    // 查找对应的每日数据
    // 使用本地日期比较，避免时区问题
    const [y, m, d] = date.split('-').map(Number);
    const targetDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dailyForecast = forecastMonth.dailyForecasts.find((df) => {
      const dbDate = df.businessDate;
      const dbDateStr = `${dbDate.getFullYear()}-${String(dbDate.getMonth() + 1).padStart(2, '0')}-${String(dbDate.getDate()).padStart(2, '0')}`;
      return dbDateStr === targetDateStr;
    });

    if (!dailyForecast) {
      return NextResponse.json(
        { error: '未找到该日期的 Forecast' },
        { status: 404 }
      );
    }

    const { finalAmount } = body;
    const systemSuggestedAmount = Number(dailyForecast.systemSuggestedAmount);

    // 更新
    const updated = await prisma.forecastDay.update({
      where: { id: dailyForecast.id },
      data: {
        finalAmount,
        manualAmount: finalAmount !== systemSuggestedAmount ? finalAmount : null,
        isManuallyAdjusted: finalAmount !== systemSuggestedAmount,
        isLocked: true, // 人工调整后锁定
      },
    });

    // 检查新的总额是否与月度预定一致
    const allDailyForecasts = await prisma.forecastDay.findMany({
      where: { forecastMonthId: forecastMonth.id },
    });

    const dailySum = allDailyForecasts.reduce(
      (sum, df) => sum + Number(df.finalAmount),
      0
    );
    const monthlyForecast = Number(forecastMonth.monthlyRevenueForecast);
    const difference = Math.abs(monthlyForecast - dailySum);

    return NextResponse.json({
      success: true,
      data: formatForecastDay(updated as any),
      balanceInfo: {
        dailySum,
        monthlyForecast,
        difference,
        isBalanced: difference < 1,
      },
    });
  } catch (error) {
    console.error('Error updating daily forecast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
