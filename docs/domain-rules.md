# Domain Rules

## 已确认规则 (Confirmed Rules)

---

### R1: GOP 计算规则

| 字段 | 内容 |
|------|------|
| **Rule ID** | R1 |
| **Rule Name** | GOP计算 |
| **业务含义** | 经营利润（Gross Operating Profit） |
| **输入** | totalRevenue, totalCost |
| **输出** | gop, gopRate |
| **公式** | `gop = totalRevenue - totalCost`<br>`gopRate = gop / totalRevenue` |
| **数据来源** | 计算得出 |
| **适用角色** | 店长、区域总监 |
| **适用范围** | 每日/每月 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **测试案例** | 输入: revenue=100000, totalCost=80000<br>输出: gop=20000, gopRate=0.2 |

---

### R2: 总成本计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R2 |
| **Rule Name** | 总成本计算 |
| **业务含义** | 酒店全部成本合计 |
| **输入** | variableCost, laborCost, commissionCost, fixedCost |
| **输出** | totalCost |
| **公式** | `totalCost = variableCost + laborCost + commissionCost + fixedCost` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R3: 收入合计

| 字段 | 内容 |
|------|------|
| **Rule ID** | R3 |
| **Rule Name** | 收入合计 |
| **业务含义** | 酒店收入总计 |
| **输入** | roomRevenue, minibarRevenue, foodRevenue, otherRevenue |
| **输出** | totalRevenue |
| **公式** | `totalRevenue = roomRevenue + minibarRevenue + foodRevenue + otherRevenue` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R4: 出租率计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R4 |
| **Rule Name** | 出租率 |
| **业务含义** | 客房出租比例 |
| **输入** | occupiedRooms, availableRooms |
| **输出** | occupancyRate |
| **公式** | `occupancyRate = occupiedRooms / availableRooms` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R5: 平均房价计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R5 |
| **Rule Name** | 平均房价 (ADR) |
| **业务含义** | 已售客房平均价格 |
| **输入** | roomRevenue, occupiedRooms |
| **输出** | avgRoomRate |
| **公式** | `avgRoomRate = roomRevenue / occupiedRooms` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R6: RevPar 计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R6 |
| **Rule Name** | RevPar |
| **业务含义** | 每可供房收入 |
| **输入** | roomRevenue, availableRooms |
| **输出** | revpar |
| **公式** | `revpar = roomRevenue / availableRooms` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R7: 日电费计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R7 |
| **Rule Name** | 日电费计算 |
| **业务含义** | 每日电费 |
| **输入** | electricityConsumption, electricityUnitPrice |
| **输出** | electricityCost |
| **公式** | `electricityCost = electricityConsumption × electricityUnitPrice` |
| **数据来源** | 能耗录入，店长维护单价 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R8: 日水费计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R8 |
| **Rule Name** | 日水费计算 |
| **业务含义** | 每日水费 |
| **输入** | waterConsumption, waterUnitPrice |
| **输出** | waterCost |
| **公式** | `waterCost = waterConsumption × waterUnitPrice` |
| **数据来源** | 能耗录入，店长维护单价 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R9: 能耗合计计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R9 |
| **Rule Name** | 能耗合计 |
| **业务含义** | 水、电、天然气的总费用 |
| **输入** | electricityCost, waterCost, gasCost |
| **输出** | totalUtilityCost |
| **公式** | `totalUtilityCost = electricityCost + waterCost + gasCost` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R10: 日工资分摊

| 字段 | 内容 |
|------|------|
| **Rule ID** | R10 |
| **Rule Name** | 日工资分摊 |
| **业务含义** | 将月工资按出勤天数分摊到每日 |
| **输入** | totalSalary, attendanceDays |
| **输出** | dailyWage |
| **公式** | `dailyWage = totalSalary / attendanceDays` |
| **数据来源** | 工资录入 |
| **是否已确认** | ⚠️ NEED_CONFIRMATION - 分摊基准需要确认 |
| **待确认** | "按房间数分摊"中房间数的定义 |

---

### R11: 前台好评提成

| 字段 | 内容 |
|------|------|
| **Rule ID** | R11 |
| **Rule Name** | 前台好评提成 |
| **业务含义** | 前台员工好评提成 |
| **输入** | reviewCount, unitPrice |
| **输出** | reviewCommission |
| **公式** | `reviewCommission = reviewCount × unitPrice` |
| **数据来源** | 前台好评提成录入 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R12: 前台二维码提成

| 字段 | 内容 |
|------|------|
| **Rule ID** | R12 |
| **Rule Name** | 前台二维码提成 |
| **业务含义** | 前台二维码服务提成 |
| **输入** | serviceCount, unitPrice |
| **输出** | qrCommission |
| **公式** | `qrCommission = serviceCount × unitPrice` |
| **数据来源** | 前台二维码提成录入 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R13: 会员卡提成

| 字段 | 内容 |
|------|------|
| **Rule ID** | R13 |
| **Rule Name** | 会员卡提成 |
| **业务含义** | 会员卡推广提成 |
| **输入** | cardCount, unitPrice |
| **输出** | memberCardCommission |
| **公式** | `memberCardCommission = cardCount × unitPrice` |
| **数据来源** | 会员卡提成录入 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |

---

### R14: 客房提成

| 字段 | 内容 |
|------|------|
| **Rule ID** | R14 |
| **Rule Name** | 客房提成 |
| **业务含义** | 客房清洁提成 |
| **输入** | roomCount, commissionRate, roomTypeMultiplier |
| **输出** | housekeepingCommission |
| **公式** | `housekeepingCommission = roomCount × commissionRate × roomTypeMultiplier` |
| **数据来源** | 客房提成录入 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **房型系数** | 标准房=1, 双床=1.2, 浴缸房=1.5, 亲子房=2, 大床=2, 套房=2, 跨楼=1 |

