import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';

/**
 * GET /api/forecast-v2/[hotelId]/months/[yearMonth]
 * 获取指定月份的 Forecast
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string }> }
) {
  try {
    const { hotelId, yearMonth } = await params;
    const [year, month] = yearMonth.split('-').map(Number);

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

    return NextResponse.json({
      success: true,
      data: formatForecastMonth(forecastMonth as any),
    });
  } catch (error) {
    console.error('Error fetching forecast month:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forecast-v2/[hotelId]/months/[yearMonth]
 * 更新月度 Forecast 基本信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string }> }
) {
  try {
    const { hotelId, yearMonth } = await params;
    const body = await request.json();
    const [year, month] = yearMonth.split('-').map(Number);

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

    // 更新
    const updated = await prisma.forecastMonth.update({
      where: { id: forecastMonth.id },
      data: {
        monthlyRevenueForecast: body.monthlyRevenueForecast,
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
    });
  } catch (error) {
    console.error('Error updating forecast month:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/forecast-v2/[hotelId]/months/[yearMonth]
 * 删除月度 Forecast（只能删除草稿）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string; yearMonth: string }> }
) {
  try {
    const { hotelId, yearMonth } = await params;
    const [year, month] = yearMonth.split('-').map(Number);

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

    // 只能删除草稿
    if (forecastMonth.status !== ForecastMonthStatus.DRAFT) {
      return NextResponse.json(
        { error: '只能删除草稿状态的 Forecast' },
        { status: 400 }
      );
    }

    await prisma.forecastMonth.delete({
      where: { id: forecastMonth.id },
    });

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Error deleting forecast month:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
