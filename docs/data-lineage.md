# 数据血缘分析 (Data Lineage)

## 概述

本文档描述数据从店长输入到区域汇总的完整流向。

**目标**: 确保每个数据字段可追溯，回答"这个数据从哪里来，到哪里去"。

---

## 一、数据流总图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              店长输入层                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ 收入录入    │  │ 成本录入     │  │ 能耗录入     │  │ 工资录入     │               │
│  │ - 房费收入  │  │ - 耗材出库   │  │ - 电表读数   │  │ - 月工资     │               │
│  │ - 入住间数  │  │ - 商品出入库  │  │ - 水表读数   │  │ - 出勤天数   │               │
│  │ - 迷你吧收入│  │ - 洗涤费     │  │ - 天然气表   │  │ - 日工时     │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                │                │                │                       │
└─────────┼────────────────┼────────────────┼────────────────┼───────────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Domain Data Layer                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ DailyOperation (日经营记录 - 聚合根)                                          │   │
│  │ ├── businessDate, status, submissionDeadline                                 │   │
│  │ ├── Revenue (收入)                                                           │   │
│  │ │   ├── roomRevenue, minibarRevenue, foodRevenue, otherRevenue              │   │
│  │ │   └── totalRevenue                                                        │   │
│  │ ├── VariableCost (变动成本)                                                  │   │
│  │ │   ├── roomSuppliesCost, frontDeskItemsCost, merchandiseCost              │   │
│  │ │   ├── laundryCost, restaurantCost, otherVariableCost                      │   │
│  │ │   └── totalVariableCost                                                  │   │
│  │ ├── LaborCost (人工成本)                                                     │   │
│  │ │   ├── frontDeskWages, housekeepingWages, restaurantWages                 │   │
│  │ │   ├── managementWages                                                     │   │
│  │ │   └── totalLaborCost                                                      │   │
│  │ ├── CommissionCost (提成成本)                                               │   │
│  │ │   ├── reviewCommission, qrCommission, memberCardCommission                │   │
│  │ │   ├── housekeepingCommission                                              │   │
│  │ │   └── totalCommissionCost                                                 │   │
│  │ ├── FixedCost (固定成本)                                                     │   │
│  │ │   ├── rent, platformPromotionFee, otherFixedCost                         │   │
│  │ │   └── totalFixedCost                                                      │   │
│  │ ├── Energy (能耗)                                                            │   │
│  │ │   ├── electricity/water/gas (consumption, unitPrice, cost)                │   │
│  │ │   └── totalUtilityCost                                                    │   │
│  │ └── CalculationResult (计算结果)                                             │   │
│  │     ├── totalRevenue, totalCost, gop, gopRate                              │   │
│  │     ├── occupancyRate, avgRoomRate, revpar                                 │   │
│  │     └── isRevenueAnomaly, isCostAnomaly                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         Calculation Engine                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 收入计算: totalRevenue = room + minibar + food + other                      │   │
│  │ 成本汇总: totalCost = variable + labor + commission + fixed                  │   │
│  │ GOP计算: gop = totalRevenue - totalCost                                      │   │
│  │ GOP率: gopRate = gop / totalRevenue                                          │   │
│  │ 出租率: occupancyRate = occupiedRooms / actualRooms                         │   │
│  │ 平均房价: avgRoomRate = roomRevenue / occupiedRooms                        │   │
│  │ RevPAR: revpar = roomRevenue / actualRooms                                 │   │
│  │ 能耗: electricityCost = consumption × unitPrice                             │   │
│  │ 异常检测: isRevenueAnomaly = actual < expected × 0.95                       │   │
│  │ 异常检测: isCostAnomaly = actual > expected                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Daily Result (日结果)                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 提交前 (DRAFT)                                                              │   │
│  │   - 店长可修改所有录入数据                                                   │   │
│  │   - CalculationResult 实时计算                                             │   │
│  │   - 异常标记实时显示                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
│                                    ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 提交后 (SUBMITTED)                                                          │   │
│  │   - 数据锁定，不可修改                                                      │   │
│  │   - 等待总监审核                                                           │   │
│  │   - AuditLog 记录提交事件                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
│                              ┌─────┴─────┐                                        │
│                              ▼           ▼                                        │
│                        ┌──────────┐  ┌──────────┐                                 │
│                        │ APPROVED │  │ REJECTED │                                 │
│                        │ 数据锁定  │  │ 返回DRAFT │                                 │
│                        └──────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       Regional Result (区域结果)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 运营部日核算表                                                              │   │
│  │ ├── 各门店业绩预定/达成                                                      │   │
│  │ ├── 各门店管理费预定/达成                                                    │   │
│  │ ├── 区域收入合计                                                           │   │
│  │ ├── 区域GOP（附加价值）                                                     │   │
│  │ └── 单位时间附加价值                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         Excel Export (导出)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 运营部汇总表                                                                │   │
│  │ ├── 门店维度的日数据                                                        │   │
│  │ ├── 月度累计数据                                                            │   │
│  │ └── 年度累计数据                                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、数据流详细说明

### 2.1 收入数据流

