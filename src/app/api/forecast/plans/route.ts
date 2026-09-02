import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ForecastPlanStatus } from '@prisma/client';

/**
 * GET /api/forecast/plans
 * 获取酒店的目标计划列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const year = searchParams.get('year');
    const status = searchParams.get('status') as ForecastPlanStatus | null;

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { hotelId };
    if (year) where.year = parseInt(year);
    if (status && Object.values(ForecastPlanStatus).includes(status)) {
      where.status = status;
    }

    const plans = await prisma.forecastPlan.findMany({
      where,
      include: {
        monthlyForecasts: {
          include: {
            dailyForecasts: true,
          },
          orderBy: { yearMonth: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching forecast plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/forecast/plans
 * 创建新的目标计划
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, year, name, startMonth, endMonth } = body;

    if (!hotelId || !year) {
      return NextResponse.json({ error: 'hotelId and year are required' }, { status: 400 });
    }

    // 检查是否已存在 ACTIVE 版本的同年计划
    const existingActive = await prisma.forecastPlan.findFirst({
      where: {
        hotelId,
        year,
        status: ForecastPlanStatus.APPROVED,
      },
    });

    if (existingActive) {
      return NextResponse.json(
        { error: '该年度已存在生效的计划，请先归档旧版本' },
        { status: 400 }
      );
    }

    // 创建计划
    const plan = await prisma.forecastPlan.create({
      data: {
        hotelId,
        year,
        name: name || `${year}年度经营目标`,
        startMonth,
        endMonth,
        status: ForecastPlanStatus.DRAFT,
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error creating forecast plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
