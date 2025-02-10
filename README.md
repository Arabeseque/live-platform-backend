# 直播平台后端服务

## 技术栈

- Node.js
- TypeScript
- Koa.js
- MongoDB (MongoDB Atlas)
- JWT 认证
- ESLint
- Vitest

## 开发环境设置

1. 安装依赖
```bash
pnpm install
```

2. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入必要的配置信息
# 特别是 MongoDB 连接字符串和 JWT 密钥
```

3. 启动开发服务器
```bash
pnpm dev
```

## 可用的 API 接口

### 用户管理

#### 创建用户
- 方法: POST
- 路径: /api/users
- 请求体:
```json
{
  "username": "test_user",
  "nickname": "测试用户",
  "password": "password123",
  "phone": "13800138000",
  "role": "user"
}
```

#### 获取用户详情
- 方法: GET
- 路径: /api/users/:id

#### 更新用户
- 方法: PATCH
- 路径: /api/users/:id
- 请求体:
```json
{
  "nickname": "新昵称",
  "avatar_url": "http://example.com/avatar.jpg"
}
```

#### 获取用户列表
- 方法: GET
- 路径: /api/users
- 查询参数:
  - page: 页码（默认：1）
  - limit: 每页条数（默认：10）
  - keyword: 搜索关键词
  - role: 用户角色
  - is_active: 是否激活

#### 删除用户（软删除）
- 方法: DELETE
- 路径: /api/users/:id

## 开发命令

```bash
# 启动开发服务器（支持热重载）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 运行测试
pnpm test

# 启动测试监听模式
pnpm test:watch

# 运行测试覆盖率报告
pnpm test:coverage

# 启动测试 UI 界面
pnpm test:ui

# 运行代码检查
pnpm lint

# 自动修复代码格式
pnpm lint:fix
```

## 目录结构

```
src/
├── configs/         # 配置文件
├── controllers/     # 控制器
├── dto/            # 数据传输对象
├── middlewares/    # 中间件
├── models/         # 数据模型
├── routes/         # 路由定义
├── utils/          # 工具函数
├── app.ts          # 应用配置
└── server.ts       # 服务器入口

tests/              # 测试文件
docs/              # 文档
```

## 注意事项

1. 生产环境部署前请修改：
   - JWT 密钥
   - MongoDB 连接信息
   - 其他敏感配置

2. API 响应格式：
```typescript
{
  code: number;    // 状态码：0-成功，非0-失败
  message: string; // 响应信息
  data?: any;      // 响应数据
}
```

3. 环境变量说明见 .env.example 文件

## 开发规范

1. 代码风格遵循 ESLint 配置
2. 提交前运行测试和代码检查
3. 保持文档的同步更新
4. 遵循 TypeScript 类型定义
