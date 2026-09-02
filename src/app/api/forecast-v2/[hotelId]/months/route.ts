import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';

/**
 * GET /api/forecast-v2/[hotelId]/months
 * 获取酒店指定年份的月度 Forecast 列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const where: Record<string, unknown> = { hotelId };
    if (year) {
      where.year = parseInt(year);
    }

    const months = await prisma.forecastMonth.findMany({
      where,
      include: {
        dailyForecasts: {
          orderBy: { businessDate: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: months.map(formatForecastMonth),
    });
  } catch (error) {
    console.error('Error fetching forecast months:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forecast-v2/[hotelId]/months
 * 创建新的月度 Forecast
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const body = await request.json();
    const { year, month, monthlyRevenueForecast } = body;

    // 验证必填字段
    if (!year || !month || monthlyRevenueForecast === undefined) {
      return NextResponse.json(
        { error: 'year, month, monthlyRevenueForecast are required' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.forecastMonth.findUnique({
      where: {
        hotelId_year_month: {
          hotelId,
          year,
          month,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '该月份的 Forecast 已存在' },
        { status: 400 }
      );
    }

    // 创建月度 Forecast
    const forecastMonth = await prisma.forecastMonth.create({
      data: {
        hotelId,
        year,
        month,
        monthlyRevenueForecast,
        status: ForecastMonthStatus.DRAFT,
      },
      include: {
        dailyForecasts: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatForecastMonth(forecastMonth as any),
    });
  } catch (error) {
    console.error('Error creating forecast month:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
