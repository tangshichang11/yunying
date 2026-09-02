# Target Management Architecture
# 目标管理系统架构

## 1. Target 数据生命周期

```
[导入年度目标 Excel]
       ↓
[DRAFT] ←→ [ACTIVE] ←→ [ARCHIVED]
       ↓
  店长每日只读
```

**状态说明**:
- `DRAFT`: 草稿状态，可编辑，可删除
- `ACTIVE`: 当前生效版本，只能有一个
- `ARCHIVED`: 历史版本，保留记录

**生命周期规则**:
1. 导入时创建 DRAFT 版本
2. 确认导入后设为 ACTIVE
3. 重新导入时 ARCHIVED 旧版本，创建新 DRAFT
4. ACTIVE 版本可标记为 ARCHIVED

---

## 2. Target 数据模型

### 2.1 现有模型 (保持不变)

```prisma
model DailyTarget {
  id            String  @id @default(cuid())
  hotelId       String
  businessDate  DateTime
  revenueTarget Decimal @db.Decimal(12,2)
  costTarget    Decimal @db.Decimal(12,2)
  gopTarget     Decimal @db.Decimal(12,2)

  hotel         Hotel   @relation(fields: [hotelId], references: [id])

  @@unique([hotelId, businessDate])
}
```

**问题**: 当前 DailyTarget 没有版本控制，需要扩展。

### 2.2 新增模型: TargetPlan

```prisma
model TargetPlan {
  id            String   @id @default(cuid())
  hotelId       String
  year          Int      // 2026
  versionNumber Int      // 1, 2, 3...
  name          String   // "2026年度经营目标 V1"
  status        TargetPlanStatus @default(DRAFT)

  // 有效日期范围 (可选项，用于快速查询)
  startDate     DateTime?
  endDate       DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hotel         Hotel      @relation(fields: [hotelId], references: [id])
  dailyTargets  DailyTarget[]

  @@unique([hotelId, year, status]) // 同一酒店同年只能有一个 ACTIVE
  @@unique([hotelId, year, versionNumber])
  @@index([hotelId, year])
}

enum TargetPlanStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### 2.3 DailyTarget 扩展

```prisma
model DailyTarget {
  id             String   @id @default(cuid())
  hotelId        String
  businessDate   DateTime
  revenueTarget  Decimal  @db.Decimal(12,2)
  costTarget     Decimal  @db.Decimal(12,2)
  gopTarget      Decimal  @db.Decimal(12,2)

  // 新增: 关联 TargetPlan
  targetPlanId   String

  hotel          Hotel      @relation(fields: [hotelId], references: [id])
  targetPlan     TargetPlan @relation(fields: [targetPlanId], references: [id])

  @@unique([hotelId, businessDate, targetPlanId])
  @@index([hotelId, businessDate])
}
```

---

## 3. Excel Import

### 3.1 Excel 格式

| 日期 | 收入目标 | 成本目标 | GOP目标 |
|------|---------|---------|--------|
| 2026-01-01 | 30000 | 22000 | 8000 |
| 2026-01-02 | 30000 | 22000 | 8000 |
| ... | ... | ... | ... |

### 3.2 Validation 规则

**必须检查**:
1. [x] 日期是否重复
2. [x] 日期是否缺失
3. [x] 日期格式是否为 YYYY-MM-DD
4. [x] 是否覆盖完整年度 (365/366天)
5. [x] Revenue Target 是否为空
6. [x] Cost Target 是否为空
7. [x] GOP Target 是否为空
8. [x] 是否存在非法数字 (非数字字符)
9. [x] 是否存在负数
10. [x] 酒店是否匹配

**错误处理**:
- 发现错误时禁止导入
- 显示具体错误行和错误原因
- 支持部分校验 (可选)

### 3.3 Import Flow

```
[上传 Excel]
     ↓
[解析 Excel]
     ↓
[数据校验] → [错误] → [显示错误信息]
     ↓
[预览数据]
     ↓
[确认导入]
     ↓
[创建 TargetPlan (DRAFT)]
     ↓
[批量创建 DailyTarget]
     ↓
[标记为 ACTIVE]
     ↓
[ARCHIVED 旧版本]
```

---

## 4. Target Version

### 4.1 版本规则

1. 同一酒店 + 同一年只能有一个 `ACTIVE` TargetPlan
2. 重新导入时会创建新版本
3. 历史版本保留为 `ARCHIVED`

### 4.2 版本查询

```typescript
// 获取当前生效版本
const activePlan = await prisma.targetPlan.findFirst({
  where: {
    hotelId,
    year: 2026,
    status: 'ACTIVE'
  }
});

