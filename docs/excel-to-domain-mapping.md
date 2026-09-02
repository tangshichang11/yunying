# Excel 到 Domain 映射

## 概述

本文档定义 Excel Sheet 与 Domain Entity 的映射关系。

**设计原则**:
- 不把 Excel Sheet 直接设计成数据库表
- 通过 CostCategoryMapping 实现可配置的映射
- 支持不同酒店不同映射规则

---

## 一、映射总览

| Excel Sheet | Domain Entity | CostCategory | AllocationMethod | 确认状态 |
|-------------|---------------|--------------|------------------|----------|
| 收入及其他项目 | Revenue | - | - | ✅ |
| 汇总表 | CalculationResult | - | - | ✅ |
| 阿米巴核算表（日） | CalculationResult | - | - | ✅ |
| 能耗录入 | Energy | VARIABLE | DAILY_USAGE | ✅ |
| 固定费用录入 | FixedCost | FIXED | MANUAL | ✅ |
| 平台推广费录入 | FixedCost | FIXED | MANUAL | ✅ |
| 客房耗材出入库录入 | VariableCost | VARIABLE | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 前台增值物品出入库录入 | VariableCost | VARIABLE | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 商品录入 | VariableCost | VARIABLE | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 洗涤费录入 | VariableCost | VARIABLE | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 餐厅成本录入 | VariableCost | VARIABLE | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 前台工资录入 | LaborCost | LABOR | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 客房工资录入 | LaborCost | LABOR | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 餐厅工资录入 | LaborCost | LABOR | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 管理层工资录入 | LaborCost | LABOR | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 前台好评提成录入 | CommissionCost | COMMISSION | DAILY_USAGE | ✅ |
| 前台二维码提成录入 | CommissionCost | COMMISSION | DAILY_USAGE | ✅ |
| 会员卡提成录入 | CommissionCost | COMMISSION | DAILY_USAGE | ✅ |
| 客房提成录入 | CommissionCost | COMMISSION | DAILY_USAGE | ✅ |
| 用餐人数录入 | - | - | - | ⚠️ NEED_CONFIRMATION |
| 运营部日核算表 | ManagementFee | - | - | ✅ |

---

## 二、详细映射

### 2.1 收入相关

#### 收入及其他项目

| Excel字段 | Domain Entity | Domain字段 | 数据类型 | 说明 |
|-----------|---------------|------------|----------|------|
| 入住间数 | Revenue | occupied_rooms | Integer | ⚠️ 需确认来源（PMS/手工） |
| 平均房价 | CalculationResult | avg_room_rate | Decimal | 计算得出 |
| RevPar | CalculationResult | revpar | Decimal | 计算得出 |
| 房费收入 | Revenue | room_revenue | Decimal | |
| 迷你吧收入 | Revenue | minibar_revenue | Decimal | |
| 餐费收入 | Revenue | food_revenue | Decimal | |
| 其他业务收入 | Revenue | other_revenue | Decimal | |

#### 汇总表

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 实际间数 | Hotel | actual_rooms | 固定值133 |
| 收入合计 | Revenue | total_revenue | 计算得出 |
| 客房耗材 | VariableCost | room_supplies_cost | |
| 前台增值物品 | VariableCost | front_desk_items_cost | |
| 小商品成本 | VariableCost | merchandise_cost | |
| 餐厅 | VariableCost | restaurant_cost | |
| 变动成本合计 | VariableCost | total_variable_cost | |

#### 阿米巴核算表（日）

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 预定业绩 | DailyTarget | revenue_target | |
| 实绩业绩 | CalculationResult | total_revenue | |
| 差异金额 | - | - | 计算得出 |
| 差异占比 | - | - | 计算得出 |
| 出租间数 | Revenue | occupied_rooms | |
| 收入合计 | CalculationResult | total_revenue | |
| 各成本项 | CalculationResult | total_cost分解 | |

---

### 2.2 能耗相关

#### 能耗录入

