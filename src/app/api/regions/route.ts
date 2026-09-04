import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

/**
 * GET /api/regions
 * 获取区域列表
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否已登录
    const authResult = await requireRole('ADMIN', 'REGIONAL_DIRECTOR', 'HOTEL_MANAGER');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const regions = await prisma.region.findMany({
      include: {
        hotels: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: regions.map((r) => ({
        id: r.id,
        name: r.name,
        hotelCount: r.hotels.length,
      })),
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
