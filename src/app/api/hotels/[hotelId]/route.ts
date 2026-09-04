import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser, requireHotelAccess } from '@/lib/api-auth';

interface Params {
  params: Promise<{
    hotelId: string;
  }>;
}

/**
 * GET /api/hotels/:hotelId
 * 获取指定酒店详情
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { hotelId } = await params;

    // 权限检查
    const authUser = await requireHotelAccess(hotelId);
    if (authUser instanceof NextResponse) {
      return authUser;
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { region: true },
    });

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: hotel.id,
        code: hotel.code,
        name: hotel.name,
        physicalRoomCount: hotel.physicalRoomCount,
        regionId: hotel.regionId,
        regionName: hotel.region.name,
      },
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
