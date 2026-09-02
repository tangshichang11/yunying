# Domain Entities

## Entity List

| Entity | Description | Excel Source |
|--------|-------------|--------------|
| Organization | 组织顶层 | - |
| Region | 区域 | - |
| Hotel | 酒店门店 | - |
| User | 用户 | - |
| Role | 角色 | - |
| DailyOperation | 日经营记录 | 汇总表 |
| Revenue | 收入 | 收入及其他项目 |
| VariableCost | 变动成本 | 多个录入Sheet |
| LaborCost | 人工成本 | 各工资录入 |
| CommissionCost | 提成成本 | 各提成录入 |
| FixedCost | 固定成本 | 固定费用/平台推广 |
| Energy | 能耗 | 能耗录入 |
| InventoryItem | 库存物品 | 商品/客房耗材等 |
| InventoryTransaction | 出入库记录 | 各出入库录入 |
| MonthlyTarget | 月度目标 | - |
| WeeklyTarget | 周目标 | - |
| DailyTarget | 日目标 | - |
| CalculationResult | 计算结果 | 阿米巴核算表 |
| Anomaly | 异常记录 | - |
| AuditLog | 审计日志 | - |
| CostCategoryMapping | 成本分类映射 | 配置 |
| AllocationMethod | 分摊方式配置 | 配置 |

---

## 1. Organization

```typescript
interface Organization {
  id: string;              // cuid
  name: string;            // "慧友集团"
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 第一版只有一个组织
- 预留多组织扩展

---

## 2. Region

```typescript
interface Region {
  id: string;              // cuid
  organizationId: string;  // FK → Organization
  name: string;            // "青岛区域" / "龙口区域"
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 目前所有门店属于一个区域
- 必须保留以支持未来多区域

---

## 3. Hotel

```typescript
interface Hotel {
  id: string;              // cuid
  regionId: string;        // FK → Region
  code: string;            // 酒店编码，唯一
  name: string;            // "龙口悦致酒店"
  actualRooms: number;     // 实际间数（固定值，133）
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- code 全局唯一
- actualRooms 是固定值，龙口悦致 = 133
- 预留多酒店扩展

---

## 4. User

```typescript
interface User {
  id: string;              // cuid
  email: string;           // 登录邮箱，唯一
  password: string;        // 加密密码
  name: string;            // 显示名称
  role: 'MANAGER' | 'DIRECTOR' | 'ADMIN';
  hotelId?: string;        // FK → Hotel（店长必填）
  regionId?: string;       // FK → Region（总监必填）
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 店长必须关联酒店
- 总监必须关联区域

---

## 5. Role

```typescript
interface Role {
  id: string;              // cuid
  code: string;            // 'MANAGER' | 'DIRECTOR' | 'ADMIN'
  name: string;            // '店长' | '区域总监' | '系统管理员'
  permissions: string[];   // 权限列表
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. DailyOperation

**核心实体 - 日经营记录的聚合根**

```typescript
interface DailyOperation {
  id: string;              // cuid
  hotelId: string;         // FK → Hotel
  businessDate: Date;      // 营业日期（不是 createdAt）

  // 状态机
  status: 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';

  // 提交信息
  submittedAt?: Date;
  submittedBy?: string;    // FK → User
  reviewedAt?: Date;
  reviewedBy?: string;     // FK → User
  rejectionReason?: string;

  // 原始输入引用
  revenueId?: string;      // FK → Revenue
  variableCostId?: string;
  laborCostId?: string;
  commissionCostId?: string;
  fixedCostId?: string;
  energyId?: string;

  // 计算结果引用
  calculationResultId?: string;

