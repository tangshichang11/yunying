# 数据字典

## 概述

本文档定义慧友酒店经营核算平台的完整数据字典。

**设计原则**:
- 不把 Excel Sheet 直接设计成数据库表
- 通过 CostCategoryMapping 实现 Excel 到业务实体的可配置映射
- 每个字段必须有明确的"为什么存在"的理由
- 无法确认的字段标记 NEED_CONFIRMATION

**文档状态**: Phase 1.6 完成

---

## 一、核心字段定义

### 1.1 收入相关

#### Revenue.roomRevenue (房费收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | 房费收入 |
| **Domain Entity** | Revenue |
| **Database Field** | room_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | PMS系统或手工录入 |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **是否计算** | 否（直接录入） |
| **计算规则** | - |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 是（DRAFT状态下） |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 收入及其他项目 |
| **Excel来源位置** | Row 5, 日数据列 |
| **为何存在** | 酒店核心收入来源，必须独立记录 |

#### Revenue.minibarRevenue (迷你吧收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | 迷你吧收入 |
| **Domain Entity** | Revenue |
| **Database Field** | minibar_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入 |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **是否计算** | 否 |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 是 |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 收入及其他项目 |
| **Excel来源位置** | Row 6 |
| **为何存在** | 酒店辅助收入，需单独统计 |

#### Revenue.foodRevenue (餐费收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | 餐费收入 |
| **Domain Entity** | Revenue |
| **Database Field** | food_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入 |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **是否计算** | 否 |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 是 |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 收入及其他项目 |
| **Excel来源位置** | Row 7 |
| **为何存在** | 餐厅收入单独统计 |

#### Revenue.otherRevenue (其他业务收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | 其他业务收入 |
| **Domain Entity** | Revenue |
| **Database Field** | other_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 收入及其他项目 |
| **Excel来源位置** | Row 8 |
| **为何存在** | 捕获非主要业务收入 |

#### Revenue.totalRevenue (收入合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 收入合计 |
| **Domain Entity** | Revenue |
| **Database Field** | total_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否人工输入** | 否 |
| **是否计算** | 是 |
| **计算规则** | roomRevenue + minibarRevenue + foodRevenue + otherRevenue |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 否 |
| **是否必填** | 是 |
| **Excel来源Sheet** | 汇总表 |
| **Excel来源位置** | Row 11 |
| **为何存在** | 总收入是GOP计算的基础 |

---

### 1.2 房间数相关

#### Hotel.actualRooms (实际间数)

| 属性 | 值 |
|------|-----|
| **业务字段** | 实际间数 |
| **Domain Entity** | Hotel |
| **Database Field** | actual_rooms |
| **数据类型** | Integer |
| **数据来源** | 酒店配置（固定值） |
| **是否人工输入** | 否（系统配置） |
| **输入角色** | 系统初始化 |
| **是否计算** | 否 |
| **是否进入GOP** | 否（作为分母使用） |
| **是否进入运营部** | 否 |
| **是否允许修改** | 仅初始化时 |
| **是否必填** | 是 |
| **校验规则** | > 0 |
| **Excel来源Sheet** | 汇总表 |
| **Excel来源位置** | Row 3 (固定值133) |
| **为何存在** | 酒店规模指标，用于计算出租率、RevPAR等 |

#### DailyOperation.occupiedRooms (入住间数)

| 属性 | 值 |
|------|-----|
| **业务字段** | 入住间数 |
| **Domain Entity** | DailyOperation (通过 Revenue 关联) |
| **Database Field** | occupied_rooms |
| **数据类型** | Integer |
| **数据来源** | PMS系统或手工录入 |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **是否计算** | 否 |
| **是否进入GOP** | 否（指标用） |
| **是否进入运营部** | 是 |
| **是否允许修改** | 是（DRAFT状态） |
| **是否必填** | 是 |
| **校验规则** | >= 0 且 <= actualRooms |
| **Excel来源Sheet** | 收入及其他项目 / 汇总表 |
| **Excel来源位置** | Row 2 |
| **为何存在** | 计算出租率、平均房价、RevPAR的基础数据 |