| Excel字段 | Domain Entity | Domain字段 | 数据类型 | 说明 |
|-----------|---------------|------------|----------|------|
| 电费-用量 | Energy | electricity_consumption | Decimal | 日消耗量 |
| 电费-单价 | Energy | electricity_unit_price | Decimal | 店长维护 |
| 电费-金额 | Energy | electricity_cost | Decimal | 计算得出 |
| 水费-用量 | Energy | water_consumption | Decimal | 日消耗量 |
| 水费-单价 | Energy | water_unit_price | Decimal | 店长维护 |
| 水费-金额 | Energy | water_cost | Decimal | 计算得出 |
| 天然气-用量 | Energy | gas_consumption | Decimal | ⚠️ NEED_CONFIRMATION |
| 天然气-单价 | Energy | gas_unit_price | Decimal | ⚠️ NEED_CONFIRMATION |
| 天然气-金额 | Energy | gas_cost | Decimal | 计算得出 |

**计算规则**:
```
electricityCost = electricityConsumption × electricityUnitPrice
waterCost = waterConsumption × waterUnitPrice
gasCost = gasConsumption × gasUnitPrice
totalUtilityCost = electricityCost + waterCost + gasCost
```

---

### 2.3 变动成本相关

#### 客房耗材出入库录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 出库金额 | VariableCost | room_supplies_cost | 日成本汇总 |
| 物品明细 | InventoryItem | - | 库存物品追踪 |
| 出入库记录 | InventoryTransaction | - | 流转记录 |

#### 前台增值物品出入库录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 出库金额 | VariableCost | front_desk_items_cost | 日成本汇总 |

#### 商品录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 出库金额 | VariableCost | merchandise_cost | 日成本汇总 |

#### 洗涤费录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 出库金额 | VariableCost | laundry_cost | 日成本汇总 |

#### 餐厅成本录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 出库金额 | VariableCost | restaurant_cost | 日成本汇总 |

**⚠️ 待确认**: 餐厅成本是否应归类为变动成本？

---

### 2.4 人工成本相关

#### 前台工资录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 总工资 | LaborCost | front_desk_wages | 月工资（需日分摊） |
| 出勤天数 | - | - | 分摊计算用 |
| 日工作时长 | - | - | 工时统计 |

#### 客房工资录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 总工资 | LaborCost | housekeeping_wages | 月工资（需日分摊） |

#### 餐厅工资录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 总工资 | LaborCost | restaurant_wages | 月工资（需日分摊） |

#### 管理层工资录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 总工资 | LaborCost | management_wages | 月工资（需日分摊） |

**日分摊公式**:
```
日分摊值 = 月工资总额 / 当月天数 × (当日入住间数 / 基准房间数)
```

**⚠️ 分摊基准待确认**: TOTAL / AVAILABLE / OCCUPIED

---

### 2.5 提成成本相关

#### 前台好评提成录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 好评数 | CommissionCost | review_commission | 各平台汇总 |
| 单价 | - | - | 各平台不同 |

**计算**: `reviewCommission = SUM(各平台好评数 × 各平台单价)`

#### 前台二维码提成录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 服务次数 | CommissionCost | qr_commission | 各类型汇总 |
| 单价 | - | - | 各服务类型不同 |

**计算**: `qrCommission = SUM(服务次数 × 单价)`

#### 会员卡提成录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 卡张数 | CommissionCost | member_card_commission | 各卡类型汇总 |
| 单价 | - | - | 各卡类型不同 |

**计算**: `memberCardCommission = SUM(卡张数 × 单价)`

#### 客房提成录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 做房数量 | CommissionCost | housekeeping_commission | 按房型汇总 |
| 提成标准 | - | - | 基础标准 |
| 房型系数 | - | - | 标准房=1, 双床=1.2等 |

**计算**: `housekeepingCommission = SUM(做房数 × 提成标准 × 房型系数)`

---

### 2.6 固定成本相关

