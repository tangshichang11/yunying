import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';
import { validateForecastMonth } from '@/lib/forecast-v2/validation';

/**
 * POST /api/forecast-v2/[hotelId]/months/[yearMonth]/submit
 * 提交 Forecast 供总监审核
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

    // 只能是 DRAFT 或 REJECTED 状态才能提交
    if (
      forecastMonth.status !== ForecastMonthStatus.DRAFT &&
      forecastMonth.status !== ForecastMonthStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: '只有草稿或被退回的状态才能提交' },
        { status: 400 }
      );
    }

    // 校验数据完整性 - 使用本地时区格式化日期
    const validation = validateForecastMonth(
      forecastMonth.dailyForecasts.map((df) => {
        const d = df.businessDate;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
          businessDate: dateStr,
          finalAmount: Number(df.finalAmount),
        };
      }),
      Number(forecastMonth.monthlyRevenueForecast),
      year,
      month
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: '数据校验失败，无法提交',
          validation,
        },
        { status: 400 }
      );
    }

    // 更新状态为 SUBMITTED
    const updated = await prisma.forecastMonth.update({
      where: { id: forecastMonth.id },
      data: {
        status: ForecastMonthStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedBy: body.operatorId || 'unknown',
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
      message: '已提交审核',
    });
  } catch (error) {
    console.error('Error submitting forecast for review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