```
Excel录入                    Domain实体                计算引擎              展示/导出
────────────────────────────────────────────────────────────────────────────────

收入及其他项目 Sheet
    │
    ├── 入住间数 ──────────────► Revenue.occupiedRooms ──────────────────► 汇总表
    │                                                                      ► 运营部
    │
    ├── 平均房价 ───────────────► [计算] avgRoomRate = roomRevenue/occupied
    │                                                                      ► 汇总表
    │                                                                      ► 阿米巴核算表
    │
    ├── RevPar ───────────────► [计算] revpar = roomRevenue/actualRooms
    │                                                                      ► 汇总表
    │                                                                      ► 阿米巴核算表
    │
    ├── 房费收入 ──────────────► Revenue.roomRevenue
    │                              │
    │                              ▼ [计算] totalRevenue +=
    │                         Revenue.totalRevenue
    │                                                                      ► 阿米巴核算表
    │
    ├── 迷你吧收入 ───────────► Revenue.minibarRevenue ──► [汇总] ───────► 汇总表
    │
    ├── 餐费收入 ───────────► Revenue.foodRevenue ──► [汇总] ──────────► 汇总表
    │
    └── 其他业务收入 ────────► Revenue.otherRevenue ──► [汇总] ────────► 汇总表
```

**关键点**:
- 入住间数由店长手工录入（或PMS导入）
- 平均房价、RevPAR由计算引擎实时计算
- 总收入 = 各收入项之和

---

### 2.2 变动成本数据流

```
Excel录入                    Domain实体                计算引擎              GOP
────────────────────────────────────────────────────────────────────────────────

客房耗材出入库录入
    │
    └── 出库金额 ───────────► VariableCost.roomSuppliesCost
                                  │
前台增值物品出入库录入            │
    │                              │
    └── 出库金额 ───────────► VariableCost.frontDeskItemsCost
                                  │
商品录入                          │ [汇总] ──────────────────────────────► totalVariableCost
    │                              │                                         │
    └── 出库金额 ───────────► VariableCost.merchandiseCost                   │──► GOP计算
                                  │                                         │
洗涤费录入                        │                                         │
    │                              │                                         │
    └── 出库金额 ───────────► VariableCost.laundryCost                      │
                                  │                                         │
餐厅成本录入                      │                                         │
    │                              │                                         │
    └── 出库金额 ───────────► VariableCost.restaurantCost                   │
                                  │                                         │
[其他变动成本]                    │                                         │
    │                              │                                         │
    └── ─────────────────► VariableCost.otherVariableCost ──────────────────┘
```

**关键点**:
- 各成本项通过 CostCategoryMapping 配置映射
- 日成本 = 出库数量 × 单价
- 变动成本合计进入 GOP 计算

---

### 2.3 人工成本数据流

```
Excel录入                    Domain实体                计算引擎              GOP
────────────────────────────────────────────────────────────────────────────────

前台工资录入
    │
    ├── 月工资 ──────────────► LaborCost.frontDeskWages (日分摊值)
    │                         │
客房工资录入                  │ [ROOM_COUNT分摊]
    │                         │
    ├── 月工资 ──────────────► LaborCost.housekeepingWages (日分摊值) ──► totalLaborCost ──► GOP
    │                         │                                                    │
餐厅工资录入                  │                                                    │
    │                         │                                                    │
    ├── 月工资 ──────────────► LaborCost.restaurantWages (日分摊值)                  │
    │                         │                                                    │
管理层工资录入                │                                                    │
    │                         │                                                    │
    └── 月工资 ──────────────► LaborCost.managementWages (日分摊值) ─────────────────┘
```

**日分摊公式**:
```
日分摊值 = 月工资总额 / 当月天数 × (当日入住间数 / 基准房间数)
```

**⚠️ 分摊基准待确认**:
- TOTAL (133) - 固定值
- AVAILABLE - 可售房数
- OCCUPIED - 当日入住间数

---

### 2.4 提成成本数据流

```
Excel录入                    Domain实体                计算引擎              GOP
────────────────────────────────────────────────────────────────────────────────

前台好评提成录入
    │
    └── 好评数 × 单价 ────► CommissionCost.reviewCommission
                                  │
前台二维码提成录入              │ [汇总] ──────────────────────────────► totalCommissionCost ──► GOP
    │                              │                                         │
    └── 服务次数 × 单价 ───► CommissionCost.qrCommission                    │
                                  │                                         │
会员卡提成录入                   │                                         │
    │                              │                                         │
    └── 卡张数 × 单价 ────► CommissionCost.memberCardCommission             │
                                  │                                         │
客房提成录入                     │                                         │
    │                              │                                         │
    └── 做房数 × 系数 ───► CommissionCost.housekeepingCommission ─────────┘
```

---

### 2.5 固定成本数据流

