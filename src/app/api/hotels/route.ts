import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/hotels
 * 获取酒店列表（支持区域筛选）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');

    const where: Record<string, unknown> = {};
    if (regionId) {
      where.regionId = regionId;
    }

    const hotels = await prisma.hotel.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        physicalRoomCount: true,
        regionId: true,
        region: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: hotels.map((hotel) => ({
        id: hotel.id,
        code: hotel.code,
        name: hotel.name,
        physicalRoomCount: hotel.physicalRoomCount,
        regionId: hotel.regionId,
        regionName: hotel.region?.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
