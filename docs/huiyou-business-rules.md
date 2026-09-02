# 慧友酒店经营核算平台 - 业务规则
# Huiyou Hotel Accounting Platform - Business Rules

**最后更新**: 2026-08-31
**状态**: CONFIRMED (已确认，不再需要 NEED_CONFIRMATION)

---

## Rule 01: 月度业绩预定必须等于每日业绩预定之和

**规则**: `SUM(DailyForecast) = MonthlyForecast`

**验证逻辑**:
```sql
SELECT
  mf.yearMonth,
  mf.expectedRevenue AS monthlyForecast,
  SUM(df.expectedRevenue) AS dailySum,
  mf.expectedRevenue - SUM(df.expectedRevenue) AS variance
FROM monthly_forecasts mf
JOIN daily_forecasts df ON df.monthlyForecastId = mf.id
WHERE mf.id = :monthlyForecastId
GROUP BY mf.id;
```

**错误处理**:
- 当 `dailySum != monthlyForecast` 时
- 系统显示: "每日预定合计与月度预定不一致"
- 显示月度预定、每日合计、差额
- **禁止提交审核**

---

## Rule 02: 每日业绩预定不允许系统平均分配

**规则**: 系统不得使用 `MonthlyForecast / DaysInMonth` 自动生成正式 DailyForecast

**允许的辅助方式**:
- 按历史同期比例分配
- 按星期比例分配
- 按历史平均分配

**限制**:
- 这些只能作为"系统建议值"
- 店长必须可以修改
- 最终 DailyForecast 必须由店长人工确认

---

## Rule 03: 每日业绩预定由店长根据经营情况人工制定

**规则**: 每日业绩预定是店长根据实际经营情况自主制定的数据

**录入方式**:
1. 店长创建下月预定计划
2. 填写月度业绩预定
3. 拆解到每日业绩预定
4. 系统实时显示已分配/待分配/超额状态

---

## Rule 04: 系统可以提供建议值，但最终值由店长确认

**规则**: 辅助分配功能提供的建议值可以被店长修改

**最终值**: 店长确认后的值才是正式数据

---

## Rule 05: 月度与每日不一致时，禁止提交审核

**规则**: 当 `SUM(DailyForecast) != MonthlyForecast` 时，禁止提交审核

**状态流转**:
```
DRAFT → SUBMITTED (仅当校验通过)
```

**校验时机**:
- 前端实时校验 (UI)
- 后端提交时强制校验 (API)

---

## Rule 06: 审核通过后，DailyForecast 才成为正式生效数据

**规则**: ForecastPlan 状态为 APPROVED 时，DailyForecast 才与 DailyOperation 关联

**状态流转**:
```
DRAFT → SUBMITTED → APPROVED → ARCHIVED
```

**生效条件**:
- ForecastPlan.status = 'APPROVED'
- DailyOperation.status = 'APPROVED'

---

## Rule 07: DailyActual 只能与生效的 DailyForecast 比较

**规则**: 已审核的 DailyOperation 才能使用已审核的 DailyForecast 计算 Achievement

**计算公式**:
```typescript
// Achievement Rate
achievementRate = actualRevenue / expectedRevenue

// Variance
variance = actualRevenue - expectedRevenue

// Anomaly Detection
isRevenueAnomaly = actualRevenue < expectedRevenue * 0.95
```

---

## Rule 08: 房态数据由店长每日录入

**规则**: 房态数据 (RoomStatus.soldRooms) 由店长每天录入

**数据来源**:
- 店长手工录入 (当前)
- PMS 系统集成 (未来)

**注意**: 不再使用 outOfOrderRooms, outOfServiceRooms, availableRooms

---

## Rule 09: 物理总房间数来自 Hotel Master Data

**规则**: Hotel.physicalRoomCount 是酒店基础资料，店长不能修改

**数据来源**: Hotel Master Data (系统初始化时设置)
**字段名**: `physicalRoomCount` (物理总房间数)

---

## Rule 10: 经营指标计算公式 (CONFIRMED)

### 10.1 Occupancy (出租率)

**公式**:
```
occupancyRate = soldRooms / physicalRoomCount
```

**数据来源**:
- `soldRooms`: 店长录入 (RoomStatus.soldRooms)
- `physicalRoomCount`: Hotel Master Data

**示例**:
```
物理总房间数: 100
实际出租房间数: 80
Occupancy = 80 / 100 = 80%
```

### 10.2 ADR (平均房价)

**公式**:
```
adr = roomRevenue / soldRooms
```

**数据来源**:
- `roomRevenue`: 店长录入 (Revenue)
- `soldRooms`: 店长录入 (RoomStatus.soldRooms)

**示例**:
```
客房收入: 30,000
出租房间: 80
ADR = 30,000 / 80 = 375
```

### 10.3 RevPAR (每可供房收入)

**公式**:
```
revpar = roomRevenue / physicalRoomCount
```

