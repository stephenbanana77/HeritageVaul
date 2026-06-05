# 非遗博物馆藏品管理系统

## 技术栈
- 前端：React 18 + Ant Design 5 + React Router 6 + Recharts + xlsx
- 后端：Node.js + Express.js + JWT 认证
- 数据库：MySQL 8.0

## 项目结构
```
museum-system/
├── database/           数据库脚本
│   ├── schema.sql      建表语句（9张表）
│   └── seed.sql        测试数据（50件藏品 + 完整业务数据）
├── backend/            后端服务（端口 3001）
│   ├── app.js          入口
│   ├── .env            环境变量（数据库配置）
│   ├── config/db.js    MySQL 连接池
│   ├── middleware/     JWT 认证中间件
│   ├── routes/         10 个路由模块
│   └── scripts/        初始化脚本
└── frontend/           前端应用（端口 5173）
    └── src/pages/      12 个功能页面
```

## 快速启动

### 第一步：初始化数据库
```bash
# 在 MySQL 中执行：
source database/schema.sql
source database/seed.sql
```

### 第二步：启动后端
```bash
cd backend
npm install

# 修改 .env 文件中的数据库密码
# DB_PASSWORD=你的MySQL密码

node scripts/initAdmin.js   # 创建初始用户
npm run dev                  # 启动后端（端口3001）
```

### 第三步：启动前端
```bash
cd frontend
npm install
npm run dev                  # 启动前端（端口5173）
```

### 第四步：访问系统
浏览器打开 http://localhost:5173

默认账户：
- 管理员：admin / admin123
- 工作人员：liming / staff123

---

## 系统功能模块（12个）

| 模块 | 说明 |
|------|------|
| 登录模块 | JWT 身份验证，角色权限控制 |
| 仪表盘 | 数据概览、图表统计 |
| 藏品管理 | CRUD + 多条件查询 + 详情查看 |
| 捐赠人管理 | CRUD + 关联检查 |
| 展馆管理 | CRUD + 容量状态管理 |
| 展览管理 | CRUD + 展品穿梭框管理 |
| 借展管理 | 借出/归还业务流程 + 逾期自动标记 |
| 统计报表 | 4类图表 + Excel导出 |
| 分类管理 | 两级分类树结构 |
| 在线帮助 | 数据库存储帮助文档，各页面一键调用 |
| 用户管理 | 账户CRUD + 密码重置（仅管理员） |

## 数据库设计（9张表）

| 表名 | 说明 | 关联 |
|------|------|------|
| sys_users | 系统用户 | - |
| categories | 藏品分类（两级树） | 自引用 |
| donors | 捐赠人 | - |
| halls | 展馆 | - |
| artifacts | 藏品主表 | → categories, donors, halls |
| exhibitions | 展览 | → halls |
| exhibition_artifacts | 展览-藏品关联 | → exhibitions, artifacts |
| loans | 借展记录 | → artifacts, sys_users |
| help_docs | 在线帮助文档 | - |
# HeritageVaul
