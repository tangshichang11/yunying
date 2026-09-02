import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { formatForecastMonth } from '@/lib/forecast-v2/types';
import { ForecastMonthStatus } from '@prisma/client';
import { validateExcelImport } from '@/lib/forecast-v2/validation';
import { ExcelImportRow, ExcelImportPreview } from '@/lib/forecast-v2/types';
import { getDayOfWeek, isWeekend } from '@/lib/forecast-v2/validation';

/**
 * POST /api/forecast-v2/import
 * Excel 导入（预览）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;
    const year = parseInt(formData.get('year') as string);
    const month = parseInt(formData.get('month') as string);
    const monthlyForecast = parseFloat(formData.get('monthlyForecast') as string);

    if (!file) {
      return NextResponse.json(
        { error: '请上传 Excel 文件' },
        { status: 400 }
      );
    }

    if (!hotelId || !year || !month) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 读取 Excel 文件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await file.arrayBuffer();
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json(
        { error: 'Excel 文件中没有工作表' },
        { status: 400 }
      );
    }

    // 解析数据
    const rows: ExcelImportRow[] = [];
    let monthlyForecastFromExcel: number | null = null;

    // 查找日期和金额列（假设第一行是表头）
    let dateColIdx = -1;
    let revenueColIdx = -1;

    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const headerValue = String(cell.value || '').toLowerCase();
      if (headerValue.includes('日期') || headerValue.includes('date')) {
        dateColIdx = colNumber;
      }
      if (
        headerValue.includes('业绩') ||
        headerValue.includes('收入') ||
        headerValue.includes('revenue') ||
        headerValue.includes('forecast')
      ) {
        revenueColIdx = colNumber;
      }
    });

    // 如果没找到表头，假设 A 列是日期，B 列是金额
    if (dateColIdx === -1) dateColIdx = 1;
    if (revenueColIdx === -1) revenueColIdx = 2;

    // 解析每一行数据（跳过表头）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const dateCell = row.getCell(dateColIdx);
      const revenueCell = row.getCell(revenueColIdx);

      let dateStr: string | null = null;
      let revenue = 0;

      // 解析日期
      if (dateCell.value) {
        if (dateCell.value instanceof Date) {
          dateStr = dateCell.value.toISOString().split('T')[0];
        } else if (typeof dateCell.value === 'string') {
          // 检查是否是"合计"行
          const dateVal = String(dateCell.value).trim();
          if (dateVal === '合计' || dateVal === 'sum' || dateVal === '总计') {
            // 这是合计行，提取金额作为月度预定
            if (revenueCell.value) {
              if (typeof revenueCell.value === 'number') {
                monthlyForecastFromExcel = revenueCell.value;
              } else if (typeof revenueCell.value === 'string') {
                monthlyForecastFromExcel = parseFloat(revenueCell.value.replace(/,/g, '')) || null;
              }
            }
            return; // 不作为数据行处理
          }
          // 尝试解析 YYYY/MM/DD 或 YYYY-MM-DD
          const normalized = dateVal.replace(/\//g, '-');
          if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            dateStr = normalized;
          }
        } else if (typeof dateCell.value === 'number') {
          // Excel 日期序列号
          const date = new Date((dateCell.value - 25569) * 86400 * 1000);
          dateStr = date.toISOString().split('T')[0];
        }
      }

      // 解析金额
      if (revenueCell.value) {
        if (typeof revenueCell.value === 'number') {
          revenue = revenueCell.value;
        } else if (typeof revenueCell.value === 'string') {
          revenue = parseFloat(revenueCell.value.replace(/,/g, '')) || 0;
        }
      }

      if (dateStr) {
        rows.push({
          date: dateStr,
          revenue,
        });
      }
    });

    // 使用 Excel 中的合计值作为月度预定（优先于用户输入）
    const effectiveMonthlyForecast = monthlyForecastFromExcel || monthlyForecast;

    // 校验数据
    const validationResult = validateExcelImport(rows, effectiveMonthlyForecast);

    // 构建预览响应
    const preview: ExcelImportPreview = {
      fileName: file.name,
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      monthlyForecast: effectiveMonthlyForecast || validationResult.dailySum,
      dailySum: validationResult.dailySum,
      difference: validationResult.difference,
      rows,
      validationErrors: validationResult.errors,
    };

    return NextResponse.json({
      success: true,
      data: preview,
      isValid: validationResult.isValid,
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    return NextResponse.json(
      { error: '导入失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/forecast-v2/import
 * 确认导入（正式写入数据库）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hotelId,
      year,
      month,
      monthlyForecast,
      rows,
      overwrite = false,
    } = body;

    if (!hotelId || !year || !month || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.forecastMonth.findUnique({
      where: {
        hotelId_year_month: {
          hotelId,
          year,
          month,
        },
      },
    });

    if (existing) {
      if (!overwrite) {
        return NextResponse.json(
          {
            error: '该月份已存在 Forecast 数据',
            existingId: existing.id,
            requiresOverwrite: true,
          },
          { status: 400 }
        );
      }

      // 删除旧数据
      await prisma.forecastDay.deleteMany({
        where: { forecastMonthId: existing.id },
      });
      await prisma.forecastMonth.delete({
        where: { id: existing.id },
      });
    }

    // 创建新的月度 Forecast
    const forecastMonth = await prisma.forecastMonth.create({
      data: {
        hotelId,
        year,
        month,
        monthlyRevenueForecast: monthlyForecast,
        status: ForecastMonthStatus.DRAFT,
      },
    });

    // 创建每日数据
    await Promise.all(
      rows.map((row: ExcelImportRow) => {
        const [y, m, d] = row.date.split('-').map(Number);
        const businessDate = new Date(y, m - 1, d);
        const dayOfWeek = getDayOfWeek(businessDate);

        return prisma.forecastDay.create({
          data: {
            forecastMonthId: forecastMonth.id,
            businessDate,
            dayOfWeek,
            isWeekend: isWeekend(dayOfWeek),
            isHoliday: false,
            systemSuggestedAmount: row.revenue,
            finalAmount: row.revenue,
            isManuallyAdjusted: false,
            isLocked: false,
          },
        });
      })
    );

    // 获取完整数据
    const fullMonth = await prisma.forecastMonth.findUnique({
      where: { id: forecastMonth.id },
      include: {
        dailyForecasts: {
          orderBy: { businessDate: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: formatForecastMonth(fullMonth as any),
      message: overwrite ? '已覆盖导入' : '导入成功',
    });
  } catch (error) {
    console.error('Error confirming import:', error);
    return NextResponse.json(
      { error: '导入失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
