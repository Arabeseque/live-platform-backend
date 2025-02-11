# Swagger 集成计划

## 1. 依赖安装

需要安装以下依赖：
```bash
pnpm add koa2-swagger-ui @koa-swagger-decorator
```

## 2. 基础配置

在 `src/configs` 目录下创建 `swagger.ts` 文件，配置 Swagger 基本信息：

```typescript
export const swaggerConfig = {
  title: 'Live Platform API',
  description: '直播平台 API 文档',
  version: '1.0.0',
  prefix: '/api',
  swaggerHtmlEndpoint: '/swagger-html',
  swaggerJsonEndpoint: '/swagger-json',
  swaggerOptions: {
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Bearer token'
      }
    }
  }
};
```

## 3. 控制器注解改造

为现有控制器添加 Swagger 注解，包括：

- 路由装饰器：`@request`
- 描述装饰器：`@summary`、`@description`
- 参数装饰器：`@body`、`@path`、`@query`
- 响应装饰器：`@responses`
- 标签装饰器：`@tags`

示例格式：
```typescript
@request('post', '/users')
@summary('创建用户')
@description('创建新用户账号')
@tags(['用户管理'])
@body({
  username: { type: 'string', required: true, description: '用户名' },
  password: { type: 'string', required: true, description: '密码' },
  phone: { type: 'string', required: true, description: '手机号' }
})
@responses({
  200: { description: '创建成功' },
  400: { description: '参数错误' },
  409: { description: '用户已存在' }
})
```

## 4. 路由改造

需要改造现有路由注册方式，使用 `@koa-swagger-decorator` 提供的路由加载器：

```typescript
import { SwaggerRouter } from 'koa-swagger-decorator';

const router = new SwaggerRouter();
router.map(UserController);
```

## 5. Koa 应用集成

在 `app.ts` 中集成 Swagger UI：

```typescript
import { koaSwagger } from 'koa2-swagger-ui';
import { swaggerConfig } from './configs/swagger';

// 注册 Swagger UI 中间件
app.use(
  koaSwagger({
    routePrefix: '/swagger',
    swaggerOptions: {
      url: '/swagger-json'
    }
  })
);
```

## 6. 实现步骤

1. 安装依赖包
2. 创建 Swagger 配置文件
3. 改造用户控制器，添加 Swagger 注解
4. 改造认证控制器，添加 Swagger 注解
5. 更新路由注册方式
6. 在 Koa 应用中集成 Swagger UI
7. 测试文档访问和接口调试

## 7. 注意事项

- 确保所有接口参数和响应都有清晰的类型定义
- 添加适当的错误响应文档
- 配置认证信息
- 添加示例请求和响应
- 确保文档与实际接口实现保持同步

## 8. 文档访问

完成集成后，可以通过以下地址访问 Swagger 文档：

- Swagger UI: `http://localhost:3000/swagger`
- Swagger JSON: `http://localhost:3000/swagger-json`