#### CalculationResult.occupancyRate (出租率)

| 属性 | 值 |
|------|-----|
| **业务字段** | 出租率 |
| **Domain Entity** | CalculationResult |
| **Database Field** | occupancy_rate |
| **数据类型** | Decimal(8,6) |
| **数据来源** | 计算得出 |
| **是否人工输入** | 否 |
| **是否计算** | 是 |
| **计算规则** | occupiedRooms / actualRooms |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 否 |
| **是否必填** | 是 |
| **校验规则** | 0 <= value <= 1.5 (允许偶尔>1) |
| **Excel来源Sheet** | 汇总表 / 阿米巴核算表（日） |
| **Excel来源位置** | 计算得出 |
| **为何存在** | 核心运营指标，反映客房销售效率 |

#### CalculationResult.avgRoomRate (平均房价)

| 属性 | 值 |
|------|-----|
| **业务字段** | 平均房价 (ADR) |
| **Domain Entity** | CalculationResult |
| **Database Field** | avg_room_rate |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否人工输入** | 否 |
| **是否计算** | 是 |
| **计算规则** | roomRevenue / occupiedRooms |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 否 |
| **是否必填** | 是 |
| **校验规则** | > 0 |
| **Excel来源Sheet** | 收入及其他项目 / 汇总表 |
| **Excel来源位置** | Row 3 |
| **为何存在** | 核心运营指标，反映客房定价效率 |

#### CalculationResult.revpar (每可供房收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | RevPAR |
| **Domain Entity** | CalculationResult |
| **Database Field** | revpar |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否人工输入** | 否 |
| **是否计算** | 是 |
| **计算规则** | roomRevenue / actualRooms |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 否 |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 收入及其他项目 / 汇总表 |
| **Excel来源位置** | Row 4 |
| **为何存在** | 核心运营指标，综合反映客房收入效率 |

---

### 1.3 变动成本相关

#### VariableCost.roomSuppliesCost (客房耗材成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 客房耗材成本 |
| **Domain Entity** | VariableCost |
| **Database Field** | room_supplies_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 客房耗材出入库录入 |
| **是否人工输入** | 是（出库数量录入） |
| **输入角色** | 店长 |
| **是否计算** | 是（消耗×单价） |
| **计算规则** | SUM(出库数量 × 单价) |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **是否允许修改** | 是（DRAFT状态） |
| **是否必填** | 是 |
| **校验规则** | >= 0 |
| **Excel来源Sheet** | 客房耗材出入库录入 → 客房耗材成本呈现 |
| **Excel来源位置** | 出库金额列 |
| **为何存在** | 变动成本的主要组成部分 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### VariableCost.frontDeskItemsCost (前台增值物品成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 前台增值物品成本 |
| **Domain Entity** | VariableCost |
| **Database Field** | front_desk_items_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 前台增值物品出入库录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **是否进入运营部** | 是 |
| **Excel来源Sheet** | 前台增值物品出入库录入 → 前台增值物品成本呈现 |
| **为何存在** | 前台销售物品的成本 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### VariableCost.merchandiseCost (小商品成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 小商品成本 |
| **Domain Entity** | VariableCost |
| **Database Field** | merchandise_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 商品录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 商品录入 → 商品成本呈现 |
| **为何存在** | 小商品销售成本 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### VariableCost.laundryCost (洗涤费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 洗涤费 |
| **Domain Entity** | VariableCost |
| **Database Field** | laundry_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 洗涤费录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 洗涤费录入 → 洗涤费呈现 |
| **为何存在** | 布草洗涤费用 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### VariableCost.restaurantCost (餐厅成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 餐厅成本 |
| **Domain Entity** | VariableCost |
| **Database Field** | restaurant_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 餐厅成本录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 餐厅成本录入 → 餐厅成本呈现 |
| **为何存在** | 餐厅原材料成本 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### VariableCost.otherVariableCost (其他变动成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 其他变动成本 |
| **Domain Entity** | VariableCost |
| **Database Field** | other_variable_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入 |
| **是否人工输入** | 是 |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | - |
| **为何存在** | 捕获未分类的变动成本 |

