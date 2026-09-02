# Excel Export Validation

## Overview

This document describes the validation approach for the Operation Department Daily Accounting Excel Export feature.

## Validation Scope

### 1. Template Structure Validation (Golden Test)

The template file `data/source/运营部日核算表-2026年8月.xlsx` is validated to ensure:

- **Sheet Name**: `8月日核算表` (August Daily Accounting)
- **Sheet Range**: `A1:EF64`
- **Row 1**: Date/weekday labels
- **Row 2**: Column headers
- **Rows 3-16**: Hotel data rows (14 hotels)
- **Rows 17-29**: Summary/subject rows

### 2. Column Header Validation

| Column | Header | Validation |
|--------|--------|------------|
| A | 门店 | Hotel name |
| B | 科目 | Category (e.g., "业绩") |
| C | 业绩预定 | Monthly revenue target |
| D | 费率 | Management fee rate |
| E | 管理费预定 | Monthly management fee target |
| F-I | Day 1 | 1日业绩预定, 1日达成, 1日管理费预定, 1日完成 |
| J-M | Day 2 | 2日业绩预定, 2日达成, 2日管理费预定, 2日完成 |
| ... | ... | (Days 3-30 follow same pattern) |
| DV-DY | Day 31 | 31日业绩预定, 31日达成, 31日管理费预定, 31日完成 |
| DZ | 业绩预定合计 | Total revenue target |
| EA | 达成合计 | Total actual revenue |
| EB | 管理费预定合计 | Total management fee target |
| EC | 完成合计 | Total completion |

### 3. Data Type Validation

All numeric values in the Excel should be stored as `t: 'n'` (number type) to ensure proper calculation and formatting.

### 4. Column Index Mapping

| Day | Revenue Target | Actual | Mgmt Fee Target | Completion |
|-----|----------------|--------|-----------------|------------|
| 1 | F (5) | G (6) | H (7) | I (8) |
| 2 | J (9) | K (10) | L (11) | M (12) |
| ... | ... | ... | ... | ... |
| 31 | DV (125) | DW (126) | DX (127) | DY (128) |

Formula: `columnIndex = 5 + (day - 1) * 4 + fieldOffset`

### 5. Hotel Row Mapping

| Row | Hotel Name |
|-----|------------|
| 3 | 菲伦酒店（烟台大学万象汇店） |
| 4 | FunGee X 欢致酒店（青岛正阳中路万象汇店） |
| 5 | 欢洋酒店（青岛城阳青春足球场店） |
| 6 | 美宿欢洋酒店（青岛城阳高铁站店） |
| 7 | 菲伦酒店（烟台牟平养马岛新城大街店） |
| 8 | 悦致酒店（青岛正阳中路万象汇店） |
| 9 | 欢漫酒店（日照大学城万平口海滨风景区店） |
| 10 | 欢漫酒店（青岛城阳区政府水悦城店） |
| 11 | 欢漫酒店（青岛栈桥中山路地铁站店） |
| 12 | 悦致酒店（龙口龙湖天街店） |
| 13 | 希顾酒店（青岛正阳中路万象汇店） |
| 14 | 欢漫酒店（即墨古城店） |
| 15 | 欢致酒店（威海幸福门威高广场店） |
| 16 | 欢漫酒店（威海国际海水浴场火炬八街店） |

### 6. Summary Row Mapping

| Row | Subject | Data Source |
|-----|---------|-------------|
| 17 | 收入合计 | SUM of all hotel totalRevenue |
| 18 | 差旅费 | NEED_CONFIRMATION |
| 19 | 招待费 | NEED_CONFIRMATION |
| 20 | 会议费 | NEED_CONFIRMATION |
| 21 | 保险公积金 | NEED_CONFIRMATION |
| 22 | 节日福利 | NEED_CONFIRMATION |
| 23 | 店长待岗费 | NEED_CONFIRMATION |
| 24 | 费用合计： | NEED_CONFIRMATION |
| 25 | 附加价值 | SUM of all hotel GOP |
| 26 | GOP率 | 附加价值 / 收入合计 |
| 27 | 总人员合计 | NEED_CONFIRMATION |
| 28 | 总时间合计 | NEED_CONFIRMATION |
| 29 | 单位时间附加价值（元/小时） | 附加价值 / 总时间合计 |

## Validation Tests

### Unit Tests (Golden Test)

```bash
npx vitest run src/tests/excel/export.test.ts
```

Tests include:
- Template existence and sheet validation
- Column header validation
- Hotel row existence
- Summary row validation
- Data type validation
- Column index mapping validation
- XLSX utility function validation

## Known Issues / NEED_CONFIRMATION

1. **Rows 18-24 (费用项)**: The expense categories (差旅费, 招待费, etc.) have no corresponding fields in the current database schema. Business confirmation needed.

2. **Rows 27-29 (人员和时间)**: Personnel and time tracking data not available in current schema.

3. **管理费计算**: The management fee calculation logic needs confirmation:
   - Is it `revenueTarget * rate` or `gopTarget * rate`?
   - What is the "完成" (completion) field for management fee?

4. **附加价值 (Row 25)**: Whether this equals GOP or requires additional calculations needs confirmation.

## Export Prerequisites

1. `DailyOperation.status` must be `APPROVED`
2. User must have `REGIONAL_DIRECTOR` or `ADMIN` role
3. Hotel must exist in the Excel template

## Export Limitations

1. Only one hotel can be exported per request
2. Export is for a single month
3. Management fee data may be incomplete (see NEED_CONFIRMATION)