#### 固定费用录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 租金 | FixedCost | rent | 日分摊 |
| 物业费 | FixedCost | other_fixed_cost | 日分摊 |
| 保险 | FixedCost | other_fixed_cost | 日分摊 |
| 网费 | FixedCost | other_fixed_cost | 日分摊 |
| 通讯费 | FixedCost | other_fixed_cost | 日分摊 |
| 社保公积金 | FixedCost | other_fixed_cost | 日分摊 |

**日分摊公式**: `日分摊值 = 月总额 / 当月天数`

#### 平台推广费录入

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 美团推广费 | FixedCost | platform_promotion_fee | 日分摊 |
| 携程推广费 | FixedCost | platform_promotion_fee | 日分摊 |
| 抖音推广费 | FixedCost | platform_promotion_fee | 日分摊 |
| 去哪推广费 | FixedCost | platform_promotion_fee | 日分摊 |
| 同城推广费 | FixedCost | platform_promotion_fee | 日分摊 |
| 飞猪推广费 | FixedCost | platform_promotion_fee | 日分摊 |

---

### 2.7 目标与管理费相关

#### 运营部日核算表

| Excel字段 | Domain Entity | Domain字段 | 说明 |
|-----------|---------------|------------|------|
| 业绩预定 | MonthlyTarget | revenue_target | 月度目标 |
| 费率 | ManagementFee | management_fee_rate | 合同约定 |
| 管理费预定 | ManagementFee | monthly_management_fee | 计算得出 |
| 日业绩预定 | DailyTarget | revenue_target | 分配到日 |
| 日达成 | CalculationResult | total_revenue | 实际业绩 |
| 日管理费预定 | ManagementFee | daily_management_fee | ⚠️ 待确认分配规则 |

**管理费计算**:
```
monthlyManagementFee = monthlyTarget × managementFeeRate
```

**⚠️ 日管理费分配规则待确认**

---

## 三、映射配置示例

### 龙口悦致酒店默认配置

```json
{
  "hotelId": "longkou-yuezhi",
  "mappings": [
    {
      "sourceSheet": "客房耗材出入库录入",
      "sourceField": "出库金额",
      "domainEntity": "VariableCost",
      "domainField": "roomSuppliesCost",
      "costCategory": "VARIABLE",
      "costSubCategory": "ROOM_SUPPLIES",
      "allocationMethod": "DAILY_USAGE",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "前台增值物品出入库录入",
      "sourceField": "出库金额",
      "domainEntity": "VariableCost",
      "domainField": "frontDeskItemsCost",
      "costCategory": "VARIABLE",
      "costSubCategory": "FRONT_DESK_ITEMS",
      "allocationMethod": "DAILY_USAGE",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "商品录入",
      "sourceField": "出库金额",
      "domainEntity": "VariableCost",
      "domainField": "merchandiseCost",
      "costCategory": "VARIABLE",
      "costSubCategory": "MERCHANDISE",
      "allocationMethod": "DAILY_USAGE",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "洗涤费录入",
      "sourceField": "出库金额",
      "domainEntity": "VariableCost",
      "domainField": "laundryCost",
      "costCategory": "VARIABLE",
      "costSubCategory": "LAUNDRY",
      "allocationMethod": "DAILY_USAGE",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "餐厅成本录入",
      "sourceField": "出库金额",
      "domainEntity": "VariableCost",
      "domainField": "restaurantCost",
      "costCategory": "VARIABLE",
      "costSubCategory": "RESTAURANT",
      "allocationMethod": "DAILY_USAGE",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "前台工资录入",
      "sourceField": "总工资",
      "domainEntity": "LaborCost",
      "domainField": "frontDeskWages",
      "costCategory": "LABOR",
      "costSubCategory": "FRONT_DESK_WAGES",
      "allocationMethod": "ROOM_COUNT",
      "roomCountType": "OCCUPIED",
      "status": "NEED_CONFIRMATION"
    },
    {
      "sourceSheet": "客房工资录入",
      "sourceField": "总工资",
      "domainEntity": "LaborCost",
      "domainField": "housekeepingWages",
      "costCategory": "LABOR",
      "costSubCategory": "HOUSEKEEPING_WAGES",
      "allocationMethod": "ROOM_COUNT",
      "roomCountType": "OCCUPIED",
      "status": "NEED_CONFIRMATION"
    },
    {
      "sourceSheet": "餐厅工资录入",
      "sourceField": "总工资",
      "domainEntity": "LaborCost",
      "domainField": "restaurantWages",
      "costCategory": "LABOR",
      "costSubCategory": "RESTAURANT_WAGES",
      "allocationMethod": "ROOM_COUNT",
      "roomCountType": "OCCUPIED",
      "status": "NEED_CONFIRMATION"
    },
    {
      "sourceSheet": "管理层工资录入",
      "sourceField": "总工资",
      "domainEntity": "LaborCost",
      "domainField": "managementWages",
      "costCategory": "LABOR",
      "costSubCategory": "MANAGEMENT_WAGES",
      "allocationMethod": "ROOM_COUNT",
      "roomCountType": "OCCUPIED",
      "status": "NEED_CONFIRMATION"
    },
    {
      "sourceSheet": "固定费用录入",
      "sourceField": "租金",
      "domainEntity": "FixedCost",
      "domainField": "rent",
      "costCategory": "FIXED",
      "costSubCategory": "RENT",
      "allocationMethod": "MANUAL",
      "status": "ACTIVE"
    },
    {
      "sourceSheet": "平台推广费录入",
      "sourceField": "合计",
      "domainEntity": "FixedCost",
      "domainField": "platformPromotionFee",
      "costCategory": "FIXED",
      "costSubCategory": "PLATFORM_PROMOTION",
      "allocationMethod": "MANUAL",
      "status": "ACTIVE"
    }
  ]
}
```