#### VariableCost.totalVariableCost (变动成本合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 变动成本合计 |
| **Domain Entity** | VariableCost |
| **Database Field** | total_variable_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | SUM(各变动成本项) |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 汇总表 |
| **为何存在** | 变动成本总计，用于GOP计算 |

---

### 1.4 人工成本相关

#### LaborCost.frontDeskWages (前台日工资分摊)

| 属性 | 值 |
|------|-----|
| **业务字段** | 前台日工资分摊 |
| **Domain Entity** | LaborCost |
| **Database Field** | front_desk_wages |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 前台工资录入 |
| **是否人工输入** | 是（月工资、出勤天数） |
| **是否计算** | 是（日分摊） |
| **计算规则** | 月工资 / 当月天数 或 按房间数分摊 |
| **分摊方式** | ROOM_COUNT（待确认） |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 前台工资录入 → 前台工资呈现 |
| **为何存在** | 前台部门人工成本需分摊到日 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |
| **分摊状态** | ⚠️ NEED_CONFIRMATION |

#### LaborCost.housekeepingWages (客房日工资分摊)

| 属性 | 值 |
|------|-----|
| **业务字段** | 客房日工资分摊 |
| **Domain Entity** | LaborCost |
| **Database Field** | housekeeping_wages |
| **数据类型** | Decimal(12,2) |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **分摊方式** | ROOM_COUNT（待确认） |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 客房工资录入 → 客房工资呈现 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### LaborCost.restaurantWages (餐厅日工资分摊)

| 属性 | 值 |
|------|-----|
| **业务字段** | 餐厅日工资分摊 |
| **Domain Entity** | LaborCost |
| **Database Field** | restaurant_wages |
| **数据类型** | Decimal(12,2) |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **分摊方式** | ROOM_COUNT（待确认） |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 餐厅工资录入 → 餐厅工资呈现 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### LaborCost.managementWages (管理日工资分摊)

| 属性 | 值 |
|------|-----|
| **业务字段** | 管理日工资分摊 |
| **Domain Entity** | LaborCost |
| **Database Field** | management_wages |
| **数据类型** | Decimal(12,2) |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **分摊方式** | ROOM_COUNT（待确认） |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 管理层工资录入 → 管理层工资呈现 |
| **映射状态** | ⚠️ NEED_CONFIRMATION |

#### LaborCost.totalLaborCost (人工成本合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 人工成本合计 |
| **Domain Entity** | LaborCost |
| **Database Field** | total_labor_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | SUM(各部门日分摊工资) |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 汇总表 |
| **为何存在** | 人工成本总计，用于GOP计算 |

---

### 1.5 提成成本相关

#### CommissionCost.reviewCommission (前台好评提成)

| 属性 | 值 |
|------|-----|
| **业务字段** | 前台好评提成 |
| **Domain Entity** | CommissionCost |
| **Database Field** | review_commission |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 前台好评提成录入 |
| **是否人工输入** | 是（好评数×单价） |
| **是否计算** | 是 |
| **计算规则** | SUM(好评数 × 各平台单价) |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 前台好评提成录入 → 前台好评提成呈现 |
| **为何存在** | 前台员工好评激励成本 |
| **确认状态** | ✅ 已确认 |

#### CommissionCost.qrCommission (前台二维码提成)

| 属性 | 值 |
|------|-----|
| **业务字段** | 前台二维码提成 |
| **Domain Entity** | CommissionCost |
| **Database Field** | qr_commission |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 前台二维码提成录入 |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **计算规则** | SUM(服务次数 × 单价) |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 前台二维码提成录入 → 前台二维码提成呈现 |
| **确认状态** | ✅ 已确认 |

