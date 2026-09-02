# 运营部日核算表 Excel Export Mapping

## Excel 模板信息

- **文件**: `data/source/运营部日核算表-2026年8月.xlsx`
- **Sheet**: `8月日核算表`
- **范围**: `A1:EF64`

## Sheet 结构

### Row 1 (行索引 0): 日期行
| 列 | 内容 | 说明 |
|---|---|---|
| A | 拆解 | 标题 |
| F, J, N, ... | 星期五, 星期六, 星期日, ... | 每周日期标签 |

### Row 2 (行索引 1): 列标题行
| 列 | 标题 | 数据类型 |
|---|---|---|
| A | 门店 | string |
| B | 科目 | string |
| C | 业绩预定 | number (月目标) |
| D | 费率 | number (费率) |
| E | 管理费预定 | number (月管理费目标) |
| F | 1日业绩预定 | number |
| G | 1日达成 | number |
| H | 1日管理费预定 | number |
| I | 1日完成 | number |
| J | 2日业绩预定 | number |
| K | 2日达成 | number |
| L | 2日管理费预定 | number |
| M | 2日完成 | number |
| ... | (以此类推，每周四列) | |
| DV | 31日业绩预定 | number |
| DW | 31日达成 | number |
| DX | 31日管理费预定 | number |
| DY | 31日完成 | number |
| DZ | 业绩预定合计 | number |
| EA | 达成合计 | number |
| EB | 管理费预定合计 | number |
| EC | 完成合计 | number |

### Rows 3-16 (行索引 2-15): 酒店数据行
每行代表一个酒店，数据为"业绩"(Revenue)科目。

### Rows 17-29 (行索引 16-28): 汇总行
| 行 | 科目 | 说明 |
|---|---|---|
| 17 | 收入合计 | 收入总计 |
| 18 | 差旅费 | NEED_CONFIRMATION |
| 19 | 招待费 | NEED_CONFIRMATION |
| 20 | 会议费 | NEED_CONFIRMATION |
| 21 | 保险公积金 | NEED_CONFIRMATION |
| 22 | 节日福利 | NEED_CONFIRMATION |
| 23 | 店长待岗费 | NEED_CONFIRMATION |
| 24 | 费用合计： | NEED_CONFIRMATION |
| 25 | 附加价值 | NEED_CONFIRMATION (GOP) |
| 26 | GOP率 | NEED_CONFIRMATION |
| 27 | 总人员合计 | NEED_CONFIRMATION |
| 28 | 总时间合计 | NEED_CONFIRMATION |
| 29 | 单位时间附加价值（元/小时） | NEED_CONFIRMATION |

## 系统字段 → Excel 映射

### 酒店数据行 (Rows 3-16)

#### 静态列 (每酒店填一次)
| Excel 列 | Excel 标题 | 系统字段 | 数据来源 | 说明 |
|---|---|---|---|---|
| A | 门店 | `hotel.name` | `Hotel` 表 | 酒店名称 |
| B | 科目 | 固定值 "业绩" | - | 固定填 "业绩" |
| C | 业绩预定 | `monthlyTarget.revenueTarget` | `MonthlyTarget` 表 | 月度收入目标 (C = SUM(F,J,...)) |
| D | 费率 | `hotel.managementFeeRate` | `ManagementFee` 表或 Hotel 表 | 管理费费率 NEED_CONFIRMATION |
| E | 管理费预定 | `monthlyTarget.managementFeeTarget` | `ManagementFee` 表 | 月度管理费目标 NEED_CONFIRMATION |

#### 每日数据列 (Day N, N=1-31)
每组 4 列: X日业绩预定(X日达成), X日管理费预定(X日完成)

