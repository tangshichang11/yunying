# Cost Category Mapping

## 概述

本文档定义 Excel Sheet 到成本类别的映射关系。

**重要**: 不把 Excel Sheet 直接设计成数据库表。通过可配置的 CostCategoryMapping 实现映射。

---

## 设计原则

1. **配置化**: 通过 CostCategoryMapping 表配置映射关系
2. **灵活性**: 支持不同酒店不同映射规则
3. **可追溯**: 每个成本项可追溯到源 Excel Sheet

---

## Excel Sheet 到成本类别映射

### 来自慧友 Excel 分析的 Sheet 清单

**录入类 (17个)**:
| Sheet 名称 | Excel 来源 | 成本类别 | 映射状态 |
|-------------|------------|----------|----------|
| 前台好评提成录入 | 前台好评提成 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 前台二维码提成录入 | 二维码服务 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 前台工资录入 | 前厅工资 | LABOR | ⚠️ NEED_CONFIRMATION |
| 前台增值物品出入库录入 | 前台物品 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 会员卡提成录入 | 会员卡推广 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 商品录入 | 小商品 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 客房耗材出入库录入 | 客房耗材 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 客房提成录入 | 客房清洁 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 洗涤费录入 | 布草洗涤 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 客房工资录入 | 客房工资 | LABOR | ⚠️ NEED_CONFIRMATION |
| 餐厅成本录入 | 餐厅原料 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 用餐人数录入 | 用餐人数 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 餐厅工资录入 | 餐厅工资 | LABOR | ⚠️ NEED_CONFIRMATION |
| 平台推广费录入 | 推广费 | FIXED | ⚠️ NEED_CONFIRMATION |
| 能耗录入 | 水电气 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 固定费用录入 | 租金等 | FIXED | ⚠️ NEED_CONFIRMATION |
| 管理层工资录入 | 管理工资 | LABOR | ⚠️ NEED_CONFIRMATION |

**⚠️ 注意**: 以上映射是初步推断，**必须向慧友确认每个 Sheet 属于哪个成本类别**。

---

## 成本类别定义

### CostCategory

```typescript
enum CostCategory {
  VARIABLE = 'VARIABLE',     // 变动成本
  LABOR = 'LABOR',           // 人工成本
  COMMISSION = 'COMMISSION',  // 提成成本
  FIXED = 'FIXED',          // 固定成本
}
```

### CostSubCategory (待确认)

```typescript
enum CostSubCategory {
  // 变动成本
  ROOM_SUPPLIES = 'ROOM_SUPPLIES',           // 客房耗材
  FRONT_DESK_ITEMS = 'FRONT_DESK_ITEMS',     // 前台增值物品
  MERCHANDISE = 'MERCHANDISE',               // 小商品
  LAUNDRY = 'LAUNDRY',                      // 洗涤费
  RESTAURANT = 'RESTAURANT',                 // 餐厅成本
  UTILITY = 'UTILITY',                      // 能耗

  // 人工成本
  FRONT_DESK_WAGES = 'FRONT_DESK_WAGES',     // 前台工资
  HOUSEKEEPING_WAGES = 'HOUSEKEEPING_WAGES', // 客房工资
  RESTAURANT_WAGES = 'RESTAURANT_WAGES',    // 餐厅工资
  MANAGEMENT_WAGES = 'MANAGEMENT_WAGES',     // 管理工资

  // 提成成本
  REVIEW_COMMISSION = 'REVIEW_COMMISSION',     // 前台好评提成
  QR_COMMISSION = 'QR_COMMISSION',           // 前台二维码提成
  MEMBER_CARD_COMMISSION = 'MEMBER_CARD_COMMISSION', // 会员卡提成
  HOUSEKEEPING_COMMISSION = 'HOUSEKEEPING_COMMISSION', // 客房提成

  // 固定成本
  RENT = 'RENT',                            // 租金
  PLATFORM_PROMOTION = 'PLATFORM_PROMOTION', // 平台推广费
}
```

---

## CostCategoryMapping 配置表

### 数据结构