#### CommissionCost.memberCardCommission (会员卡提成)

| 属性 | 值 |
|------|-----|
| **业务字段** | 会员卡提成 |
| **Domain Entity** | CommissionCost |
| **Database Field** | member_card_commission |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 会员卡提成录入 |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **计算规则** | SUM(卡张数 × 单价) |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 会员卡提成录入 → 会员卡提成呈现 |
| **确认状态** | ✅ 已确认 |

#### CommissionCost.housekeepingCommission (客房提成)

| 属性 | 值 |
|------|-----|
| **业务字段** | 客房提成 |
| **Domain Entity** | CommissionCost |
| **Database Field** | housekeeping_commission |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 客房提成录入 |
| **是否人工输入** | 是 |
| **是否计算** | 是 |
| **计算规则** | SUM(做房数量 × 提成标准 × 房型系数) |
| **房型系数** | 标准房=1, 双床=1.2, 浴缸房=1.5, 亲子房=2, 大床=2, 套房=2, 跨楼=1 |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 客房提成录入 → 客房提成呈现 |
| **确认状态** | ✅ 已确认 |

#### CommissionCost.totalCommissionCost (提成成本合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 提成成本合计 |
| **Domain Entity** | CommissionCost |
| **Database Field** | total_commission_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | SUM(各提成项) |
| **是否进入GOP** | 是 |
| **为何存在** | 提成成本总计，用于GOP计算 |

---

### 1.6 固定成本相关

#### FixedCost.rent (租金)

| 属性 | 值 |
|------|-----|
| **业务字段** | 租金 |
| **Domain Entity** | FixedCost |
| **Database Field** | rent |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 固定费用录入 |
| **是否人工输入** | 是 |
| **是否计算** | 是（日分摊） |
| **计算规则** | 月租金 / 当月天数 |
| **分摊方式** | MANUAL |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 固定费用录入 |
| **为何存在** | 酒店主要固定成本 |
| **确认状态** | ✅ 已确认 |

#### FixedCost.platformPromotionFee (平台推广费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 平台推广费 |
| **Domain Entity** | FixedCost |
| **Database Field** | platform_promotion_fee |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 平台推广费录入 |
| **是否人工输入** | 是 |
| **是否计算** | 是（日分摊） |
| **分摊方式** | MANUAL |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 平台推广费录入 |
| **包含项** | 美团、携程、抖音、去哪、同城、飞猪推广费 |
| **确认状态** | ✅ 已确认 |

#### FixedCost.otherFixedCost (其他固定成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 其他固定成本 |
| **Domain Entity** | FixedCost |
| **Database Field** | other_fixed_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 固定费用录入 |
| **是否人工输入** | 是 |
| **分摊方式** | MANUAL |
| **是否进入GOP** | 是 |
| **包含项** | 物业费、保险、网费、通讯费、社保公积金等 |
| **Excel来源Sheet** | 固定费用录入 |

#### FixedCost.totalFixedCost (固定成本合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 固定成本合计 |
| **Domain Entity** | FixedCost |
| **Database Field** | total_fixed_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | rent + platformPromotionFee + otherFixedCost |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 汇总表 |
| **为何存在** | 固定成本总计，用于GOP计算 |

---

### 1.7 能耗相关

#### Energy.electricityConsumption (电消耗量)

| 属性 | 值 |
|------|-----|
| **业务字段** | 电消耗量 |
| **Domain Entity** | Energy |
| **Database Field** | electricity_consumption |
| **数据类型** | Decimal(12,4) |
| **数据来源** | 能耗录入（电表读数） |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **是否计算** | 否 |
| **是否进入GOP** | 否（通过cost进入） |
| **Excel来源Sheet** | 能耗录入 |
| **Excel来源位置** | Row 5, 用量列 |
| **为何存在** | 电费计算基础 |
| **确认状态** | ✅ 已确认 |

