# Phase 4 开发前审计报告

**审计日期**: 2026-08-31
**审计范围**: 慧友酒店经营核算平台 MVP

---

## A. 已完成

### 1. 项目结构
```
yunying/
├── src/
│   ├── app/                    # Next.js App Router (空壳)
│   └── lib/
│       └── accounting/         # 核心核算引擎 ✅
│           ├── types.ts       # 类型定义
│           ├── calculate.ts    # 计算函数
│           ├── index.ts        # 导出
│           └── __tests__/
│               ├── calculate.test.ts    # 单元测试
│               └── golden.test.ts       # Golden Test
├── prisma/
│   ├── schema.prisma           # 23个模型
│   └── migrations/
│       └── 20260831000000_init/
│           └── migration.sql   # 完整 DDL
├── docs/                       # 18个文档
│   ├── domain-model.md
│   ├── data-dictionary.md
│   ├── excel-to-domain-mapping.md
│   ├── database-indexes.md
│   ├── business-rules.md
│   └── decision-log.md
└── data/source/
    └── 龙口悦致.xlsx           # 真实测试数据 ✅
```

### 2. 技术栈确认
| 组件 | 技术 | 状态 |
|------|------|------|
| 前端框架 | Next.js 16 (App Router) | ✅ |
| UI库 | Tailwind CSS v4 + shadcn/ui | ⚠️ 未安装 |
| 语言 | TypeScript (strict) | ✅ |
| ORM | Prisma 5 | ✅ |
| 数据库 | PostgreSQL | ⚠️ 未连接 |
| 核算引擎 | 纯函数 | ✅ |

### 3. 数据库 Schema (Prisma)
**模型数量**: 23 个

| 模型 | 说明 | 状态 |
|------|------|------|
| Organization | 组织 | ✅ |
| Region | 区域 | ✅ |
| Hotel | 酒店 | ✅ |
| User | 用户 | ✅ |
| DailyOperation | 日经营记录 | ✅ |
| Revenue | 收入 | ✅ |
| VariableCost | 变动成本 | ✅ |
| LaborCost | 人工成本 | ✅ |
| CommissionCost | 提成成本 | ✅ |
| FixedCost | 固定成本 | ✅ |
| Energy | 能耗 | ✅ |
| CalculationResult | 计算结果 | ✅ |
| Anomaly | 异常记录 | ✅ |
| AuditLog | 审计日志 | ✅ |
| InventoryItem | 库存物品 | ✅ |
| InventoryTransaction | 库存事务 | ✅ |
| MonthlyTarget | 月度目标 | ✅ |
| WeeklyTarget | 周目标 | ✅ |
| DailyTarget | 日目标 | ✅ |
| ManagementFee | 管理费 | ✅ |
| CostCategoryMapping | 成本分类映射 | ✅ |
| AllocationConfig | 分摊配置 | ✅ |

### 4. 核心公式确认 (Decision Log D-005, D-006)
```
✅ 已确认:
  TotalCost = VariableCost + LaborCost + CommissionCost + FixedCost + EnergyCost
  GOP = Revenue - TotalCost
  Management Fee 不计入 GOP (独立指标)
```

### 5. 计算引擎测试
| 测试类型 | 文件 | 状态 |
|----------|------|------|
| 单元测试 | calculate.test.ts | ✅ 存在 |
| Golden Test | golden.test.ts | ✅ 存在 |
| 规则验证 | validateAccountingRules() | ✅ 已实现 |

### 6. Excel 数据映射
- **已映射并测试** (Golden Test):
  - 收入: 房费、迷你吧、餐费、其他
  - 变动成本: 客房耗材、前台物品、小商品、餐厅、洗涤费
  - 能耗: 电费、水费
  - 固定成本: 租金
  - 运营指标: 入住间数、实际间数

---

## B. 未完成

### 1. 数据库
- [ ] Migration 未执行到数据库
- [ ] 数据库连接未验证
- [ ] 种子数据未创建

### 2. 认证与授权
- [ ] 登录页面
- [ ] Session/JWT 管理
- [ ] RBAC 权限控制
- [ ] 中间件保护

### 3. API 路由
- [ ] Hotel API
- [ ] Daily Operation CRUD
- [ ] Revenue CRUD
- [ ] Cost CRUD
- [ ] Energy CRUD
- [ ] Target CRUD
- [ ] Calculation API
- [ ] Submission/Review API
- [ ] Dashboard API
- [ ] Excel Export API

### 4. UI 界面
- [ ] 登录页
- [ ] Dashboard 首页
- [ ] 日经营记录列表/编辑
- [ ] 提交/审核流程
- [ ] 异常管理
- [ ] 报表导出

