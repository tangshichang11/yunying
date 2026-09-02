import * as XLSX from 'xlsx';

/**
 * Excel Export Configuration
 * Maps system data to Excel template structure
 */

// Day column offsets in the Excel template (0-indexed column number)
const DAY_COL_OFFSETS = {
  REVENUE_TARGET: 0,    // X日业绩预定
  ACTUAL_REVENUE: 1,     // X日达成
  MGMT_FEE_TARGET: 2,    // X日管理费预定
  COMPLETION: 3,         // X日完成
};

interface HotelData {
  hotelId: string;
  hotelName: string;
  managementFeeRate: number; // e.g., 0.035 = 3.5%
}

interface DailyData {
  businessDate: Date;
  revenueTarget: number | null;
  actualRevenue: number | null;
  gop: number | null;
  gopRate: number | null;
  managementFeeTarget: number | null;
  managementFeeActual: number | null;
}

interface MonthlyData {
  revenueTarget: number | null;
  costTarget: number | null;
  gopTarget: number | null;
  managementFeeTarget: number | null;
  managementFeeRate: number;
}

interface ExcelExportData {
  hotel: HotelData;
  month: number; // 1-12
  year: number;
  dailyData: DailyData[];
  monthlyData: MonthlyData;
}

/**
 * Get column letter from 0-indexed column number
 */
function getColumnLetter(colIndex: number): string {
  return XLSX.utils.encode_col(colIndex);
}

/**
 * Get column index for a specific day and field
 * @param day Day number (1-31)
 * @param fieldOffset 0=target, 1=actual, 2=mgmt fee target, 3=completion
 */
function getDayColumnIndex(day: number, fieldOffset: number): number {
  return 5 + (day - 1) * 4 + fieldOffset;
}

/**
 * Create Excel export for a hotel's monthly data
 */
export async function createExcelExport(data: ExcelExportData): Promise<Buffer> {
  // Read template
  const templatePath = 'data/source/运营部日核算表-2026年8月.xlsx';
  const workbook = XLSX.readFile(templatePath);
  const sheet = workbook.Sheets['8月日核算表'];

  if (!sheet) {
    throw new Error('Sheet "8月日核算表" not found in template');
  }

  // Find the hotel row in the template
  const hotelRowIndex = findHotelRow(sheet, data.hotel.hotelName);
  if (hotelRowIndex === -1) {
    throw new Error(`Hotel "${data.hotel.hotelName}" not found in template`);
  }

  // Fill in static columns (C, D, E)
  // C: 业绩预定 (monthly revenue target)
  setCellNumber(sheet, 'C', hotelRowIndex, data.monthlyData.revenueTarget);

  // D: 费率 (management fee rate)
  setCellNumber(sheet, 'D', hotelRowIndex, data.monthlyData.managementFeeRate);

  // E: 管理费预定 (monthly management fee target)
  setCellNumber(sheet, 'E', hotelRowIndex, data.monthlyData.managementFeeTarget);

  // Fill in daily data
  const daysInMonth = new Date(data.year, data.month, 0).getDate();

  for (const daily of data.dailyData) {
    const day = daily.businessDate.getDate();
    if (day < 1 || day > daysInMonth) continue;

    const row = hotelRowIndex;

    // F + (day-1)*4: 业绩预定
    setCellNumber(sheet, getColumnLetter(getDayColumnIndex(day, DAY_COL_OFFSETS.REVENUE_TARGET)), row, daily.revenueTarget);

    // G + (day-1)*4: 达成
    setCellNumber(sheet, getColumnLetter(getDayColumnIndex(day, DAY_COL_OFFSETS.ACTUAL_REVENUE)), row, daily.actualRevenue);

    // H + (day-1)*4: 管理费预定
    setCellNumber(sheet, getColumnLetter(getDayColumnIndex(day, DAY_COL_OFFSETS.MGMT_FEE_TARGET)), row, daily.managementFeeTarget);

    // I + (day-1)*4: 完成
    // 完成 = 实际管理费 = actualRevenue * rate (if available)
    const completionValue = daily.managementFeeActual ?? (daily.actualRevenue != null ? daily.actualRevenue * data.monthlyData.managementFeeRate : null);
    setCellNumber(sheet, getColumnLetter(getDayColumnIndex(day, DAY_COL_OFFSETS.COMPLETION)), row, completionValue);
  }

  // Calculate totals (DZ, EA, EB, EC)
  const totalRevenueTarget = data.dailyData.reduce((sum, d) => sum + (d.revenueTarget ?? 0), 0);
  const totalActualRevenue = data.dailyData.reduce((sum, d) => sum + (d.actualRevenue ?? 0), 0);
  const totalMgmtFeeTarget = data.dailyData.reduce((sum, d) => sum + (d.managementFeeTarget ?? 0), 0);
  const totalCompletion = data.monthlyData.managementFeeRate > 0 ? totalActualRevenue * data.monthlyData.managementFeeRate : 0;

  // DZ (index 125): 业绩预定合计
  setCellNumber(sheet, 'DZ', hotelRowIndex, totalRevenueTarget);

  // EA (index 126): 达成合计
  setCellNumber(sheet, 'EA', hotelRowIndex, totalActualRevenue);

  // EB (index 127): 管理费预定合计
  setCellNumber(sheet, 'EB', hotelRowIndex, totalMgmtFeeTarget);

  // EC (index 128): 完成合计
  setCellNumber(sheet, 'EC', hotelRowIndex, totalCompletion);

  // Update row 1 to show the correct month
  // Row 1 has weekday labels, but we might need to adjust the month display

  // Write to buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Find the row index for a hotel in the template
 * Returns -1 if not found
 */
function findHotelRow(sheet: XLSX.WorkSheet, hotelName: string): number {
  // Hotel names are in column A, starting from row 3 (index 2)
  // Rows 3-16 contain hotel data (indices 2-15)
  for (let r = 2; r <= 15; r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })]; // Column A
    if (cell && cell.v === hotelName) {
      return r;
    }
  }
  return -1;
}

/**
 * Set a cell value as number
 */
function setCellNumber(sheet: XLSX.WorkSheet, col: string, row: number, value: number | null): void {
  if (value === null || value === undefined) return;
  const addr = `${col}${row + 1}`; // Convert to 1-indexed
  sheet[addr] = { v: value, t: 'n' };
}

/**
 * Format date as "YYYY年MM月" for the sheet title
 */
export function formatMonthTitle(year: number, month: number): string {
  return `${year}年${month}月`;
}