  // 元数据
  submissionDeadline: Date; // businessDate + 1 day 18:00
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- businessDate 是营业日，不是数据创建时间
- submissionDeadline = businessDate + 1 day 18:00
- 状态流转: DRAFT → SUBMITTED → APPROVED/REJECTED
- 所有状态变化必须记录 AuditLog

---

## 7. Revenue

**收入数据 - 来自 Excel 收入及其他项目**

```typescript
interface Revenue {
  id: string;              // cuid
  dailyOperationId: string; // FK → DailyOperation

  // 收入项目（人工录入）
  roomRevenue: Decimal;     // 房费收入
  minibarRevenue: Decimal;  // 迷你吧收入
  foodRevenue: Decimal;     // 餐费收入
  otherRevenue: Decimal;    // 其他业务收入

  // 计算得出
  totalRevenue: Decimal;    // room + minibar + food + other

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 来自慧友确认: 全部人工录入
- totalRevenue = roomRevenue + minibarRevenue + foodRevenue + otherRevenue

---

## 8. VariableCost

**变动成本 - 来自多个 Excel 录入 Sheet**

```typescript
interface VariableCost {
  id: string;              // cuid
  dailyOperationId: string;

  // 各变动成本项
  roomSuppliesCost: Decimal;      // 客房耗材
  frontDeskItemsCost: Decimal;    // 前台增值物品
  merchandiseCost: Decimal;       // 小商品
  laundryCost: Decimal;          // 洗涤费
  restaurantCost: Decimal;       // 餐厅成本
  otherVariableCost: Decimal;    // 其他变动成本

  // 计算得出
  totalVariableCost: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 各成本项通过 CostCategoryMapping 配置映射到 Excel Sheet
- totalVariableCost = SUM(各成本项)

---

## 9. LaborCost

**人工成本 - 来自各工资录入 Sheet**

```typescript
interface LaborCost {
  id: string;              // cuid
  dailyOperationId: string;

  // 各部门日分摊工资
  frontDeskWages: Decimal;      // 前台
  housekeepingWages: Decimal;   // 客房
  restaurantWages: Decimal;     // 餐厅
  managementWages: Decimal;     // 管理

  // 计算得出
  totalLaborCost: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 日分摊计算: 月工资 / 出勤天数
- 分摊基准（房间数定义）NEED_CONFIRMATION
- totalLaborCost = SUM(各部门工资)

---

## 10. CommissionCost

**提成成本 - 来自各提成录入 Sheet**

```typescript
interface CommissionCost {
  id: string;              // cuid
  dailyOperationId: string;

  // 各提成项
  reviewCommission: Decimal;      // 前台好评提成
  qrCommission: Decimal;          // 前台二维码提成
  memberCardCommission: Decimal;  // 会员卡提成
  housekeepingCommission: Decimal; // 客房提成

  // 计算得出
  totalCommissionCost: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- reviewCommission = reviewCount × unitPrice
- qrCommission = serviceCount × unitPrice
- 客房提成 = roomCount × rate × roomTypeMultiplier

---

## 11. FixedCost

**固定成本 - 来自固定费用录入、平台推广费**

```typescript
interface FixedCost {
  id: string;              // cuid
  dailyOperationId: string;

  rent: Decimal;                  // 租金
  platformPromotionFee: Decimal;  // 平台推广费
  otherFixedCost: Decimal;        // 其他固定成本

  // 计算得出
  totalFixedCost: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 12. Energy

**能耗 - 来自能耗录入 Sheet**

```typescript
interface Energy {
  id: string;              // cuid
  dailyOperationId: string;

  // 电费（消耗量 × 单价）
  electricityConsumption: Decimal;  // 电消耗量
  electricityUnitPrice: Decimal;    // 电单价（店长维护）
  electricityCost: Decimal;         // 电费（计算值）

  // 水费
  waterConsumption: Decimal;
  waterUnitPrice: Decimal;
  waterCost: Decimal;

  // 天然气费
  gasConsumption: Decimal;
  gasUnitPrice: Decimal;
  gasCost: Decimal;