#### Energy.electricityUnitPrice (电单价)

| 属性 | 值 |
|------|-----|
| **业务字段** | 电单价 |
| **Domain Entity** | Energy |
| **Database Field** | electricity_unit_price |
| **数据类型** | Decimal(10,4) |
| **数据来源** | 店长维护 |
| **是否人工输入** | 是 |
| **输入角色** | 店长 |
| **校验规则** | > 0 |
| **当前值** | 0.77 元/度 |
| **Excel来源Sheet** | 能耗录入 |
| **Excel来源位置** | Row 5, 单价列 |
| **为何存在** | 电费计算基础 |
| **确认状态** | ✅ 已确认 |

#### Energy.electricityCost (电费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 电费 |
| **Domain Entity** | Energy |
| **Database Field** | electricity_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | electricityConsumption × electricityUnitPrice |
| **是否进入GOP** | 是（计入变动成本） |
| **Excel来源Sheet** | 耗能呈现 |
| **为何存在** | 能耗成本是变动成本的一部分 |
| **确认状态** | ✅ 已确认 |

#### Energy.waterConsumption (水消耗量)

| 属性 | 值 |
|------|-----|
| **业务字段** | 水消耗量 |
| **Domain Entity** | Energy |
| **Database Field** | water_consumption |
| **数据类型** | Decimal(12,4) |
| **数据来源** | 能耗录入（水表读数） |
| **是否人工输入** | 是 |
| **当前值** | 5.3 元/吨 |
| **Excel来源Sheet** | 能耗录入 |
| **Excel来源位置** | Row 6 |
| **为何存在** | 水费计算基础 |
| **确认状态** | ✅ 已确认 |

#### Energy.waterUnitPrice (水单价)

| 属性 | 值 |
|------|-----|
| **业务字段** | 水单价 |
| **Domain Entity** | Energy |
| **Database Field** | water_unit_price |
| **数据类型** | Decimal(10,4) |
| **数据来源** | 店长维护 |
| **是否人工输入** | 是 |
| **校验规则** | > 0 |
| **当前值** | 5.3 元/吨 |
| **为何存在** | 水费计算基础 |
| **确认状态** | ✅ 已确认 |

#### Energy.waterCost (水费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 水费 |
| **Domain Entity** | Energy |
| **Database Field** | water_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | waterConsumption × waterUnitPrice |
| **是否进入GOP** | 是 |
| **为何存在** | 能耗成本的一部分 |
| **确认状态** | ✅ 已确认 |

#### Energy.gasConsumption (天然气消耗量)

| 属性 | 值 |
|------|-----|
| **业务字段** | 天然气消耗量 |
| **Domain Entity** | Energy |
| **Database Field** | gas_consumption |
| **数据类型** | Decimal(12,4) |
| **数据来源** | 能耗录入 |
| **是否人工输入** | 是 |
| **Excel来源Sheet** | 能耗录入 |
| **Excel来源位置** | Row 7（天然气） |
| **为何存在** | 天然气费计算基础 |
| **确认状态** | ⚠️ NEED_CONFIRMATION |

#### Energy.gasUnitPrice (天然气单价)

| 属性 | 值 |
|------|-----|
| **业务字段** | 天然气单价 |
| **Domain Entity** | Energy |
| **Database Field** | gas_unit_price |
| **数据类型** | Decimal(10,4) |
| **数据来源** | 店长维护 |
| **是否人工输入** | 是 |
| **校验规则** | > 0 |
| **Excel来源Sheet** | 能耗录入 |
| **为何存在** | 天然气费计算基础 |
| **确认状态** | ⚠️ NEED_CONFIRMATION（单价待确认） |

#### Energy.gasCost (天然气费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 天然气费 |
| **Domain Entity** | Energy |
| **Database Field** | gas_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | gasConsumption × gasUnitPrice |
| **是否进入GOP** | 是 |
| **为何存在** | 能耗成本的一部分 |
| **确认状态** | ⚠️ NEED_CONFIRMATION |

