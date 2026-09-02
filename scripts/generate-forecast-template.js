/**
 * 生成 Forecast Excel 导入模板
 *
 * 使用方法:
 *   node scripts/generate-forecast-template.js
 *
 * 输出:
 *   public/templates/forecast-import-template.xlsx
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '慧友酒店经营核算平台';
  workbook.created = new Date();

  // 创建工作表
  const worksheet = workbook.addWorksheet('业绩预定导入模板', {
    properties: {
      tabColor: { argb: 'FF2563EB' },
    },
  });

  // 设置列
  worksheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '业绩预定', key: 'revenue', width: 15 },
  ];

  // 添加表头样式
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' },
  };
  worksheet.getRow(1).alignment = { horizontal: 'center' };

  // 添加示例数据（2026年10月）
  const exampleData = [
    { date: '2026/10/01', revenue: 32000 },
    { date: '2026/10/02', revenue: 35000 },
    { date: '2026/10/03', revenue: 28000 },
    { date: '2026/10/04', revenue: 25000 },
    { date: '2026/10/05', revenue: 22000 },
    { date: '2026/10/06', revenue: 38000 },
    { date: '2026/10/07', revenue: 36000 },
    { date: '2026/10/08', revenue: 31000 },
    { date: '2026/10/09', revenue: 33000 },
    { date: '2026/10/10', revenue: 29000 },
    { date: '2026/10/11', revenue: 26000 },
    { date: '2026/10/12', revenue: 24000 },
    { date: '2026/10/13', revenue: 37000 },
    { date: '2026/10/14', revenue: 35000 },
    { date: '2026/10/15', revenue: 32000 },
    { date: '2026/10/16', revenue: 34000 },
    { date: '2026/10/17', revenue: 30000 },
    { date: '2026/10/18', revenue: 27000 },
    { date: '2026/10/19', revenue: 23000 },
    { date: '2026/10/20', revenue: 39000 },
    { date: '2026/10/21', revenue: 37000 },
    { date: '2026/10/22', revenue: 33000 },
    { date: '2026/10/23', revenue: 35000 },
    { date: '2026/10/24', revenue: 31000 },
    { date: '2026/10/25', revenue: 28000 },
    { date: '2026/10/26', revenue: 25000 },
    { date: '2026/10/27', revenue: 40000 },
    { date: '2026/10/28', revenue: 38000 },
    { date: '2026/10/29', revenue: 34000 },
    { date: '2026/10/30', revenue: 36000 },
    { date: '2026/10/31', revenue: 32000 },
  ];

  // 添加数据行
  exampleData.forEach((row) => {
    worksheet.addRow(row);
  });

  // 添加合计行
  const sumRow = worksheet.addRow({
    date: '合计',
    revenue: exampleData.reduce((sum, row) => sum + row.revenue, 0),
  });
  sumRow.font = { bold: true };
  sumRow.getCell('revenue').numFmt = '#,##0';

  // 添加说明
  const infoRow = worksheet.addRow([]);
  const infoRow2 = worksheet.addRow([]);
  const infoRow3 = worksheet.addRow([]);
  const infoRow4 = worksheet.addRow([]);

  worksheet.mergeCells(`A${infoRow.number}:B${infoRow.number}`);
  worksheet.getCell(`A${infoRow.number}`).value = '说明:';
  worksheet.getCell(`A${infoRow.number}`).font = { bold: true };

  worksheet.mergeCells(`A${infoRow2.number}:B${infoRow2.number}`);
  worksheet.getCell(`A${infoRow2.number}`).value = '1. 日期格式: YYYY/MM/DD 或 YYYY-MM-DD';

  worksheet.mergeCells(`A${infoRow3.number}:B${infoRow3.number}`);
  worksheet.getCell(`A${infoRow3.number}`).value = '2. 业绩预定: 每日业绩预定金额';

  worksheet.mergeCells(`A${infoRow4.number}:B${infoRow4.number}`);
  worksheet.getCell(`A${infoRow4.number}`).value = '3. 每日合计必须等于月度预定总额';

  // 设置金额列格式
  worksheet.getColumn('revenue').numFmt = '#,##0';

  // 确保输出目录存在
  const outputDir = path.join(__dirname, '..', 'public', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 保存文件
  const outputPath = path.join(outputDir, 'forecast-import-template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`模板已生成: ${outputPath}`);
}

generateTemplate().catch(console.error);
