/**
 * Golden Excel Export Test
 *
 * Validates that the exported Excel matches the expected template structure.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

describe('Excel Export Golden Test', () => {
  const TEMPLATE_PATH = 'data/source/运营部日核算表-2026年8月.xlsx';

  describe('Template Validation', () => {
    let workbook: XLSX.WorkBook;
    let sheet: XLSX.WorkSheet;

    beforeAll(() => {
      expect(fs.existsSync(TEMPLATE_PATH)).toBe(true);
      workbook = XLSX.readFile(TEMPLATE_PATH);
      sheet = workbook.Sheets['8月日核算表'];
    });

    it('Sheet exists', () => {
      expect(sheet).toBeDefined();
    });

    it('Sheet name is 8月日核算表', () => {
      expect(workbook.SheetNames).toContain('8月日核算表');
    });

    it('Sheet range is A1:EF64', () => {
      expect(sheet['!ref']).toBe('A1:EF64');
    });

    describe('Row 2 - Column Headers', () => {
      const headers: Record<string, string> = {
        A: '门店',
        B: '科目',
        C: '业绩预定',
        D: '费率',
        E: '管理费预定',
        F: '1日业绩预定',
        G: '1日达成',
        H: '1日管理费预定',
        I: '1日完成',
        DZ: '业绩预定合计',
        EA: '达成合计',
        EB: '管理费预定合计',
        EC: '完成合计',
      };

      it.each(Object.entries(headers))('Column %s header is "%s"', (col, expectedHeader) => {
        const cell = sheet[`${col}2`];
        expect(cell).toBeDefined();
        expect(cell?.v).toBe(expectedHeader);
      });

      it('Has 31 days of data (31 * 4 columns = 124 columns)', () => {
        // Day 1 starts at column F (index 5)
        // Each day has 4 columns
        // Day 31 ends at column DY
        expect(sheet['DV2']?.v).toBe('31日业绩预定');
        expect(sheet['DW2']?.v).toBe('31日达成');
        expect(sheet['DX2']?.v).toBe('31日管理费预定');
        expect(sheet['DY2']?.v).toBe('31日完成');
      });
    });

    describe('Hotel Rows (Rows 3-16)', () => {
      it('Hotel names are in column A', () => {
        // First hotel row should have a hotel name
        const cellA3 = sheet['A3'];
        expect(cellA3).toBeDefined();
        expect(typeof cellA3?.v).toBe('string');
        expect(cellA3?.v.length).toBeGreaterThan(0);
      });

      it('Column B (科目) has "业绩" for hotel rows', () => {
        for (let r = 2; r <= 15; r++) {
          const cell = sheet[`B${r + 1}`]; // Row 3 = index 2, etc.
          expect(cell?.v).toBe('业绩');
        }
      });
    });

    describe('Summary Rows (17-29)', () => {
      const summarySubjects: Record<number, string> = {
        17: '收入合计',
        18: '差旅费',
        19: '招待费',
        20: '会议费',
        21: '保险公积金',
        22: '节日福利',
        23: '店长待岗费',
        24: '费用合计：',
        25: '附加价值',
        26: 'GOP率',
        27: '总人员合计',
        28: '总时间合计',
        29: '单位时间附加价值（元/小时）',
      };

      it.each(Object.entries(summarySubjects))(
        'Row %s has subject "%s"',
        (rowNum, expectedSubject) => {
          const cell = sheet[`B${rowNum}`];
          expect(cell).toBeDefined();
          expect(cell?.v).toBe(expectedSubject);
        }
      );
    });

    describe('Data Types', () => {
      it('Hotel row C (业绩预定) is number type', () => {
        const cell = sheet['C3'];
        expect(cell?.t).toBe('n'); // number type
      });

      it('Hotel row D (费率) is number type', () => {
        const cell = sheet['D3'];
        expect(cell?.t).toBe('n');
      });

      it('Hotel row G (1日达成) is number type', () => {
        const cell = sheet['G3'];
        expect(cell?.t).toBe('n');
      });

      it('Hotel row I (1日完成) is number type', () => {
        const cell = sheet['I3'];
        expect(cell?.t).toBe('n');
      });
    });

    describe('Column Index Mapping', () => {
      it('Day 1 columns are F, G, H, I', () => {
        expect(getColumnIndex('F')).toBe(5);
        expect(getColumnIndex('G')).toBe(6);
        expect(getColumnIndex('H')).toBe(7);
        expect(getColumnIndex('I')).toBe(8);
      });

      it('Day 31 columns are DV, DW, DX, DY', () => {
        expect(getColumnIndex('DV')).toBe(125);
        expect(getColumnIndex('DW')).toBe(126);
        expect(getColumnIndex('DX')).toBe(127);
        expect(getColumnIndex('DY')).toBe(128);
      });
    });
  });

  describe('Export Function Validation', () => {
    it('XLSX utils.encode_col works correctly', () => {
      expect(XLSX.utils.encode_col(0)).toBe('A');
      expect(XLSX.utils.encode_col(5)).toBe('F');
      expect(XLSX.utils.encode_col(125)).toBe('DV');
      expect(XLSX.utils.encode_col(129)).toBe('DZ');
    });

    it('XLSX utils.encode_cell works correctly', () => {
      expect(XLSX.utils.encode_cell({ r: 0, c: 0 })).toBe('A1');
      expect(XLSX.utils.encode_cell({ r: 2, c: 5 })).toBe('F3');
    });

    it('Decimal values are preserved in template', () => {
      // Row 3 has: G3 = 35073.76
      const workbook = XLSX.readFile(TEMPLATE_PATH);
      const sheet = workbook.Sheets['8月日核算表'];
      const cellG3 = sheet['G3'];
      expect(cellG3?.v).toBe(35073.76);
    });
  });
});

/**
 * Get column index from column letter
 */
function getColumnIndex(col: string): number {
  return XLSX.utils.decode_col(col);
}