  // 计算得出
  totalUtilityCost: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 来自慧友确认: 必须区分 consumption / unitPrice / cost
- electricityCost = electricityConsumption × electricityUnitPrice
- waterCost = waterConsumption × waterUnitPrice

---

## 13. InventoryItem

**库存物品 - 来自各出入库录入 Sheet**

```typescript
interface InventoryItem {
  id: string;              // cuid
  hotelId: string;         // FK → Hotel
  code: string;            // 物品编码
  name: string;            // 物品名称
  category: string;        // 分类: ROOM_SUPPLIES / FRONT_DESK_ITEMS / MERCHANDISE / RESTAURANT
  unit: string;            // 单位
  unitPrice: Decimal;      // 单价（店长维护）
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 14. InventoryTransaction

**出入库记录 - 来自各出入库录入 Sheet**

```typescript
interface InventoryTransaction {
  id: string;              // cuid
  hotelId: string;         // FK → Hotel
  inventoryItemId: string; // FK → InventoryItem
  dailyOperationId: string;

  date: Date;              // 交易日期
  type: 'IN' | 'OUT';      // 入库/出库
  quantity: Decimal;       // 数量
  unitPrice: Decimal;      // 单价（交易时）
  amount: Decimal;         // 金额（计算值）

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- amount = quantity × unitPrice
- OUT 类型影响成本计算

---

## 15. MonthlyTarget

**月度目标 - 人工维护**

```typescript
interface MonthlyTarget {
  id: string;              // cuid
  hotelId: string;         // FK → Hotel
  yearMonth: string;       // YYYY-MM
  revenueTarget: Decimal;  // 收入目标
  costTarget: Decimal;     // 成本目标
  gopTarget: Decimal;      // GOP目标

  // 用于分配到周/日
  referenceValue: Decimal; // 参考值（用于计算分配比例）

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 16. WeeklyTarget

**周目标 - 人工维护**

```typescript
interface WeeklyTarget {
  id: string;              // cuid
  hotelId: string;
  yearMonth: string;       // YYYY-MM
  weekNumber: number;      // 1-5
  revenueTarget: Decimal;
  costTarget: Decimal;
  gopTarget: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 17. DailyTarget

**日目标 - 人工维护**

```typescript
interface DailyTarget {
  id: string;              // cuid
  hotelId: string;
  businessDate: Date;
  revenueTarget: Decimal;
  costTarget: Decimal;
  gopTarget: Decimal;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 18. CalculationResult

**计算结果 - 核心输出**

```typescript
interface CalculationResult {
  id: string;              // cuid
  dailyOperationId: string;

  // 收入
  totalRevenue: Decimal;

  // 成本分解
  totalVariableCost: Decimal;
  totalLaborCost: Decimal;
  totalCommissionCost: Decimal;
  totalFixedCost: Decimal;
  totalCost: Decimal;

  // GOP（核心指标）
  gop: Decimal;            // = totalRevenue - totalCost
  gopRate: Decimal;        // = gop / totalRevenue

  // 运营指标
  occupancyRate: Decimal;  // 入住间数 / 可售房数
  avgRoomRate: Decimal;    // 房费收入 / 入住间数
  revpar: Decimal;         // 房费收入 / 可售房数

  // 异常标记
  isRevenueAnomaly: boolean;
  isCostAnomaly: boolean;

  // 计算元数据
  calculationVersion: string; // 计算公式版本
  calculatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- GOP = totalRevenue - totalCost（来自慧友确认）
- GOP 不包含总部管理费（独立指标）
- 异常检测: isRevenueAnomaly = actual < expected × 0.95

---

## 19. Anomaly

**异常记录**

```typescript
interface Anomaly {
  id: string;              // cuid
  dailyOperationId: string;
  calculationResultId: string;

  type: 'REVENUE' | 'COST';
  severity: 'WARNING' | 'ERROR';

  // 详情
  expectedValue: Decimal;
  actualValue: Decimal;
  deviation: Decimal;      // 差异
  deviationRate: Decimal;  // 差异率

  // 异常描述
  description: string;

  // 处理状态
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  resolvedAt?: Date;
  resolvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 20. AuditLog

**审计日志 - 记录所有状态变化**

```typescript
interface AuditLog {
  id: string;              // cuid
  entityType: string;      // 'DailyOperation' | 'Revenue' | ...
  entityId: string;        // 实体ID

