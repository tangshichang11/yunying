'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Region {
  id: string;
  name: string;
}

interface Hotel {
  id: string;
  code: string;
  name: string;
  physicalRoomCount: number;
}

export default function RegionDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [region, setRegion] = useState<Region | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.regionId) {
      // 获取区域信息
      fetch('/api/regions')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const found = data.data.find((r: Region) => r.id === session.user.regionId);
            if (found) setRegion(found);
          }
        });

      // 获取该区域的酒店列表
      fetch(`/api/hotels?regionId=${session.user.regionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHotels(data.data);
          }
        });
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {region?.name || '区域管理'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                欢迎，{session.user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                区域总监
              </span>
              <a
                href="/api/auth/signout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-3xl font-bold text-blue-600">{hotels.length}</div>
            <div className="text-sm text-gray-500 mt-1">酒店数量</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-3xl font-bold text-green-600">
              {hotels.reduce((sum, h) => sum + h.physicalRoomCount, 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">房间总数</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-3xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500 mt-1">待审核</div>
          </div>
        </div>

        {/* 酒店列表 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">酒店列表</h2>
          </div>
          <div className="divide-y">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{hotel.name}</h3>
                    <p className="text-sm text-gray-500">{hotel.code}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">房间数</p>
                      <p className="font-medium">{hotel.physicalRoomCount} 间</p>
                    </div>
                    <a
                      href={`/region/hotel/${hotel.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      查看详情
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {hotels.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无酒店数据
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