#### Energy.totalUtilityCost (能耗合计)

| 属性 | 值 |
|------|-----|
| **业务字段** | 能耗合计 |
| **Domain Entity** | Energy |
| **Database Field** | total_utility_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **是否计算** | 是 |
| **计算规则** | electricityCost + waterCost + gasCost |
| **是否进入GOP** | 是 |
| **Excel来源Sheet** | 汇总表 |
| **为何存在** | 能耗总成本，用于GOP计算 |
| **确认状态** | ✅ 已确认 |

---

### 1.8 库存相关

#### InventoryItem (库存物品)

| 属性 | 值 |
|------|-----|
| **Domain Entity** | InventoryItem |
| **业务含义** | 酒店库存物品明细 |
| **数据来源** | 各出入库录入 |
| **是否进入GOP** | 否（通过成本项进入） |
| **包含类别** | ROOM_SUPPLIES, FRONT_DESK_ITEMS, MERCHANDISE, RESTAURANT |
| **Excel来源Sheet** | 客房耗材/前台增值物品/商品/餐厅成本录入 |
| **为何存在** | 库存流转追踪，成本计算基础 |
| **确认状态** | ⚠️ NEED_CONFIRMATION（分类待确认） |

#### InventoryTransaction (出入库记录)

| 属性 | 值 |
|------|-----|
| **Domain Entity** | InventoryTransaction |
| **业务含义** | 库存物品进出记录 |
| **数据来源** | 各出入库录入 |
| **是否进入GOP** | 否（出库金额汇总后进入成本） |
| **类型** | IN（入库）/ OUT（出库） |
| **为何存在** | 追踪库存流转，支持成本计算 |

---

### 1.9 GOP相关

#### CalculationResult.totalRevenue (总收入)

| 属性 | 值 |
|------|-----|
| **业务字段** | 收入合计 |
| **Domain Entity** | CalculationResult |
| **Database Field** | total_revenue |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **计算规则** | 从 Revenue.totalRevenue |
| **是否进入GOP** | 是（分子） |
| **Excel来源Sheet** | 阿米巴核算表（日） |
| **为何存在** | GOP计算基础 |

#### CalculationResult.totalCost (总成本)

| 属性 | 值 |
|------|-----|
| **业务字段** | 总成本 |
| **Domain Entity** | CalculationResult |
| **Database Field** | total_cost |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **计算规则** | totalVariableCost + totalLaborCost + totalCommissionCost + totalFixedCost |
| **是否进入GOP** | 是（减项） |
| **Excel来源Sheet** | 阿米巴核算表（日） |
| **为何存在** | GOP计算基础 |
| **确认状态** | ✅ 已确认 |

#### CalculationResult.gop (经营利润)

| 属性 | 值 |
|------|-----|
| **业务字段** | GOP (Gross Operating Profit) |
| **Domain Entity** | CalculationResult |
| **Database Field** | gop |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 计算得出 |
| **计算规则** | totalRevenue - totalCost |
| **是否进入GOP** | 本身就是GOP |
| **Excel来源Sheet** | 阿米巴核算表（日） |
| **为何存在** | 核心经营指标 |
| **确认状态** | ✅ 已确认（来自慧友确认） |

#### CalculationResult.gopRate (GOP率)

| 属性 | 值 |
|------|-----|
| **业务字段** | GOP率 |
| **Domain Entity** | CalculationResult |
| **Database Field** | gop_rate |
| **数据类型** | Decimal(8,6) |
| **数据来源** | 计算得出 |
| **计算规则** | gop / totalRevenue |
| **是否进入GOP** | 否 |
| **Excel来源Sheet** | 阿米巴核算表（月） |
| **为何存在** | 反映盈利效率 |

---

### 1.10 目标相关

#### MonthlyTarget (月度目标)