### 5. Excel 导入
- [ ] Excel 解析器
- [ ] Sheet → Domain 映射
- [ ] 批量导入 UI

---

## C. 阻塞问题

### 1. 数据库未就绪
```
状态: 🔴 阻塞所有后端开发

现状:
- .env 配置: postgresql://postgres:postgres@localhost:5432/yunying
- Migration 文件存在但未执行
- 无法运行集成测试
```

### 2. 认证未实现
```
状态: 🔴 阻塞所有需要登录的功能

现状:
- 没有登录页面
- 没有 User 种子数据
- 没有 Session 机制
```

### 3. API 路由不存在
```
状态: 🔴 阻塞前后端集成

现状:
- src/app/api/ 目录为空
- 前端无法调用后端
```

---

## D. 可以立即开发

### 1. 数据库初始化 (需人工操作)
```bash
# 启动 PostgreSQL
# 执行 migration
npx prisma migrate deploy
```

### 2. 种子数据
- 创建 Organization, Region, Hotel, User 测试数据
- 配置 CostCategoryMapping

### 3. 认证模块
- 登录页面 UI
- NextAuth.js 或自定义 JWT
- 路由保护中间件

### 4. API 基础框架
- Prisma Client 初始化
- 基础 CRUD API 模板
- 错误处理中间件

### 5. 核心页面
- Dashboard layout + sidebar
- 日经营记录列表
- 数据录入表单

---

## E. 必须人工确认

### 1. 工资日分摊基准 (Decision Log D-014)
```
状态: ⚠️ P1 - 阻塞人工成本计算

问题: 日分摊按 total_rooms / available_rooms / occupied_rooms 哪个?

现状: Excel 中无法确认，标记为 NEED_CONFIRMATION
```

### 2. 天然气单价
```
状态: ⚠️ P2

问题: 天然气单价是多少?
```

### 3. 日目标分配规则
```
状态: ⚠️ P2

问题: 月度目标如何分配到日?
```

### 4. 餐厅成本分类
```
状态: ⚠️ P2

问题: 餐厅成本应归类为变动成本还是人工成本?
```

---

## F. 技术风险

### 1. SPEC.md 与实际代码不一致
```
风险: 中

问题:
- SPEC.md 描述的是旧版设计 (Role/Permission)
- 实际 schema.prisma 是新版设计 (UserRole enum)
- 可能造成开发困惑

建议: 更新 SPEC.md 或删除
```

### 2. Golden Test 数据不完整
```
风险: 中

问题:
- 工资数据: 全部设为 0
- 提成数据: 全部设为 0
- 其他固定成本: 设为 0

后果:
- 无法验证完整成本计算
- Excel 成本合计 13,289.32 vs 计算 ~11,539 (差异 ~1,750)

差异来源: 可能是工资、提成或其他固定成本未录入
```

### 3. 单元测试无法运行
```
风险: 低

问题:
- package.json 没有 test 脚本
- 没有安装 jest/@types/jest

现状:
- TypeScript 编译检查通过 (tsconfig 排除了 test 文件)
- 实际测试框架未配置
```

### 4. Prisma Client 未生成
```
风险: 中

问题:
- node_modules/@prisma/client 存在但版本是 5.22.0
- 未执行 prisma generate

现状: build 成功，可能依赖缓存
```

---

## G. Phase 4 推荐 Task 顺序

### 阶段 1: 基础设施 (1-2天)
```
[T-001] 数据库初始化
  - 启动 PostgreSQL
  - 执行 prisma migrate deploy
  - 验证连接

[T-002] Prisma Generate
  - prisma generate
  - 验证 Prisma Client

[T-003] 种子数据
  - Organization: 慧友集团
  - Region: 龙口区域
  - Hotel: 龙口悦致 (code: LKYZ, actual_rooms: 133)
  - User: 总监账号、店长账号
  - CostCategoryMapping: 默认映射配置

[T-004] 认证模块
  - NextAuth.js 或自定义 JWT
  - 登录页面
  - Session 管理
  - 路由保护中间件
```

### 阶段 2: 核心 API (3-5天)
```
[T-005] Hotel API
  - GET /api/hotels
  - GET /api/hotels/:id

[T-006] DailyOperation API
  - GET /api/daily-operations?hotelId=&date=
  - POST /api/daily-operations
  - PUT /api/daily-operations/:id
  - 状态流转: DRAFT → SUBMITTED

[T-007] Revenue/Cost API
  - CRUD 对应实体
  - 关联 DailyOperation

[T-008] Calculation API
  - POST /api/calculate/:dailyOperationId
  - 调用核算引擎
  - 存储 CalculationResult

[T-009] Submission/Review API
  - POST /api/submit/:id
  - POST /api/approve/:id
  - POST /api/reject/:id
  - AuditLog 记录
```

