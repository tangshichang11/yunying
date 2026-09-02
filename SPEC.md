# 运营管理系统 - 技术规范

## 1. 项目概述

- **项目名称**: 运营管理系统 (yunying)
- **项目类型**: Next.js 14+ Web 应用
- **核心功能**: 运营管理系统基础框架，包含登录、布局、权限控制
- **技术栈**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL

## 2. 技术架构

### 框架与工具
- **Next.js 14+**: App Router
- **TypeScript**: 严格模式
- **Tailwind CSS**: 工具类样式
- **shadcn/ui**: UI 组件库
- **Prisma**: ORM
- **PostgreSQL**: 数据库

### 项目结构
```
yunying/
├── prisma/
│   └── schema.prisma      # 数据库 schema
├── src/
│   ├── app/
│   │   ├── (auth)/         # 认证路由组
│   │   │   └── login/      # 登录页
│   │   ├── (dashboard)/     # 仪表盘路由组
│   │   │   ├── layout.tsx  # 仪表盘布局（含 Sidebar）
│   │   │   └── page.tsx    # 首页
│   │   ├── api/            # API 路由
│   │   ├── globals.css
│   │   └── layout.tsx      # 根布局
│   ├── components/
│   │   ├── ui/             # shadcn/ui 组件
│   │   ├── sidebar.tsx     # 侧边栏
│   │   └── providers.tsx   # Providers
│   ├── lib/
│   │   ├── db.ts           # Prisma 客户端
│   │   ├── auth.ts         # 认证工具
│   │   └── utils.ts        # 工具函数
│   ├── middleware.ts       # 权限中间件
│   └── types/              # 类型定义
├── .env.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 3. 功能清单

### 3.1 数据库连接
- Prisma Schema 定义
- 用户表 (User) - id, email, password, name, role, createdAt, updatedAt
- 角色表 (Role) - id, name, permissions, createdAt, updatedAt
- 权限枚举 (Permission)

### 3.2 登录功能
- 登录页面 `/login`
- 邮箱/密码认证
- Session/JWT 令牌管理
- 登录错误处理

### 3.3 基础布局
- 根布局 (html, body)
- 仪表盘布局 (包含 Sidebar)
- 响应式设计

### 3.4 侧边栏 (Sidebar)
- Logo/品牌
- 导航菜单
- 用户信息
- 退出登录
- 折叠/展开

### 3.5 权限中间件
- 路由保护
- 基于角色的访问控制 (RBAC)
- 未登录重定向到登录页

## 4. 数据模型

### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      Role     @relation(fields: [roleId], references: [id])
  roleId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Role
```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### Permission (Enum)
```prisma
enum Permission {
  DASHBOARD_VIEW
  USERS_VIEW
  USERS_CREATE
  USERS_EDIT
  USERS_DELETE
  ACCOUNTING_VIEW
  ACCOUNTING_EDIT
}
```

## 5. 路由与权限

| 路由 | 权限 |
|------|------|
| /login | 公开 |
| / | 需登录 |
| /api/* | 需登录 |

## 6. 视觉设计

- **配色**: 使用 shadcn/ui 默认主题
- **字体**: Inter (Google Fonts)
- **组件**: shadcn/ui Button, Input, Card, Avatar, DropdownMenu
