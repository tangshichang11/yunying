# Database Indexes

## 概述

本文档描述 Prisma Schema 中的所有索引设计及其目的。

**设计原则**:
- 核心查询必须高效
- Hotel + businessDate 组合是最频繁的查询
- 支持按状态筛选
- 支持按时间范围查询

---

## 一、核心索引

### 1.1 DailyOperation (日经营记录)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `daily_operations_hotelId_businessDate_key` | (hotelId, businessDate) | UNIQUE | 主查询：按酒店和日期查询单日记录 |
| `daily_operations_hotelId_idx` | hotelId | INDEX | 按酒店筛选 |
| `daily_operations_businessDate_idx` | businessDate | INDEX | 按日期筛选 |
| `daily_operations_status_idx` | status | INDEX | 按状态筛选 |
| `daily_operations_hotelId_status_idx` | (hotelId, status) | INDEX | 按酒店和状态筛选 |
| `daily_operations_hotelId_businessDate_idx` | (hotelId, businessDate) | INDEX | 显式索引覆盖唯一约束 |

**核心查询模式**:
```sql
-- 查询某酒店某日记录
SELECT * FROM daily_operations
WHERE hotelId = ? AND businessDate = ?

-- 查询某酒店某月所有记录
SELECT * FROM daily_operations
WHERE hotelId = ? AND businessDate >= ? AND businessDate < ?

-- 查询某酒店待审核记录
SELECT * FROM daily_operations
WHERE hotelId = ? AND status = 'SUBMITTED'
```

---

### 1.2 Hotel (酒店)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `hotels_code_key` | code | UNIQUE | 酒店编码全局唯一 |
| `hotels_regionId_idx` | regionId | INDEX | 按区域查询酒店 |

---

### 1.3 User (用户)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `users_email_key` | email | UNIQUE | 登录邮箱唯一 |
| `users_hotelId_idx` | hotelId | INDEX | 按酒店查询用户 |
| `users_regionId_idx` | regionId | INDEX | 按区域查询用户 |
| `users_role_idx` | role | INDEX | 按角色查询用户 |

---

## 二、成本数据索引

### 2.1 各成本表

所有成本表（Revenue, VariableCost, LaborCost, CommissionCost, FixedCost, Energy, CalculationResult）使用相同的索引模式：

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `{table}_dailyOperationId_key` | dailyOperationId | UNIQUE | 1:1 关联到 DailyOperation |

**设计理由**:
- 每个成本记录唯一对应一个 DailyOperation
- 通过 dailyOperationId 可直接 JOIN 获取成本数据
- 无需额外索引

---

## 三、目标数据索引

### 3.1 MonthlyTarget (月度目标)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `monthly_targets_hotelId_yearMonth_key` | (hotelId, yearMonth) | UNIQUE | 确保酒店月度唯一 |
| `monthly_targets_hotelId_idx` | hotelId | INDEX | 按酒店查询目标 |

### 3.2 WeeklyTarget (周目标)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `weekly_targets_hotelId_yearMonth_weekNumber_key` | (hotelId, yearMonth, weekNumber) | UNIQUE | 确保酒店周次唯一 |
| `weekly_targets_hotelId_idx` | hotelId | INDEX | 按酒店查询目标 |

### 3.3 DailyTarget (日目标)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `daily_targets_hotelId_businessDate_key` | (hotelId, businessDate) | UNIQUE | 确保酒店日期唯一 |
| `daily_targets_hotelId_idx` | hotelId | INDEX | 按酒店查询 |
| `daily_targets_businessDate_idx` | businessDate | INDEX | 按日期查询 |

---

## 四、异常与审计索引

### 4.1 Anomaly (异常记录)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `anomalies_dailyOperationId_idx` | dailyOperationId | INDEX | 按日经营记录查询异常 |
| `anomalies_calculationResultId_idx` | calculationResultId | INDEX | 按计算结果查询异常 |
| `anomalies_status_idx` | status | INDEX | 按状态查询异常 |

### 4.2 AuditLog (审计日志)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `audit_logs_entityType_entityId_idx` | (entityType, entityId) | INDEX | 追溯特定实体变更 |
| `audit_logs_operatorId_idx` | operatorId | INDEX | 追溯特定操作者 |
| `audit_logs_timestamp_idx` | timestamp | INDEX | 按时间查询 |
| `audit_logs_entityType_entityId_timestamp_idx` | (entityType, entityId, timestamp) | INDEX | 时间范围追溯 |

---

## 五、库存索引

### 5.1 InventoryItem (库存物品)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `inventory_items_hotelId_code_key` | (hotelId, code) | UNIQUE | 确保酒店内物品编码唯一 |
| `inventory_items_hotelId_idx` | hotelId | INDEX | 按酒店查询物品 |
| `inventory_items_category_idx` | category | INDEX | 按类别查询物品 |

