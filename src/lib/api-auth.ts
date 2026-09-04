import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  hotelId: string | null;
  regionId: string | null;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user as AuthUser;
}

export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }
  return user;
}

export async function requireHotelAccess(hotelId: string): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // ADMIN 可以访问所有酒店
  if (user.role === 'ADMIN') {
    return user;
  }

  // REGIONAL_DIRECTOR 可以访问自己区域的所有酒店
  if (user.role === 'REGIONAL_DIRECTOR') {
    // 需要检查酒店是否属于该区域（通过查询数据库）
    // 这里暂时返回，后续会完善
    return user;
  }

  // STORE_MANAGER 只能访问自己的酒店
  if (user.role === 'HOTEL_MANAGER') {
    if (user.hotelId !== hotelId) {
      return NextResponse.json({ error: '无权访问该酒店数据' }, { status: 403 });
    }
    return user;
  }

  return NextResponse.json({ error: '权限不足' }, { status: 403 });
}

export async function requireRegionAccess(regionId: string): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // ADMIN 可以访问所有区域
  if (user.role === 'ADMIN') {
    return user;
  }

  // REGIONAL_DIRECTOR 只能访问自己的区域
  if (user.role === 'REGIONAL_DIRECTOR') {
    if (user.regionId !== regionId) {
      return NextResponse.json({ error: '无权访问该区域数据' }, { status: 403 });
    }
    return user;
  }

  // STORE_MANAGER 不应该有区域级别的访问权限
  return NextResponse.json({ error: '权限不足' }, { status: 403 });
}
