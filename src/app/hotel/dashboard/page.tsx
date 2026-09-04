'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Hotel {
  id: string;
  code: string;
  name: string;
  physicalRoomCount: number;
}

interface AllHotel {
  id: string;
  code: string;
  name: string;
  physicalRoomCount: number;
  regionId: string;
  regionName?: string;
}

export default function HotelDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [allHotels, setAllHotels] = useState<AllHotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Handle session and initial data load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user && !initialized) {
      setInitialized(true);

      if (session.user.role === 'ADMIN') {
        setLoadingHotels(true);
        fetch('/api/hotels')
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setAllHotels(data.data);
              if (session.user.hotelId) {
                setSelectedHotelId(session.user.hotelId);
              } else if (data.data.length > 0) {
                setSelectedHotelId(data.data[0].id);
              }
            }
          })
          .finally(() => setLoadingHotels(false));
      } else if (session.user.hotelId) {
        setSelectedHotelId(session.user.hotelId);
      }
    }
  }, [status, session, initialized, router]);

  // Fetch selected hotel data
  useEffect(() => {
    if (selectedHotelId) {
      fetch(`/api/hotels/${selectedHotelId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHotel(data.data);
          }
        });
    }
  }, [selectedHotelId]);

  if (!initialized || status === 'loading') {
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
                {hotel?.name || '加载中...'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                欢迎，{session.user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Admin hotel selector */}
              {session.user.role === 'ADMIN' && allHotels.length > 0 && (
                <select
                  value={selectedHotelId || ''}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="" disabled>选择酒店</option>
                  {allHotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.code})
                    </option>
                  ))}
                </select>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {session.user.role === 'ADMIN' ? '管理员' : session.user.role === 'REGIONAL_DIRECTOR' ? '区域总监' : '店长'}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出登录
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 日核算 */}
          <a
            href={selectedHotelId ? `/hotel/daily-accounting?hotelId=${selectedHotelId}` : '/hotel/daily-accounting'}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">日核算</h2>
                <p className="text-sm text-gray-500">每日经营数据录入与核算</p>
              </div>
            </div>
          </a>

          {/* 业绩预定 */}
          <a
            href={selectedHotelId ? `/hotel/forecast?hotelId=${selectedHotelId}` : '/hotel/forecast'}
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">业绩预定</h2>
                <p className="text-sm text-gray-500">月度业绩预定与智能生成</p>
              </div>
            </div>
          </a>
        </div>

        {/* 酒店信息 */}
        {hotel && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">酒店信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">酒店编码</p>
                <p className="font-medium">{hotel.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">酒店名称</p>
                <p className="font-medium">{hotel.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">房间数量</p>
                <p className="font-medium">{hotel.physicalRoomCount} 间</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