  action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT';

  // 变更详情
  oldValue?: JSON;
  newValue?: JSON;

  // 操作人
  operatorId: string;      // FK → User
  ipAddress?: string;

  timestamp: Date;
}
```

**业务规则**:
- 所有状态变化必须记录 AuditLog
- 包括 CREATE, UPDATE, SUBMIT, APPROVE, REJECT

---

## 21. CostCategoryMapping

**成本分类映射 - 可配置**

```typescript
interface CostCategoryMapping {
  id: string;
  hotelId: string;         // FK → Hotel（可为空表示默认）

  // Excel Sheet 名称 → 成本类别
  sourceSheet: string;     // '客房耗材出入库录入'
  sourceField: string;     // '出库金额'

  // 映射到成本类别
  costCategory: 'VARIABLE' | 'LABOR' | 'COMMISSION' | 'FIXED';
  costSubCategory: string; // 'ROOM_SUPPLIES' | 'FRONT_DESK_ITEMS' ...

  // 分摊方式
  allocationMethod: 'ROOM_COUNT' | 'DAILY_USAGE' | 'MANUAL';

  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 不把 Excel Sheet 直接设计成数据库表
- 通过配置映射实现灵活性
- 支持不同酒店不同映射规则

---

## 22. AllocationMethod

**分摊方式配置**

```typescript
interface AllocationMethod {
  id: string;
  hotelId: string;

  // 成本项
  costCategory: string;
  costSubCategory: string;

  // 分摊方式
  method: 'ROOM_COUNT' | 'DAILY_USAGE' | 'MANUAL';

  // 如果是 ROOM_COUNT，需要指定使用哪个房间数
  roomCountType?: 'TOTAL' | 'AVAILABLE' | 'OCCUPIED';

  // 如果是 MANUAL，需要指定固定分摊值
  manualValue?: Decimal;

  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 分摊基准（房间数定义）NEED_CONFIRMATION
- 不得自行猜测

---

## 23. ManagementFee

**总部管理费 - 独立于 GOP**

```typescript
interface ManagementFee {
  id: string;
  hotelId: string;
  yearMonth: string;       // YYYY-MM

  monthlyTarget: Decimal;  // 月度业绩目标
  managementFeeRate: Decimal; // 管理费费率
  monthlyManagementFee: Decimal; // = monthlyTarget × rate

  // 日分摊（如果需要）
  dailyManagementFee?: Decimal;

  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}
```

**业务规则**:
- 来自慧友确认: 与 GOP 无关
- 不允许计入 GOP
- 必须作为独立指标

---

## Entity Relationships

```
Organization (1)
    └── Region (n)
            └── Hotel (n)
                    │
                    ├── User (n)
                    ├── DailyOperation (n) ─── 1:1 ─── Revenue
                    │                                ─── 1:1 ─── VariableCost
                    │                                ─── 1:1 ─── LaborCost
                    │                                ─── 1:1 ─── CommissionCost
                    │                                ─── 1:1 ─── FixedCost
                    │                                ─── 1:1 ─── Energy
                    │                                ─── 1:1 ─── CalculationResult
                    │                                ─── 1:n ─── Anomaly
                    │                                ─── 1:n ─── AuditLog
                    │
                    ├── InventoryItem (n)
                    │       └── InventoryTransaction (n)
                    │
                    ├── MonthlyTarget (n)
                    ├── WeeklyTarget (n)
                    ├── DailyTarget (n)
                    │
                    └── ManagementFee (n)
```

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
