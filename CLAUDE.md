# 慧友酒店经营核算平台 (Huiyou Hotel Accounting Platform)

## 项目概述

这是一个真实酒店管理公司的数字化试点项目。第一阶段目标是：
- 龙口悦致酒店（试点）
- 区域运营总监视角
- 自动核算
- 区域汇总

## 技术栈

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui
- Prisma ORM
- PostgreSQL

## 架构原则

1. **单体应用优先** - 不做过度设计
2. **模块化设计** - 核心计算逻辑独立于 UI
3. **Excel 是数据来源和导出格式** - 不是数据库设计依据
4. **业务规则优先** - 不确定时记录为 TODO/ASSUMPTION

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 仪表盘（需登录）
│   └── api/               # API 路由
├── components/
│   ├── ui/                # shadcn/ui 组件
│   └── business/           # 业务组件
├── lib/
│   ├── db.ts              # Prisma 客户端
│   ├── auth/               # 认证逻辑
│   └── accounting/         # 核算核心逻辑（独立于 UI）
├── tests/
│   └── accounting/         # 核算逻辑测试
└── docs/                   # 文档
```

## 关键约束

1. **禁止**: 直接把 Excel Sheet 设计成数据库表
2. **禁止**: 擅自改变慧友现有业务规则
3. **必须**: 核心计算有自动化测试
4. **必须**: 保留 audit log
5. **必须**: 所有计算可追溯

## 开发流程

1. 分析 Excel 业务规则
2. 提取为独立计算逻辑（纯函数）
3. 编写单元测试
4. 开发 UI 界面
5. 集成测试

## 决策原则

- 不确定的业务规则 → 记录为 TODO/ASSUMPTION
- 架构决策变更 → 记录到 decision-log.md
- 业务逻辑变更 → 记录到 business-rules.md
