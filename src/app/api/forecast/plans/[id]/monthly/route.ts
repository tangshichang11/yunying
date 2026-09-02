import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/forecast/plans/:id/monthly
 * 更新月度预定
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { yearMonth, expectedRevenue } = body;

    if (!yearMonth || expectedRevenue === undefined) {
      return NextResponse.json(
        { error: 'yearMonth and expectedRevenue are required' },
        { status: 400 }
      );
    }

    // 检查计划是否存在且为 DRAFT 状态
    const plan = await prisma.forecastPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    if (plan.status !== 'DRAFT') {
      return NextResponse.json(
        { error: '只能编辑 DRAFT 状态的计划' },
        { status: 400 }
      );
    }

    // 查找或创建月度预定
    const monthlyForecast = await prisma.monthlyForecast.upsert({
      where: {
        planId_yearMonth: {
          planId: id,
          yearMonth,
        },
      },
      update: {
        expectedRevenue,
      },
      create: {
        planId: id,
        yearMonth,
        expectedRevenue,
      },
    });

    return NextResponse.json({ success: true, data: monthlyForecast });
  } catch (error) {
    console.error('Error updating monthly forecast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