```typescript
interface CostCategoryMapping {
  id: string;
  hotelId?: string;      // 可为空表示默认映射

  // Excel 来源
  sourceSheet: string;   // '客房耗材出入库录入'
  sourceField: string;   // '出库金额'

  // 映射到
  costCategory: CostCategory;
  costSubCategory: CostSubCategory;

  // 分摊方式
  allocationMethod: AllocationMethod;

  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

### 示例配置

```json
{
  "id": "map-001",
  "hotelId": "hotel-longkou",
  "sourceSheet": "客房耗材出入库录入",
  "sourceField": "出库金额",
  "costCategory": "VARIABLE",
  "costSubCategory": "ROOM_SUPPLIES",
  "allocationMethod": "DAILY_USAGE",
  "status": "ACTIVE"
}
```

---

## AllocationMethod 分摊方式

### 定义

```typescript
enum AllocationMethod {
  ROOM_COUNT = 'ROOM_COUNT',     // 按房间数分摊
  DAILY_USAGE = 'DAILY_USAGE',   // 按日消耗分摊
  MANUAL = 'MANUAL',             // 手动分摊
}
```

### 使用场景

| 分摊方式 | 适用场景 | 说明 |
|----------|----------|------|
| ROOM_COUNT | 人工成本分摊 | 按房间数分摊到每日 |
| DAILY_USAGE | 变动成本 | 按实际消耗分摊 |
| MANUAL | 固定成本 | 手动输入分配值 |

### ROOM_COUNT 补充说明

如果使用 ROOM_COUNT，需要指定房间数类型：

```typescript
enum RoomCountType {
  TOTAL = 'TOTAL',           // 总房间数 (133)
  AVAILABLE = 'AVAILABLE',   // 可售房数
  OCCUPIED = 'OCCUPIED',   // 入住间数
}
```

**⚠️ 注意**: 具体使用哪个房间数 **NEED_CONFIRMATION**

---

## 待确认映射清单

| # | Excel Sheet | 推断的成本类别 | 确认状态 |
|---|------------|---------------|----------|
| 1 | 前台好评提成录入 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 2 | 前台二维码提成录入 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 3 | 前台工资录入 | LABOR | ⚠️ NEED_CONFIRMATION |
| 4 | 前台增值物品出入库录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 5 | 会员卡提成录入 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 6 | 商品录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 7 | 客房耗材出入库录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 8 | 客房提成录入 | COMMISSION | ⚠️ NEED_CONFIRMATION |
| 9 | 洗涤费录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 10 | 客房工资录入 | LABOR | ⚠️ NEED_CONFIRMATION |
| 11 | 餐厅成本录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 12 | 用餐人数录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 13 | 餐厅工资录入 | LABOR | ⚠️ NEED_CONFIRMATION |
| 14 | 平台推广费录入 | FIXED | ⚠️ NEED_CONFIRMATION |
| 15 | 能耗录入 | VARIABLE | ⚠️ NEED_CONFIRMATION |
| 16 | 固定费用录入 | FIXED | ⚠️ NEED_CONFIRMATION |
| 17 | 管理层工资录入 | LABOR | ⚠️ NEED_CONFIRMATION |

---

## 映射配置示例 (龙口悦致)

**⚠️ 以下为初步推断，必须向慧友确认**

```typescript
const defaultMappings: CostCategoryMapping[] = [
  // 提成类 - COMMISSION
  {
    sourceSheet: '前台好评提成录入',
    costCategory: 'COMMISSION',
    costSubCategory: 'REVIEW_COMMISSION',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '前台二维码提成录入',
    costCategory: 'COMMISSION',
    costSubCategory: 'QR_COMMISSION',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '会员卡提成录入',
    costCategory: 'COMMISSION',
    costSubCategory: 'MEMBER_CARD_COMMISSION',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '客房提成录入',
    costCategory: 'COMMISSION',
    costSubCategory: 'HOUSEKEEPING_COMMISSION',
    allocationMethod: 'DAILY_USAGE',
  },

  // 变动成本类 - VARIABLE
  {
    sourceSheet: '客房耗材出入库录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'ROOM_SUPPLIES',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '前台增值物品出入库录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'FRONT_DESK_ITEMS',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '商品录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'MERCHANDISE',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '洗涤费录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'LAUNDRY',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '餐厅成本录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'RESTAURANT',
    allocationMethod: 'DAILY_USAGE',
  },
  {
    sourceSheet: '能耗录入',
    costCategory: 'VARIABLE',
    costSubCategory: 'UTILITY',
    allocationMethod: 'DAILY_USAGE',
  },

  // 人工成本类 - LABOR
  {
    sourceSheet: '前台工资录入',
    costCategory: 'LABOR',
    costSubCategory: 'FRONT_DESK_WAGES',
    allocationMethod: 'ROOM_COUNT',
  },
  {
    sourceSheet: '客房工资录入',
    costCategory: 'LABOR',
    costSubCategory: 'HOUSEKEEPING_WAGES',
    allocationMethod: 'ROOM_COUNT',
  },
  {
    sourceSheet: '餐厅工资录入',
    costCategory: 'LABOR',
    costSubCategory: 'RESTAURANT_WAGES',
    allocationMethod: 'ROOM_COUNT',
  },
  {
    sourceSheet: '管理层工资录入',
    costCategory: 'LABOR',
    costSubCategory: 'MANAGEMENT_WAGES',
    allocationMethod: 'ROOM_COUNT',
  },

  // 固定成本类 - FIXED
  {
    sourceSheet: '平台推广费录入',
    costCategory: 'FIXED',
    costSubCategory: 'PLATFORM_PROMOTION',
    allocationMethod: 'MANUAL',
  },
  {
    sourceSheet: '固定费用录入',
    costCategory: 'FIXED',
    costSubCategory: 'RENT',
    allocationMethod: 'MANUAL',
  },
];
```

---

## 下一步行动

1. **向慧友确认** 每个 Excel Sheet 属于哪个成本类别
2. **向慧友确认** 每个成本类别的分摊方式
3. **向慧友确认** "按房间数分摊"使用的是哪个房间数
4. 更新 CostCategoryMapping 配置表

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
*状态: ⚠️ 映射关系需向慧友确认*
