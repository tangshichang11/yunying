import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createExcelExport } from '@/lib/excel-export';

interface Params {
  params: Promise<{
    hotelId: string;
    businessDate: string;
  }>;
}

/**
 * POST /api/regional/export/:hotelId/:businessDate
 * Export Excel for a specific hotel and month
 *
 * Permission: REGIONAL_DIRECTOR, ADMIN only
 * Prerequisite: DailyOperation must be APPROVED
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { hotelId, businessDate } = await params;

    // TODO: Get user role from session
    // For now, allow with header check (in production, use proper auth)
    const userRole = request.headers.get('x-user-role') || 'REGIONAL_DIRECTOR';
    const userId = request.headers.get('x-user-id') || 'demo-user';

    // Permission check
    if (userRole !== 'REGIONAL_DIRECTOR' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied. Only REGIONAL_DIRECTOR or ADMIN can export.' },
        { status: 403 }
      );
    }

    // Parse business date to get year and month
    const date = new Date(businessDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed

    // Query hotel with region
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

    // Query monthly target
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyTarget = await prisma.monthlyTarget.findUnique({
      where: {
        hotelId_yearMonth: {
          hotelId,
          yearMonth,
        },
      },
    });

    // Query daily targets for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const dailyTargets = await prisma.dailyTarget.findMany({
      where: {
        hotelId,
        businessDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { businessDate: 'asc' },
    });

    // Query daily operations (approved) for the month
    const dailyOperations = await prisma.dailyOperation.findMany({
      where: {
        hotelId,
        businessDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'APPROVED',
      },
      include: {
        calculationResult: true,
      },
      orderBy: { businessDate: 'asc' },
    });

    // Check if there are any approved operations
    if (dailyOperations.length === 0) {
      return NextResponse.json(
        { error: 'No approved daily operations found for this month. Cannot export.' },
        { status: 400 }
      );
    }

    // Build daily data array for the entire month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyDataMap = new Map(
      dailyOperations.map(op => [
        op.businessDate.getDate(),
        op,
      ])
    );

    const dailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const operation = dailyDataMap.get(day);
      const target = dailyTargets.find(t => t.businessDate.getDate() === day);

      dailyData.push({
        businessDate: new Date(year, month - 1, day),
        revenueTarget: target ? Number(target.revenueTarget) : null,
        actualRevenue: operation?.calculationResult
          ? Number(operation.calculationResult.totalRevenue)
          : null,
        gop: operation?.calculationResult
          ? Number(operation.calculationResult.gop)
          : null,
        gopRate: operation?.calculationResult
          ? Number(operation.calculationResult.gopRate)
          : null,
        managementFeeTarget: target ? Number(target.gopTarget) : null, // TODO: Need proper mgmt fee target
        managementFeeActual: null, // TODO: Calculate from actual revenue * rate
      });
    }

    // Get management fee rate
    const managementFee = await prisma.managementFee.findFirst({
      where: {
        hotelId,
        yearMonth,
      },
    });

    const managementFeeRate = managementFee
      ? Number(managementFee.managementFeeRate)
      : hotel.physicalRoomCount > 0 ? 0.035 : 0.035; // Default 3.5%

    // Generate Excel
    const excelBuffer = await createExcelExport({
      hotel: {
        hotelId: hotel.id,
        hotelName: hotel.name,
        managementFeeRate,
      },
      year,
      month,
      dailyData,
      monthlyData: {
        revenueTarget: monthlyTarget ? Number(monthlyTarget.revenueTarget) : null,
        costTarget: monthlyTarget ? Number(monthlyTarget.costTarget) : null,
        gopTarget: monthlyTarget ? Number(monthlyTarget.gopTarget) : null,
        managementFeeTarget: monthlyTarget ? Number(monthlyTarget.gopTarget) * managementFeeRate : null, // TODO: Need proper field
        managementFeeRate,
      },
    });

    // Create filename
    const filename = `运营部日核算表-${year}年${String(month).padStart(2, '0')}月-${hotel.name}.xlsx`;

    // Return Excel file
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
