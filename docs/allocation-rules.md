# Allocation Rules

## 概述

本文档定义成本分摊规则。

**重要**: 分摊规则必须可配置，不得硬编码。

---

## 分摊方式 (AllocationMethod)

```typescript
enum AllocationMethod {
  ROOM_COUNT = 'ROOM_COUNT',     // 按房间数分摊
  DAILY_USAGE = 'DAILY_USAGE',   // 按日消耗分摊
  MANUAL = 'MANUAL',             // 手动分摊
}
```

---

## 1. ROOM_COUNT (按房间数分摊)

### 适用场景
- 人工成本
- 部分固定成本

### 分摊公式
```
日分摊值 = (月总值 / 当月天数) × (当日房间数 / 基准房间数)
```

### 房间数类型

```typescript
enum RoomCountType {
  TOTAL = 'TOTAL',           // 总房间数 (133)
  AVAILABLE = 'AVAILABLE', // 可售房数
  OCCUPIED = 'OCCUPIED',   // 入住间数
}
```

### ⚠️ 重要: 房间数定义 NEED_CONFIRMATION

**来自慧友确认**:
- 分摊依据目前确认：**按房间数**
- 但是具体"房间数"的定义**未确定**

| 类型 | 值 | 说明 |
|------|-----|------|
| TOTAL | 133 | 龙口悦致固定值 |
| AVAILABLE | 133 | 等于总房间数 |
| OCCUPIED | 每日变化 | 当日实际入住间数 |

**必须向慧友确认**: 具体使用哪个房间数定义

---

## 2. DAILY_USAGE (按日消耗分摊)

### 适用场景
- 变动成本
- 耗材成本
- 能耗成本

### 分摊公式
```
日成本 = 消耗数量 × 单价
```

### 典型应用

| 成本项 | 消耗量 | 单价 | 公式 |
|--------|--------|------|------|
| 电费 | 日用电量 | 店长维护 | electricityCost = electricityConsumption × electricityUnitPrice |
| 水费 | 日用水量 | 店长维护 | waterCost = waterConsumption × waterUnitPrice |
| 客房耗材 | 日消耗量 | 录入单价 | roomSuppliesCost = consumption × unitPrice |

---

## 3. MANUAL (手动分摊)

### 适用场景
- 固定成本
- 租金
- 平台推广费

### 分摊方式
- 店长手动输入日分摊值
- 或按固定规则分配（如平均分配到每日）

---

## 分摊配置表 (AllocationConfig)

```typescript
interface AllocationConfig {
  id: string;
  hotelId: string;

  // 成本项
  costCategory: CostCategory;
  costSubCategory: CostSubCategory;

  // 分摊方式
  allocationMethod: AllocationMethod;

  // ROOM_COUNT 专用
  roomCountType?: RoomCountType;  // NEED_CONFIRMATION

  // MANUAL 专用
  manualValue?: Decimal;           // 固定日分摊值
  manualRatio?: Decimal;          // 或按比例分配

  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 成本项分摊规则 (待确认)

| # | 成本项 | 推断分摊方式 | 确认状态 |
|---|--------|-------------|----------|
| 1 | 前台工资 | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 2 | 客房工资 | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 3 | 餐厅工资 | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 4 | 管理工资 | ROOM_COUNT | ⚠️ NEED_CONFIRMATION |
| 5 | 客房耗材 | DAILY_USAGE | ✅ 推断 |
| 6 | 前台增值物品 | DAILY_USAGE | ✅ 推断 |
| 7 | 小商品 | DAILY_USAGE | ✅ 推断 |
| 8 | 洗涤费 | DAILY_USAGE | ✅ 推断 |
| 9 | 餐厅成本 | DAILY_USAGE | ✅ 推断 |
| 10 | 电费 | DAILY_USAGE | ✅ 确认 |
| 11 | 水费 | DAILY_USAGE | ✅ 确认 |
| 12 | 天然气费 | DAILY_USAGE | ⚠️ NEED_CONFIRMATION |
| 13 | 前台好评提成 | DAILY_USAGE | ✅ 确认 |
| 14 | 前台二维码提成 | DAILY_USAGE | ✅ 确认 |
| 15 | 会员卡提成 | DAILY_USAGE | ✅ 确认 |
| 16 | 客房提成 | DAILY_USAGE | ✅ 确认 |
| 17 | 租金 | MANUAL | ✅ 推断 |
| 18 | 平台推广费 | MANUAL | ✅ 推断 |

---

## 日分摊计算示例

### 示例 1: 前台工资 (假设使用 TOTAL_ROOMS)

**输入**:
- 月工资总额: 45,000 元
- 当月天数: 30 天
- 龙口悦致总房间数: 133
- 当日入住间数: 91

**按房间数分摊 (ROOM_COUNT)**:
```
日分摊值 = 45000 / 30 × 91 / 133
        = 1500 × 0.6842
        = 1026.3 元
```

### 示例 2: 电费 (DAILY_USAGE)

**输入**:
- 日用电量: 100 度
- 电费单价: 0.77 元/度

**按消耗分摊 (DAILY_USAGE)**:
```
日电费 = 100 × 0.77 = 77 元
```

### 示例 3: 租金 (MANUAL)

**输入**:
- 月租金: 193,788 元
- 当月天数: 31 天

**按固定值分摊 (MANUAL)**:
```
日分摊值 = 193788 / 31 = 6,251.23 元
```

---

## 分摊流程

```
1. 成本数据录入
   │
   ▼
2. 获取分摊配置 (AllocationConfig)
   │
   ▼
3. 根据 allocationMethod 执行分摊
   │
   ├── ROOM_COUNT → 查询房间数 → 计算分摊
   │
   ├── DAILY_USAGE → 获取消耗量和单价 → 计算成本
   │
   └── MANUAL → 使用配置的固定值
   │
   ▼
4. 存储分摊结果
```

---

## 关键约束

1. **不得硬编码分摊逻辑**
2. **分摊配置必须可修改**
3. **分摊结果必须可追溯**
4. **房间数定义必须向慧友确认**

---

## 待确认事项

| # | 事项 | 优先级 | 影响 |
|---|------|--------|------|
| 1 | 人工成本分摊的房间数定义 (TOTAL/AVAILABLE/OCCUPIED) | P1 | 人工成本日分摊计算 |
| 2 | 天然气费分摊方式 | P2 | 天然气成本计算 |
| 3 | 平台推广费分摊方式 | P2 | 推广费分配 |

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
*状态: ⚠️ 部分分摊规则需向慧友确认*