### 5.2 InventoryTransaction (库存事务)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `inventory_transactions_hotelId_idx` | hotelId | INDEX | 按酒店查询 |
| `inventory_transactions_inventoryItemId_idx` | inventoryItemId | INDEX | 按物品查询 |
| `inventory_transactions_dailyOperationId_idx` | dailyOperationId | INDEX | 关联日经营记录 |
| `inventory_transactions_date_idx` | date | INDEX | 按日期查询 |

---

## 六、配置表索引

### 6.1 CostCategoryMapping (成本分类映射)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `cost_category_mappings_hotelId_sourceSheet_sourceField_key` | (hotelId, sourceSheet, sourceField) | UNIQUE | 确保映射唯一 |
| `cost_category_mappings_hotelId_idx` | hotelId | INDEX | 按酒店查询 |
| `cost_category_mappings_sourceSheet_idx` | sourceSheet | INDEX | 按Sheet查询 |

### 6.2 AllocationConfig (分摊配置)

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `allocation_configs_hotelId_costCategory_costSubCategory_key` | (hotelId, costCategory, costSubCategory) | UNIQUE | 确保配置唯一 |
| `allocation_configs_hotelId_idx` | hotelId | INDEX | 按酒店查询 |
| `allocation_configs_costCategory_idx` | costCategory | INDEX | 按成本类别查询 |

---

## 七、关系索引

### 7.1 Region-Organization

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `regions_organizationId_idx` | organizationId | INDEX | 按组织查询区域 |

### 7.2 管理费

| 索引名称 | 字段 | 类型 | 目的 |
|---------|------|------|------|
| `management_fees_hotelId_yearMonth_key` | (hotelId, yearMonth) | UNIQUE | 确保酒店月度唯一 |
| `management_fees_hotelId_idx` | hotelId | INDEX | 按酒店查询 |

---

## 八、索引使用建议

### 8.1 高频查询优化

```sql
-- 场景1: 店长查看今日录入状态
EXPLAIN ANALYZE
SELECT do.*, cr.gop, cr.gopRate
FROM daily_operations do
LEFT JOIN calculation_results cr ON cr.dailyOperationId = do.id
WHERE do.hotelId = 'hotel_123'
  AND do.businessDate = '2026-08-31';

-- 使用索引:
-- daily_operations_hotelId_businessDate_idx (覆盖)
-- calculation_results_dailyOperationId_key (JOIN)

-- 场景2: 总监查看区域下所有待审核
EXPLAIN ANALYZE
SELECT do.*
FROM daily_operations do
JOIN hotels h ON h.id = do.hotelId
WHERE h.regionId = 'region_456'
  AND do.status = 'SUBMITTED';

-- 使用索引:
-- daily_operations_status_idx
-- hotels_regionId_idx (JOIN)

-- 场景3: 月度收入汇总
EXPLAIN ANALYZE
SELECT
  do.hotelId,
  SUM(cr.totalRevenue) as totalRevenue,
  SUM(cr.gop) as totalGop
FROM daily_operations do
JOIN calculation_results cr ON cr.dailyOperationId = do.id
WHERE do.hotelId = 'hotel_123'
  AND do.businessDate >= '2026-08-01'
  AND do.businessDate < '2026-09-01'
GROUP BY do.hotelId;

-- 使用索引:
-- daily_operations_hotelId_businessDate_idx
-- calculation_results_dailyOperationId_key (JOIN)
```

### 8.2 避免全表扫描

| 不要这样做 | 应该这样做 |
|-----------|-----------|
| `WHERE status = 'DRAFT'` (无hotelId) | `WHERE hotelId = ? AND status = 'DRAFT'` |
| `WHERE businessDate BETWEEN ? AND ?` (无hotelId) | `WHERE hotelId = ? AND businessDate BETWEEN ? AND ?` |

---

## 九、PostgreSQL 特定优化

### 9.1 索引类型

- 默认使用 B-tree 索引（适用于 =, <, >, <=, >=）
- JSONB 字段使用 GIN 索引（如 AuditLog.oldValue/newValue）

### 9.2 索引维护

```sql
-- 查看索引使用情况
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 查看未使用的索引
SELECT
  schemaname || '.' || tablename AS table,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 十、迁移注意事项

### 10.1 大表索引创建

对于已有数据的表创建索引时，使用 `CONCURRENTLY` 避免锁表：

```sql
CREATE INDEX CONCURRENTLY daily_operations_businessDate_idx
ON daily_operations (businessDate);
```

### 10.2 部分索引

对于经常按状态查询的场景，可考虑部分索引：

```sql
CREATE INDEX daily_operations_submitted_idx
ON daily_operations (hotelId, businessDate)
WHERE status = 'SUBMITTED';
```

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
