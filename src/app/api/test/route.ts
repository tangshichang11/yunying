import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const count = await prisma.dailyOperation.count();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