---

### R15: 提交截止时间

| 字段 | 内容 |
|------|------|
| **Rule ID** | R15 |
| **Rule Name** | 提交截止时间 |
| **业务含义** | 营业日次日18:00前提交 |
| **输入** | businessDate |
| **输出** | submissionDeadline |
| **公式** | `submissionDeadline = businessDate + 1 day 18:00` |
| **数据来源** | 系统计算 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **重要约束** | 必须基于 businessDate，不能使用 createdAt + 24 hours |

---

### R16: 收入异常检测

| 字段 | 内容 |
|------|------|
| **Rule ID** | R16 |
| **Rule Name** | 收入异常检测 |
| **业务含义** | 检测实际收入是否低于预期 |
| **输入** | actualRevenue, expectedRevenue |
| **输出** | isRevenueAnomaly |
| **公式** | `isRevenueAnomaly = actualRevenue < expectedRevenue × 0.95` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **重要约束** | 第一版使用确定性规则，不使用 AI |

---

### R17: 成本异常检测

| 字段 | 内容 |
|------|------|
| **Rule ID** | R17 |
| **Rule Name** | 成本异常检测 |
| **业务含义** | 检测实际成本是否超过预期 |
| **输入** | actualCost, expectedCost |
| **输出** | isCostAnomaly |
| **公式** | `isCostAnomaly = actualCost > expectedCost` |
| **数据来源** | 计算得出 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **重要约束** | 第一版使用确定性规则，不使用 AI |

---

### R18: 总部管理费计算

| 字段 | 内容 |
|------|------|
| **Rule ID** | R18 |
| **Rule Name** | 总部管理费计算 |
| **业务含义** | 总部按比例收取的管理费 |
| **输入** | monthlyTarget, managementFeeRate |
| **输出** | monthlyManagementFee |
| **公式** | `monthlyManagementFee = monthlyTarget × managementFeeRate` |
| **数据来源** | 合同约定 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **重要约束** | **与 GOP 无关，不计入 GOP，必须作为独立指标** |

---

### R19: 状态流转 - 提交

| 字段 | 内容 |
|------|------|
| **Rule ID** | R19 |
| **Rule Name** | 提交操作 |
| **业务含义** | 店长提交日核算 |
| **输入** | 当前状态=DRAFT |
| **输出** | 新状态=SUBMITTED |
| **触发条件** | 店长点击提交 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **副作用** | 记录 AuditLog |

---

### R20: 状态流转 - 审核通过

| 字段 | 内容 |
|------|------|
| **Rule ID** | R20 |
| **Rule Name** | 审核通过 |
| **业务含义** | 总监审核通过 |
| **输入** | 当前状态=SUBMITTED |
| **输出** | 新状态=APPROVED |
| **触发条件** | 总监点击通过 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **副作用** | 记录 AuditLog |

---

### R21: 状态流转 - 驳回

| 字段 | 内容 |
|------|------|
| **Rule ID** | R21 |
| **Rule Name** | 审核驳回 |
| **业务含义** | 总监驳回日核算 |
| **输入** | 当前状态=SUBMITTED |
| **输出** | 新状态=REJECTED，然后可返回 DRAFT |
| **触发条件** | 总监点击驳回，需要填写原因 |
| **是否已确认** | ✅ 已确认 - 来自慧友确认 |
| **副作用** | 记录 AuditLog |

---

## 待确认规则 (NEED_CONFIRMATION)

---

### R10-NC: 日分摊基准

| 字段 | 内容 |
|------|------|
| **Rule ID** | R10-NC |
| **Rule Name** | 日分摊的房间数定义 |
| **问题** | "按房间数分摊"中，具体是哪个房间数？ |
| **候选** | totalRooms (133) / availableRooms / occupiedRooms |
| **影响** | 影响 LaborCost 日分摊计算 |
| **状态** | 🔴 NEED_CONFIRMATION - 不得自行猜测 |

---

### R22-NC: 天然气单价

| 字段 | 内容 |
|------|------|
| **Rule ID** | R22-NC |
| **Rule Name** | 天然气单价 |
| **问题** | 天然气费的单价是多少？ |
| **候选** | 未知 |
| **影响** | 影响 gasCost 计算 |
| **状态** | 🟡 NEED_CONFIRMATION |

---

### R23-NC: 日目标分配规则

| 字段 | 内容 |
|------|------|
| **Rule ID** | R23-NC |
| **Rule Name** | 日目标分配 |
| **问题** | 月度目标如何分配到日？ |
| **候选** | 平均分配 / 按天数比例 / 其他 |
| **影响** | 影响 DailyTarget 计算 |
| **状态** | 🟡 NEED_CONFIRMATION |

---

### R24-NC: 日管理费分配

| 字段 | 内容 |
|------|------|
| **Rule ID** | R24-NC |
| **Rule Name** | 日管理费分配 |
| **问题** | 月度管理费如何分配到日？ |
| **候选** | 平均分配 / 按天数比例 |
| **影响** | 影响日核算管理费对比 |
| **状态** | 🟡 NEED_CONFIRMATION |

---

## 规则状态汇总

| 状态 | 数量 |
|------|------|
| ✅ 已确认 | 19 |
| ⚠️ NEED_CONFIRMATION | 4 |
| **总计** | **23** |

---

*文档版本: 1.0*
*生成日期: 2026-08-31*
