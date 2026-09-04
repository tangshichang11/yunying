import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';

/**
 * GET /api/hotels
 * 获取酒店列表（支持区域筛选）
 * 权限控制：
 * - ADMIN: 可以查看所有酒店
 * - REGIONAL_DIRECTOR: 只能查看自己区域的酒店
 * - HOTEL_MANAGER: 只能查看自己的酒店
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const hotelId = searchParams.get('hotelId'); // 单个酒店查询

    // 单个酒店查询时进行权限检查
    if (hotelId) {
      if (user.role === 'HOTEL_MANAGER' && user.hotelId !== hotelId) {
        return NextResponse.json({ error: '无权访问该酒店' }, { status: 403 });
      }
      if (user.role === 'REGIONAL_DIRECTOR') {
        const hotel = await prisma.hotel.findUnique({
          where: { id: hotelId },
          select: { regionId: true },
        });
        if (hotel && hotel.regionId !== user.regionId) {
          return NextResponse.json({ error: '无权访问该酒店' }, { status: 403 });
        }
      }
    }

    const where: Record<string, unknown> = {};

    // 根据角色筛选
    if (user.role === 'HOTEL_MANAGER') {
      // 店长只能查看自己的酒店
      where.id = user.hotelId;
    } else if (user.role === 'REGIONAL_DIRECTOR') {
      // 区域总监只能查看自己区域的酒店
      where.regionId = user.regionId;
      if (regionId) {
        where.regionId = regionId;
      }
    } else {
      // ADMIN 可以查看所有酒店
      if (regionId) {
        where.regionId = regionId;
      }
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