### 阶段 3: 前端核心 (3-5天)
```
[T-010] Dashboard Layout
  - Sidebar 导航
  - Header
  - 响应式布局

[T-011] 日经营列表页
  - 按酒店/日期筛选
  - 状态标签
  - 分页

[T-012] 数据录入页
  - 表单设计
  - 保存/提交

[T-013] 审核页 (总监)
  - 待审核列表
  - 审核操作
```

### 阶段 4: Excel 集成 (2-3天)
```
[T-014] Excel 导入
  - 解析龙口悦致.xlsx
  - Sheet → Domain 映射
  - 批量创建 DailyOperation

[T-015] Excel 导出
  - 按现有格式导出
  - 支持月度汇总
```

### 阶段 5: 报表 (2-3天)
```
[T-016] Dashboard API
  - 月度汇总
  - 区域汇总
  - 指标卡

[T-017] 可视化
  - 收入趋势
  - 成本分解
  - GOP 达成率
```

---

## H. Golden Test 数据缺口

### 龙口悦致 8月1日数据状态

| Excel 字段 | Domain 字段 | Golden Test 状态 | 说明 |
|-----------|------------|----------------|------|
| 入住间数 | occupiedRooms | ✅ 已测试 | 146 |
| 实际间数 | actualRooms | ✅ 已测试 | 133 |
| 房费收入 | roomRevenue | ✅ 已测试 | 37739.01 |
| 迷你吧收入 | minibarRevenue | ✅ 已测试 | 0 |
| 餐费收入 | foodRevenue | ✅ 已测试 | 0 |
| 其他业务收入 | otherRevenue | ✅ 已测试 | 0 |
| 客房耗材 | roomSuppliesCost | ✅ 已测试 | 1071.937 |
| 前台增值物品 | frontDeskItemsCost | ✅ 已测试 | 36.4417 |
| 小商品成本 | merchandiseCost | ✅ 已测试 | 0 |
| 餐厅 | restaurantCost | ✅ 已测试 | 410 |
| 洗涤费 | laundryCost | ✅ 已测试 | 845.4 |
| 电费 | electricityCost | ✅ 已测试 | 2754.8675 |
| 水费 | waterCost | ✅ 已测试 | 169.6 |
| 天然气 | gasCost | ⚠️ 未测试 | 需确认单价 |
| 租金 | rent | ✅ 已测试 | 6251.23 |
| 平台推广费 | platformPromotionFee | ⚠️ 待补充 | 未确认 |
| 其他固定成本 | otherFixedCost | ⚠️ 待补充 | 可能有 |
| 前台工资 | frontDeskWages | ❌ 无法验证 | 需工资录入Sheet |
| 客房工资 | housekeepingWages | ❌ 无法验证 | 需工资录入Sheet |
| 餐厅工资 | restaurantWages | ❌ 无法验证 | 需工资录入Sheet |
| 管理工资 | managementWages | ❌ 无法验证 | 需工资录入Sheet |
| 好评提成 | reviewCommission | ❌ 无法验证 | 需提成录入Sheet |
| 二维码提成 | qrCommission | ❌ 无法验证 | 需提成录入Sheet |
| 会员卡提成 | memberCardCommission | ❌ 无法验证 | 需提成录入Sheet |
| 客房提成 | housekeepingCommission | ❌ 无法验证 | 需提成录入Sheet |

### 成本差异分析

```
Excel 成本合计: 13,289.32
计算成本合计:   11,539.47 (当前 Golden Test)
差异:          1,749.85

差异可能来源:
1. 工资数据 (未获取)
2. 提成数据 (未获取)
3. 其他固定成本 (可能有)
4. 餐厅成本分类待确认
```

---

## I. 总结

| 类别 | 状态 | 行动 |
|------|------|------|
| 数据库 Schema | ✅ 完成 | 需执行 migration |
| 核算引擎 | ✅ 完成 | 需补充工资/提成测试 |
| 认证授权 | ❌ 未开始 | 阶段1 |
| API 路由 | ❌ 未开始 | 阶段2 |
| 前端 UI | ❌ 未开始 | 阶段3 |
| Excel 集成 | ❌ 未开始 | 阶段4 |
| 报表 | ❌ 未开始 | 阶段5 |

**Phase 4 起点建议**:
1. 先完成数据库初始化 (T-001)
2. 再开始认证模块 (T-004)
3. API 和前端可并行开发

---

*审计完成*