---

## 四、Excel Sheet 字段位置

### 收入及其他项目

| 列 | 字段 |
|----|------|
| A | 项目 |
| B | 实绩合计 |
| C | 预定 |
| D | 达成率 |
| E+ | 日数据 (1号, 2号...) |

### 汇总表

| 行 | 字段 |
|----|------|
| 2 | 用餐人数 |
| 3 | 实际间数 |
| 4 | 入住间数 |
| 5 | 平均房价 |
| 6 | RevPar |
| 7 | 房费收入 |
| 8 | 迷你吧收入 |
| 9 | 餐费收入 |
| 10 | 其他业务收入 |
| 11 | 收入合计 |
| 12 | 客房耗材 |
| 13 | 前台增值物品 |
| 14 | 小商品成本 |
| 15 | 餐厅 |

### 能耗录入

| 行 | 字段 |
|----|------|
| 5 | 电费 (用量/单价/金额) |
| 6 | 水费 (用量/单价/金额) |
| 7 | 天然气 (用量/单价/金额) |

### 固定费用录入

| 行 | 字段 |
|----|------|
| 5 | 租金 |
| 6 | 物业费 |
| 7 | 保险 |
| 8 | 网费 |
| 9 | 通讯费 |
| 10 | 社保公积金 |

### 平台推广费录入

| 行 | 字段 |
|----|------|
| 4 | 美团推广费 |
| 5 | 携程推广费 |
| 6 | 抖音推广费 |
| 7 | 去哪推广费 |
| 8 | 同城推广费 |
| 9 | 飞猪推广费 |

---

## 五、待确认事项

| # | Excel Sheet | 字段 | 问题 | 优先级 |
|---|------------|------|------|--------|
| 1 | 客房耗材出入库录入 | 出库金额 | 成本分类确认 | P1 |
| 2 | 餐厅成本录入 | 出库金额 | 变动成本/人工成本? | P2 |
| 3 | 用餐人数录入 | - | 是否计入收入? | P2 |
| 4 | 前台工资录入 | 总工资 | 分摊基准确认 | P1 |
| 5 | 能耗录入 | 天然气单价 | 单价值是多少? | P2 |

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