| 属性 | 值 |
|------|-----|
| **业务字段** | 月度目标 |
| **Domain Entity** | MonthlyTarget |
| **Database Fields** | revenue_target, cost_target, gop_target |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入 |
| **是否人工输入** | 是 |
| **输入角色** | 店长/总监 |
| **是否进入GOP** | 否（作为对比基准） |
| **是否进入运营部** | 是（业绩预定） |
| **Excel来源Sheet** | 运营部日核算表 |
| **为何存在** | 月度业绩基准，用于差异分析 |
| **分配规则** | ⚠️ NEED_CONFIRMATION |

#### WeeklyTarget (周目标)

| 属性 | 值 |
|------|-----|
| **业务字段** | 周目标 |
| **Domain Entity** | WeeklyTarget |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入或月目标分配 |
| **分配规则** | ⚠️ NEED_CONFIRMATION |
| **为何存在** | 周度业绩追踪 |

#### DailyTarget (日目标)

| 属性 | 值 |
|------|-----|
| **业务字段** | 日目标 |
| **Domain Entity** | DailyTarget |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 手工录入或月目标分配 |
| **分配规则** | ⚠️ NEED_CONFIRMATION |
| **Excel来源Sheet** | 阿米巴核算表（日）预定业绩 |
| **为何存在** | 日核算对比基准 |

---

### 1.11 管理费相关

#### ManagementFee (总部管理费)

| 属性 | 值 |
|------|-----|
| **业务字段** | 总部管理费 |
| **Domain Entity** | ManagementFee |
| **Database Fields** | monthly_target, management_fee_rate, monthly_management_fee |
| **数据类型** | Decimal(12,2) |
| **数据来源** | 合同约定 |
| **计算规则** | monthlyTarget × managementFeeRate |
| **是否进入GOP** | **否（独立指标）** |
| **是否进入运营部** | 是 |
| **Excel来源Sheet** | 运营部日核算表 |
| **Excel来源位置** | 管理费预定列 |
| **为何存在** | 慧友确认：管理费与GOP无关，必须独立指标 |
| **确认状态** | ✅ 已确认 |

---

### 1.12 审核状态相关

#### DailyOperation.status (日核算状态)

| 属性 | 值 |
|------|-----|
| **业务字段** | 日核算状态 |
| **Domain Entity** | DailyOperation |
| **Database Field** | status |
| **数据类型** | Enum |
| **枚举值** | DRAFT, SUBMITTED, REJECTED, APPROVED |
| **状态流转** | DRAFT → SUBMITTED → APPROVED/REJECTED |
| **是否人工输入** | 否（系统状态机） |
| **输入角色** | 店长(提交)/总监(审核) |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是（审核后才汇总） |
| **校验规则** | 必须符合状态机 |
| **AuditLog** | 所有状态变化必须记录 |
| **为何存在** | 控制数据流程，确保数据质量 |
| **确认状态** | ✅ 已确认 |

#### DailyOperation.submissionDeadline (提交截止时间)

| 属性 | 值 |
|------|-----|
| **业务字段** | 提交截止时间 |
| **Domain Entity** | DailyOperation |
| **Database Field** | submission_deadline |
| **数据类型** | DateTime |
| **计算规则** | businessDate + 1 day 18:00 |
| **是否人工输入** | 否（系统计算） |
| **为何存在** | 确保店长按时提交核算 |
| **重要约束** | 必须基于businessDate，不能用createdAt+24h |
| **确认状态** | ✅ 已确认 |

---

### 1.13 异常相关

#### CalculationResult.isRevenueAnomaly (收入异常标记)

| 属性 | 值 |
|------|-----|
| **业务字段** | 收入异常标记 |
| **Domain Entity** | CalculationResult |
| **Database Field** | is_revenue_anomaly |
| **数据类型** | Boolean |
| **数据来源** | 计算得出 |
| **计算规则** | actualRevenue < expectedRevenue × 0.95 |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是（标记） |
| **校验规则** | 差异超过5% |
| **为何存在** | 提醒店长收入异常 |
| **第一版约束** | 使用确定性规则，不使用AI |
| **确认状态** | ✅ 已确认 |

