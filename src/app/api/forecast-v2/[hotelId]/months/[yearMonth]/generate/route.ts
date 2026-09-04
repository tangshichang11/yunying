import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth, formatForecastDay } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';
import { generateDailyForecast } from '@/lib/forecast';
import { getDaysInMonth, getDayOfWeek, isWeekend } from '@/lib/forecast-v2/validation';

/**
 * POST /api/forecast-v2/[hotelId]/months/[yearMonth]/generate
 * 智能生成每日 Forecast
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
    });

    if (!forecastMonth) {
      return NextResponse.json(
        { error: '未找到该月份的 Forecast' },
        { status: 404 }
      );
    }

    // 只有 DRAFT 或 REJECTED 状态才能重新生成
    if (
      forecastMonth.status !== ForecastMonthStatus.DRAFT &&
      forecastMonth.status !== ForecastMonthStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: '当前状态不允许重新生成' },
        { status: 400 }
      );
    }

    // 使用请求体中的 monthlyForecast 值，并更新数据库
    const monthlyForecast = Number(body.monthlyForecast);

    // 更新数据库中的月度总额
    await prisma.forecastMonth.update({
      where: { id: forecastMonth.id },
      data: {
        monthlyRevenueForecast: monthlyForecast,
        status: ForecastMonthStatus.DRAFT,
        rejectionReason: null,
      },
    });

    const dailyResults = generateDailyForecast(
      yearMonth,
      monthlyForecast
    );

    const daysInMonth = getDaysInMonth(year, month);

    // 删除旧的每日数据
    await prisma.forecastDay.deleteMany({
      where: { forecastMonthId: forecastMonth.id },
    });

    // 创建新的每日数据
    const dailyForecasts = await Promise.all(
      dailyResults.map(async (result) => {
        // 使用算法返回的日期字符串创建日期
        const [y, m, d] = result.date.split('-').map(Number);
        const businessDate = new Date(y, m - 1, d);

        return prisma.forecastDay.create({
          data: {
            forecastMonthId: forecastMonth.id,
            businessDate,
            dayOfWeek: result.dayOfWeek,
            isWeekend: result.isWeekend,
            isHoliday: false,
            systemSuggestedAmount: result.expectedRevenue,
            finalAmount: result.expectedRevenue,
            isManuallyAdjusted: false,
            isLocked: false,
          },
        });
      })
    );

    // 获取更新后的月度 Forecast
    const updatedMonth = await prisma.forecastMonth.findUnique({
      where: { id: forecastMonth.id },
      include: {
        dailyForecasts: {
          orderBy: { businessDate: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: formatForecastMonth(updatedMonth as any),
      message: `已生成 ${daysInMonth} 天的每日 Forecast`,
    });
  } catch (error) {
    console.error('Error generating daily forecasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