**数据来源**:
- `roomRevenue`: 店长录入 (Revenue)
- `physicalRoomCount`: Hotel Master Data

**示例**:
```
客房收入: 30,000
物理总房间数: 100
RevPAR = 30,000 / 100 = 300
```

### 10.4 三者关系 (CONFIRMED)

**公式验证**:
```
RevPAR = ADR × Occupancy
300 = 375 × 0.80 ✓
```

---

## Rule 11: 系统计算字段 (店长不得手动录入)

以下字段为**系统自动计算**，店长页面只读：

| 字段 | 计算公式 | 状态 |
|------|---------|------|
| occupancyRate | soldRooms / physicalRoomCount | CONFIRMED |
| adr | roomRevenue / soldRooms | CONFIRMED |
| revpar | roomRevenue / physicalRoomCount | CONFIRMED |

---

## Rule 12: 异常检测规则

### 12.1 收入异常

**条件**: `actualRevenue < expectedRevenue * 0.95`

**处理**:
- 标记为 WARNING 或 ERROR
- 在 UI 中显示提醒
- 不阻止提交

### 12.2 成本异常

**条件**: `actualCost > expectedCost`

**处理**:
- 标记为 WARNING 或 ERROR
- 在 UI 中显示提醒
- 不阻止提交

---

## Rule 13: 提交截止时间

**规则**: 每日核算必须在 `businessDate + 1 day 18:00` 前提交

**计算公式**:
```typescript
deadline = new Date(businessDate);
deadline.setDate(deadline.getDate() + 1);
deadline.setHours(18, 0, 0, 0);
```

---

## Rule 14: 审核流程

**规则**:
1. 店长提交每日核算 (DRAFT → SUBMITTED)
2. 区域总监审核 (SUBMITTED → APPROVED 或 REJECTED)
3. 驳回后店长可修改并重新提交

---

## Rule 15: Forecast 数据层级

```
ForecastPlan (年度计划)
    ↓
MonthlyForecast (月度预定)
    ↓
DailyForecast (每日预定)
```

**状态**:
- ForecastPlan 状态控制整体生效性
- 只有 APPROVED 的 ForecastPlan 下的 DailyForecast 才能被使用

---

## Rule 16: 名称规范

| 原名称 | 新名称 | 说明 |
|--------|--------|------|
| Revenue Target | Revenue Forecast | 预定收入 |
| Cost Target | Cost Forecast | 预定成本 |
| actualRooms | physicalRoomCount | 物理总房间数 |
| occupiedRooms (已废弃) | soldRooms | 实际出租房间数 |
| 今日目标 | 今日预定 | UI 显示 |

---

## Rule 17: Forecast 未来扩展 (待实施)

当 Forecast 功能实施时：

```
forecastSoldRooms 和 forecastRoomRevenue
根据已确认的 Forecast 业务逻辑产生

预计出租率 = forecastSoldRooms / physicalRoomCount
预计 ADR = forecastRoomRevenue / forecastSoldRooms
预计 RevPAR = forecastRoomRevenue / physicalRoomCount
```

---

## 数据模型对照

### Hotel Master Data
```prisma
model Hotel {
  physicalRoomCount Int  // 物理总房间数 (CONFIRMED)
}
```

### Room Status (每日录入)
```prisma
model RoomStatus {
  soldRooms Int  // 实际出租房间数 (CONFIRMED: 原 occupiedRooms)
}
```

### Revenue (每日录入)
```prisma
model Revenue {
  roomRevenue    Decimal  // 客房收入 (CONFIRMED)
  minibarRevenue Decimal  // 迷你吧收入
  foodRevenue    Decimal  // 餐费收入
  otherRevenue   Decimal  // 其他业务收入
}
```

### Calculation Result (系统计算)
```prisma
model CalculationResult {
  occupancyRate  Decimal  // 系统计算: soldRooms / physicalRoomCount
  adr            Decimal  // 系统计算: roomRevenue / soldRooms
  revpar         Decimal  // 系统计算: roomRevenue / physicalRoomCount
}
```

---

## 已确认业务规则状态

| 规则 | 状态 | 说明 |
|------|------|------|
| Occupancy 计算公式 | ✅ CONFIRMED | soldRooms / physicalRoomCount |
| ADR 计算公式 | ✅ CONFIRMED | roomRevenue / soldRooms |
| RevPAR 计算公式 | ✅ CONFIRMED | roomRevenue / physicalRoomCount |
| RevPAR = ADR × Occupancy | ✅ CONFIRMED | 三者关系验证 |
| physicalRoomCount 来源 | ✅ CONFIRMED | Hotel Master Data |
| soldRooms 来源 | ✅ CONFIRMED | 店长每日录入 |
| GOP Forecast 定义 | ⏳ NEED_CONFIRMATION | 独立维护还是计算? |

---

**注意**: 所有指标计算以本文件为准，不再使用 `availableRooms` 作为计算分母。