| Excel 列 | Excel 标题 | 系统字段 | 数据来源 | 说明 |
|---|---|---|---|---|
| F (Day 1) | 1日业绩预定 | `dailyTarget.revenueTarget` | `DailyTarget` 表 | Day 1 收入目标 |
| G (Day 1) | 1日达成 | `dailyOperation.calculationResult.totalRevenue` | `CalculationResult` 表 | Day 1 实际收入 |
| H (Day 1) | 1日管理费预定 | `dailyTarget.managementFeeTarget` | `DailyTarget` 表 | Day 1 管理费目标 NEED_CONFIRMATION |
| I (Day 1) | 1日完成 | `dailyTarget.revenueTarget * D` | 计算 | Day 1 管理费达成 NEED_CONFIRMATION |

#### 合计列
| Excel 列 | Excel 标题 | 系统字段 | 数据来源 | 说明 |
|---|---|---|---|---|
| DZ | 业绩预定合计 | SUM(每日业绩预定) | 计算 | 月度收入目标合计 |
| EA | 达成合计 | `calculationResult.totalRevenue` SUM | `CalculationResult` 表 | 月度实际收入合计 |
| EB | 管理费预定合计 | SUM(每日管理费预定) | 计算 | NEED_CONFIRMATION |
| EC | 完成合计 | `EA / DZ` | 计算 | 月度完成率 |

### 汇总数据行 (Rows 17-29)

**NEED_CONFIRMATION**: 这些行的业务含义和数据来源需要与业务方确认。

| Excel 行 | 科目 | 系统字段 | 数据来源 | 备注 |
|---|---|---|---|---|
| 17 | 收入合计 | SUM(所有酒店 `calculationResult.totalRevenue`) | `CalculationResult` 表 | 所有酒店收入总计 |
| 18 | 差旅费 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 19 | 招待费 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 20 | 会议费 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 21 | 保险公积金 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 22 | 节日福利 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 23 | 店长待岗费 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 24 | 费用合计： | ? | ? | **NEED_CONFIRMATION** |
| 25 | 附加价值 | SUM(所有酒店 `calculationResult.gop`) | `CalculationResult` 表 | GOP 合计 |
| 26 | GOP率 | `附加价值 / 收入合计` | 计算 | |
| 27 | 总人员合计 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 28 | 总时间合计 | ? | ? | **NEED_CONFIRMATION** - 系统无此字段 |
| 29 | 单位时间附加价值（元/小时） | `附加价值 / 总时间合计` | 计算 | **NEED_CONFIRMATION** |

## 数据类型映射

| Excel 类型 | 系统类型 | 转换说明 |
|---|---|---|
| number | Decimal | 使用 `.toNumber()` 转换 |
| string | String | 直接写入 |
| percentage | Decimal | 存储为小数 (0.035 = 3.5%) |

## 日期映射

Excel 中每组 4 列对应一个日期:
- Day N 业绩预定: `X日 + 0` 列
- Day N 达成: `X日 + 1` 列
- Day N 管理费预定: `X日 + 2` 列
- Day N 完成: `X日 + 3` 列

列号计算 (0-indexed):
- Day 1: 列 5-8 (F-I)
- Day 2: 列 9-12 (J-M)
- Day N: 列 `(N-1)*4 + 5` 到 `(N-1)*4 + 8`

## 导出前提条件

1. `DailyOperation.status` 必须是 `APPROVED`
2. 酒店必须属于当前区域总监管辖

## 权限控制

- `REGIONAL_DIRECTOR`: 可以导出自己区域的 Excel
- `ADMIN`: 可以导出所有 Excel

## 待确认事项 (NEED_CONFIRMATION)

1. **Rows 18-24 费用项**: 这些费用科目（差旅费、招待费等）在系统中没有对应字段。是否需要新增字段？
2. **管理费费率 (D列)**: `hotel.managementFeeRate` 来源是 `ManagementFee` 表还是 `Hotel` 表？
3. **管理费目标 (E列, H列等)**: `managementFeeTarget` 如何计算？是 `revenueTarget * rate` 吗？
4. **"1日完成" (I列等)**: 这是管理费的实际值还是某种完成指标？
5. **Rows 27-29 人员和时间**: 这些数据来源是什么？
6. **费用合计 (Row 24)**: 包括哪些费用项？
7. **附加价值 (Row 25)**: 是否直接等于 GOP？是否扣除管理费？
