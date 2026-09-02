# 慧友酒店经营核算平台 - Domain Model

## 1. 设计原则

### 1.1 核心原则
- **业务实体优先**: 不直接映射 Excel Sheet，基于业务实体建模
- **数据溯源**: 所有计算结果必须可追溯到原始数据
- **计算独立**: Calculation Engine 作为独立模块，与 UI/ API 解耦
- **配置驱动**: 成本分类、分摊方式等使用可配置设计

### 1.2 建模约束
- 所有经营数据必须关联 `hotelId`
- 所有日经营数据必须关联 `businessDate`
- 金额使用 `Decimal`，不使用 `Float`
- GOP 和总部管理费必须分离

### 1.3 不允许事项
- 不允许把 Excel Sheet 直接设计成数据库表
- 不允许 API 层重复计算公式
- 不允许自行增加没有业务依据的财务指标
- 不允许自行猜测业务规则

---

## 2. Domain 结构

```
Organization (组织)
    └── Region (区域)
            └── Hotel (酒店)
                    ├── User (用户)
                    ├── DailyOperation (日经营记录)
                    │       ├── Revenue (收入)
                    │       ├── VariableCost (变动成本)
                    │       ├── LaborCost (人工成本)
                    │       ├── CommissionCost (提成成本)
                    │       ├── FixedCost (固定成本)
                    │       ├── Energy (能耗)
                    │       └── InventoryItem / InventoryTransaction (库存)
                    ├── CalculationResult (计算结果)
                    ├── Anomaly (异常)
                    └── AuditLog (审计日志)
```

---

## 3. 组织层级 (Organization Hierarchy)

### 3.1 Organization
```
组织顶层，代表慧友集团
```

### 3.2 Region
```
区域，目前所有门店属于一个区域
但数据库必须保留 Region 表支持未来多区域
```

### 3.3 Hotel
```
酒店门店
龙口悦致是第一个试点酒店
```

---

## 4. 用户与权限 (User & Role)

### 4.1 User
```
- 店长 (manager): 录入门店数据
- 区域运营总监 (director): 审核数据
- 系统管理员 (admin): 系统配置
```

### 4.2 Role
```
角色定义与权限关联
```

---

## 5. 日经营数据 (Daily Operation)

### 5.1 DailyOperation (日经营记录)
```
核心聚合实体
- 关联 hotelId
- 关联 businessDate (营业日，不是 createdAt)
- 状态: DRAFT → SUBMITTED → APPROVED/REJECTED
- 包含所有输入和输出
```

### 5.2 收入 (Revenue)
```
来自 Excel: 收入及其他项目
- roomRevenue: 房费收入
- minibarRevenue: 迷你吧收入
- foodRevenue: 餐费收入
- otherRevenue: 其他业务收入
```

### 5.3 变动成本 (VariableCost)
```
来自多个 Excel 录入 Sheet
需要通过 CostCategoryMapping 配置映射
```

### 5.4 人工成本 (LaborCost)
```
来自各工资录入 Sheet
按日分摊后存储
```

### 5.5 提成成本 (CommissionCost)
```
来自各提成录入 Sheet
- 前台好评提成
- 前台二维码提成
- 会员卡提成
- 客房提成
```

### 5.6 固定成本 (FixedCost)
```
来自固定费用录入、平台推广费录入
```

### 5.7 能耗 (Energy)
```
来自能耗录入 Sheet
- electricityConsumption / unitPrice / cost
- waterConsumption / unitPrice / cost
- gasConsumption / unitPrice / cost
```

### 5.8 库存 (Inventory)
```
来自各出入库录入 Sheet
- InventoryItem: 物品定义
- InventoryTransaction: 出入库记录
```

---

## 6. 计算结果 (Calculation Result)

### 6.1 CalculationResult
```
GOP = 收入 - 总成本
总成本 = 变动成本 + 人工成本 + 提成成本 + 固定成本

GOP 是 CalculationResult 的一部分
总部管理费是独立的 ManagementFee
```

### 6.2 可追溯性
```
CalculationResult 必须包含:
- 对应 DailyOperation 的引用
- 所有输入数据的引用
- 计算公式版本
- 计算时间
```

---

## 7. 目标管理 (Target)

### 7.1 MonthlyTarget / WeeklyTarget / DailyTarget
```
月 → 周 → 日 三级目标
人工维护，不做自动预测
```

---

## 8. 异常检测 (Anomaly)

### 8.1 收入异常
```
actualRevenue < expectedRevenue × 0.95
```

### 8.2 成本异常
```
actualCost > expectedCost
```

---

## 9. 审计日志 (Audit Log)

### 9.1 必须记录的操作
```
- DailyOperation 状态变化
- 所有金额字段修改
- 提交/审核/驳回操作
```

### 9.2 截止时间
```
businessDate + 1 day 18:00
不是 createdAt + 24 hours
```

---

## 10. 关键设计决策

### 10.1 成本分类配置化
```
不硬编码 Excel Sheet → 成本类别 的映射
通过 CostCategoryMapping 配置表实现
```

### 10.2 分摊方式配置化
```
不假设分摊逻辑
通过 AllocationMethod 配置
支持: ROOM_COUNT, DAILY_USAGE, MANUAL
```

### 10.3 输入与计算分离
```
RawInputs (原始输入) 和 CalculationResult (计算结果) 分离
确保计算可追溯
```

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