// 查询当日目标
const dailyTarget = await prisma.dailyTarget.findFirst({
  where: {
    hotelId,
    businessDate,
    targetPlanId: activePlan.id
  }
});
```

---

## 5. Daily Target Query

### 5.1 API 设计

```typescript
// GET /api/targets/:hotelId/daily?date=2026-08-31
interface DailyTargetResponse {
  hotelId: string;
  businessDate: string;
  targetPlan: {
    id: string;
    name: string;
    version: number;
  };
  revenueTarget: number;
  costTarget: number;
  gopTarget: number;
}
```

### 5.2 查询逻辑

```typescript
async function getDailyTarget(hotelId: string, businessDate: string) {
  const year = new Date(businessDate).getFullYear();

  // 1. 获取 ACTIVE TargetPlan
  const activePlan = await prisma.targetPlan.findFirst({
    where: {
      hotelId,
      year,
      status: 'ACTIVE'
    }
  });

  if (!activePlan) {
    return null; // 没有生效的目标计划
  }

  // 2. 查询当日目标
  const dailyTarget = await prisma.dailyTarget.findFirst({
    where: {
      hotelId,
      businessDate: new Date(businessDate),
      targetPlanId: activePlan.id
    }
  });

  return {
    hotelId,
    businessDate,
    targetPlan: {
      id: activePlan.id,
      name: activePlan.name,
      version: activePlan.versionNumber
    },
    ...dailyTarget
  };
}
```

---

## 6. Permission

| 角色 | 权限 |
|------|------|
| ADMIN | 导入/编辑/删除所有目标 |
| REGIONAL_DIRECTOR | 导入/编辑/删除本区域目标 |
| HOTEL_MANAGER | 只读目标数据 |

**UI 显示**:
- [年度目标计划] - 只读标签
- 店长页面不显示任何目标编辑功能

---

## 7. Target vs Actual

### 7.1 计算公式

| 指标 | 公式 |
|------|------|
| Revenue Achievement | Actual Revenue / Revenue Target |
| Cost Variance | Actual Cost - Cost Target |
| GOP Achievement | Actual GOP / GOP Target |

### 7.2 异常检测

```typescript
// 收入异常: 实际收入 < 目标收入 × 95%
const isRevenueAnomaly = actualRevenue < revenueTarget * 0.95;

// 成本异常: 实际成本 > 目标成本
const isCostAnomaly = actualCost > costTarget;
```

### 7.3 字段说明

**NEED_CONFIRMATION**:
- `gopTarget` 字段存在，但业务规则未确认:
  - 是独立维护的？
  - 还是由 Revenue Target - Cost Target 计算得出？

---

## 8. UI Flow

### 8.1 Target Management 页面

路径: `/targets`

```
┌─────────────────────────────────────────────────────┐
│  目标管理                                             │
├─────────────────────────────────────────────────────┤
│  酒店: [龙口悦致酒店 ▼]                               │
│  年度: [2026 ▼]                                      │
│                                                     │
│  [上传 Excel]  [下载模板]                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 版本    状态     创建时间        操作         │   │
│  ├─────────────────────────────────────────────┤   │
│  │ V2      ACTIVE   2026-08-31    [查看][归档]  │   │
│  │ V1      ARCHIVED 2026-01-01    [查看]        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 8.2 Import Flow

```
[步骤1: 上传] → [步骤2: 校验] → [步骤3: 预览] → [步骤4: 确认]
```

### 8.3 店长页面目标显示

```
┌─────────────────────────────────────────────────────┐
│  今日目标                                             │
├─────────────────────────────────────────────────────┤
│  收入目标        成本目标        GOP目标              │
│  ¥32,000         ¥24,000        ¥8,000              │
│  [年度目标计划]   [年度目标计划]   [年度目标计划]       │
└─────────────────────────────────────────────────────┘
```

---

## 9. API

### 9.1 Target Plan APIs

```typescript
// GET /api/targets/plans?hotelId=xxx&year=2026
// 获取酒店年度目标计划列表

// POST /api/targets/plans/import
// 导入 Excel，创建新版本

// PATCH /api/targets/plans/:id/activate
// 激活目标计划

// PATCH /api/targets/plans/:id/archive
// 归档目标计划
```

### 9.2 Daily Target API

```typescript
// GET /api/targets/:hotelId/daily?date=2026-08-31
// 获取当日目标
```

---

## 10. Database Changes

### 10.1 新增表

```sql
CREATE TABLE target_plans (
  id VARCHAR(191) PRIMARY KEY,
  hotel_id VARCHAR(191) NOT NULL,
  year INT NOT NULL,
  version_number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') DEFAULT 'DRAFT',
  start_date DATETIME(3),
  end_date DATETIME(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3),

  FOREIGN KEY (hotel_id) REFERENCES hotels(id),

  UNIQUE KEY unique_hotel_year_active (hotel_id, year, status)
    -- 确保同年只有一个 ACTIVE (需要通过 CHECK 约束实现)
);
```

### 10.2 修改表

```sql
-- DailyTarget 新增 target_plan_id
ALTER TABLE daily_targets ADD COLUMN target_plan_id VARCHAR(191);
ALTER TABLE daily_targets ADD FOREIGN KEY (target_plan_id) REFERENCES target_plans(id);

-- 修改唯一约束
ALTER TABLE daily_targets DROP INDEX unique_hotel_business_date;
ALTER TABLE daily_targets ADD UNIQUE KEY unique_hotel_date_plan (hotel_id, business_date, target_plan_id);
```

---

## 11. Business Questions

### 11.1 需要慧友确认

| 问题 | 状态 |
|------|------|
| GOP Target 是独立维护还是计算得出？ | NEED_CONFIRMATION |
| 目标数据按年度还是按月度/周度维护？ | 第一版按年度导入日数据 |
| 是否需要支持多酒店批量导入？ | 第一版单酒店导入 |
| Target Plan 版本命名规则？ | V1, V2, V3... |

### 11.2 已知假设

1. 第一版只支持年度导入日目标
2. 月度/周度目标可由日目标聚合计算
3. 同一酒店同年只能有一个 ACTIVE 计划

---

## 12. Metric Definition Gap

### 12.1 当前系统公式

```
Occupancy = occupiedRooms / actualRooms
          = 61 / 120
          = 50.83%
```

### 12.2 待确认问题

| 指标 | 问题 |
|------|------|
| Occupancy | 计算基数是总房间数(120)还是可售房数(120-1-1=118)? |
| ADR | 使用房费收入还是总收入？ |
| RevPAR | 使用房费收入还是总收入？ |

### 12.3 行业标准

- **Occupancy**: 入住间数 / 可售房数 (可用房间数)
- **ADR**: 房费收入 / 入住间数
- **RevPAR**: 房费收入 / 可售房数 = ADR × Occupancy

**需要慧友确认当前系统的业务口径是否正确。**