```
Excel录入                    Domain实体                计算引擎              GOP
────────────────────────────────────────────────────────────────────────────────

固定费用录入
    │
    ├── 租金 ───────────────► FixedCost.rent (日分摊)
    │                         │
    ├── 物业费 ─────────────► FixedCost.otherFixedCost (日分摊) ──────► totalFixedCost ──► GOP
    │                         │                                         │
    ├── 保险 ───────────────► FixedCost.otherFixedCost (日分摊)         │
    │                         │                                         │
    └── [其他固定费] ───────► FixedCost.otherFixedCost (日分摊)         │
                                  │                                         │
平台推广费录入                     │                                         │
    │                              │                                         │
    ├── 美团推广费 ───────────► FixedCost.platformPromotionFee          │
    │                              │                                         │
    ├── 携程推广费 ───────────► FixedCost.platformPromotionFee            │
    │                              │                                         │
    └── [其他平台] ──────────► FixedCost.platformPromotionFee ───────────┘
```

**日分摊公式**:
```
日分摊值 = 月总额 / 当月天数
```

---

### 2.6 能耗数据流

```
Excel录入                    Domain实体                计算引擎              GOP
────────────────────────────────────────────────────────────────────────────────

能耗录入 Sheet
    │
    ├── 电表读数 ───────────► Energy.electricityConsumption
    │                         │
    ├── 电单价 ─────────────► Energy.electricityUnitPrice (店长维护)
    │                         │ [计算]
    │                         ▼
    │                    Energy.electricityCost ──────────────────────────► totalUtilityCost
    │                                                                             │
水费录入                                                                    │
    │                                                                      │
    ├── 水表读数 ───────────► Energy.waterConsumption                       │
    │                         │                                             │
    ├── 水单价 ─────────────► Energy.waterUnitPrice (店长维护) ───────────┘
    │                         │ [计算]
    │                         ▼
    │                    Energy.waterCost
    │                         │
天然气                                                    │
    │                         │
    ├── 天然气表读数 ───────► Energy.gasConsumption ── [计算] ──► gasCost ─┘
    │
    └── 天然气单价 ───────► Energy.gasUnitPrice (店长维护) ⚠️ NEED_CONFIRMATION
```

---

### 2.7 区域汇总数据流

```
各门店日核算 (APPROVED)
         │
         ├── 业绩达成 ──────► 运营部日核算表: 各门店日达成
         │                     │
         ├── 管理费达成 ─────► 运营部日核算表: 各门店日管理费
         │                     │
         └── GOP ─────────────► 附加价值合计
                                   │
                                   ▼
                            区域附加价值
                                   │
                                   ▼
                            GOP率 = 附加价值 / 收入合计
                                   │
                                   ▼
                            单位时间附加价值 (元/小时)
```

---

## 三、GOP 计算路径

```
收入
  │
  ├── roomRevenue ──► Revenue.totalRevenue
  ├── minibarRevenue ─┘
  ├── foodRevenue ──┘
  └── otherRevenue ──┘
         │
         │ [计算Engine]
         ▼
  totalRevenue
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
  totalVariableCost                    totalLaborCost
  (各变动成本项之和)                    (各人工成本日分摊之和)
         │                                      │
         │                                      │
         └──────────┬───────────────────────────┘
                    │
                    ▼
             totalFixedCost
             (固定成本日分摊)
                    │
                    ▼
             totalCommissionCost
             (提成成本日分摊)
                    │
                    └──────────┬─────────────────┘
                               │
                               ▼
                          totalCost
                               │
                               │ [计算Engine]
                               ▼
                          gop = totalRevenue - totalCost
                               │
                               ▼
                          gopRate = gop / totalRevenue
```

**重要约束**:
- 总部管理费 **不进入** GOP
- GOP 是独立指标，与管理费无关

---

## 四、数据追溯表

| 数据项 | 来源 | 目的地 | 追溯路径 |
|--------|------|--------|----------|
| 房费收入 | 收入及其他项目 | DailyOperation.Revenue | Excel → Domain → Calculation |
| 入住间数 | PMS/手工 | Revenue | Excel → Domain |
| 总收入 | 计算 | CalculationResult | Domain → Engine → Result |
| 变动成本 | 各成本录入 | VariableCost | Excel → Domain |
| 人工成本 | 工资录入 | LaborCost | Excel → Domain → 分摊计算 |
| GOP | 计算 | CalculationResult | Engine 计算得出 |
| 出租率 | 计算 | CalculationResult | Engine 计算得出 |
| 管理费 | 合同 | ManagementFee | Excel → Domain (不进入GOP) |

---

## 五、数据修改限制

| 状态 | 可修改字段 | 限制 |
|------|-----------|------|
| DRAFT | 全部录入字段 | 店长可修改 |
| SUBMITTED | 无 | 数据锁定 |
| REJECTED | 全部录入字段 | 店长可修改，需重新提交 |
| APPROVED | 无 | 数据锁定，管理员可回退 |

---

## 六、AuditLog 记录点

| 操作 | 触发条件 | 记录内容 |
|------|----------|----------|
| CREATE | 新建日核算 | oldValue=null, newValue=完整数据 |
| UPDATE | 修改录入数据 | oldValue, newValue |
| SUBMIT | 店长点击提交 | status变化，submittedAt |
| APPROVE | 总监审核通过 | status变化，reviewedAt |
| REJECT | 总监驳回 | status变化，rejectionReason |

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