#### CalculationResult.isCostAnomaly (成本异常标记)

| 属性 | 值 |
|------|-----|
| **业务字段** | 成本异常标记 |
| **Domain Entity** | CalculationResult |
| **Database Field** | is_cost_anomaly |
| **数据类型** | Boolean |
| **数据来源** | 计算得出 |
| **计算规则** | actualCost > expectedCost |
| **是否进入GOP** | 否 |
| **是否进入运营部** | 是（标记） |
| **为何存在** | 提醒店长成本超支 |
| **第一版约束** | 使用确定性规则，不使用AI |
| **确认状态** | ✅ 已确认 |

#### Anomaly (异常记录)

| 属性 | 值 |
|------|-----|
| **业务字段** | 异常记录 |
| **Domain Entity** | Anomaly |
| **类型** | REVENUE / COST |
| **严重级别** | WARNING / ERROR |
| **字段** | expectedValue, actualValue, deviation, deviationRate |
| **状态** | PENDING / ACKNOWLEDGED / RESOLVED |
| **为何存在** | 追踪异常处理流程 |

---

## 二、日分摊相关

### 分摊配置 (AllocationConfig)

| 属性 | 值 |
|------|-----|
| **Domain Entity** | AllocationConfig |
| **业务含义** | 成本分摊方式配置 |
| **分摊方式** | ROOM_COUNT / DAILY_USAGE / MANUAL |
| **ROOM_COUNT专用** | roomCountType: TOTAL / AVAILABLE / OCCUPIED |
| **MANUAL专用** | manualValue / manualRatio |
| **是否进入GOP** | 否（配置） |
| **为何存在** | 实现分摊规则可配置化 |
| **确认状态** | ⚠️ NEED_CONFIRMATION（房间数定义） |

### 日分摊计算示例

```
前台日工资分摊 = 月工资总额 / 当月天数 × (当日入住间数 / 基准房间数)
                = 4500 / 30 × (91 / 133)
                = 102.58 元
```

---

## 三、字段状态汇总

### 按确认状态

| 状态 | 数量 | 说明 |
|------|------|------|
| ✅ 已确认 | 28 | 慧友已确认的业务规则 |
| ⚠️ NEED_CONFIRMATION | 12 | 需向慧友确认 |

### 按是否进入GOP

| 分类 | 数量 |
|------|------|
| 进入GOP | 18 |
| 不进入GOP（指标/配置） | 22 |

### 按数据来源

| 来源 | 数量 |
|------|------|
| 人工录入 | 15 |
| 计算得出 | 12 |
| 系统配置 | 3 |

---

## 四、NEED_CONFIRMATION 清单

| # | 字段/规则 | 问题 | 优先级 | 影响范围 |
|---|----------|------|--------|----------|
| 1 | 房间数定义 | ROOM_COUNT分摊使用哪个房间数？ | P1 | 所有人工成本日分摊 |
| 2 | 天然气单价 | gasUnitPrice 值是多少？ | P2 | gasCost计算 |
| 3 | 日目标分配规则 | 月→日目标如何分配？ | P2 | DailyTarget |
| 4 | 日管理费分配 | 月管理费如何分配到日？ | P2 | 日核算管理费对比 |
| 5 | Excel Sheet映射 | 17个Sheet的成本分类确认 | P1 | 全部成本数据 |
| 6 | 餐厅成本分类 | 餐厅成本算变动成本还是人工？ | P2 | 成本结构 |
| 7 | 用餐人数录入 | 属于收入还是成本？ | P2 | 数据分类 |
| 8 | 物业费等固定费 | 是否全部计入固定成本？ | P2 | 成本结构 |

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
*Phase: 1.6 完成*
