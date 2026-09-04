import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * GET /api/auth/session
 * 获取当前用户会话信息
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        name: session.user.name,
        role: session.user.role,
        hotelId: session.user.hotelId,
        regionId: session.user.regionId,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
