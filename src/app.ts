import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { koaSwagger } from 'koa2-swagger-ui';
import swaggerJSDoc from 'swagger-jsdoc';
import Router from '@koa/router';
import { Context } from 'koa';
import { connectDatabase } from './configs/database.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { responseHandler } from './middlewares/response-handler.middleware.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import webrtcRoutes from './routes/webrtc.routes';
import { WebRTCSignalingService } from './services/webrtc-signaling.service';
import { swaggerSpec } from './configs/swagger.js';
import { createServer } from 'http';

// 创建 Koa 实例
const app = new Koa();

// 创建 HTTP 服务器实例
// NOTE: app.callback() 方法的作用是将 Koa 实例转换为一个标准的 Node.js HTTP 请求监听器。换句话说，app.callback() 返回一个函数，这个函数可以作为 http.createServer() 的参数，用于处理每个 HTTP 请求。
const server = createServer(app.callback());

// 连接数据库
connectDatabase()
  .then(() => console.log('数据库连接成功'))
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  });

// 注册中间件
app.use(cors()); // 启用跨域
app.use(bodyParser()); // 解析请求体

// 创建 swagger router
const swaggerRouter = new Router();

// 创建独立的 swagger-json router（不使用响应处理中间件）
const swaggerJsonRouter = new Router();
swaggerJsonRouter.get('/swagger-json', (ctx: Context) => {
  ctx.body = {
    ...swaggerSpec,
    servers: [
      { url: ctx.origin, description: '当前服务器' }
    ]
  };
  ctx.type = 'application/json'; // 设置正确的Content-Type
});

// 配置 swagger UI
app.use(
  koaSwagger({
    routePrefix: '/swagger', // 访问地址: /swagger
    swaggerOptions: {
      url: '/swagger-json', // swagger-json 路径
    },
    exposeSpec: true,
    hideTopbar: true
  })
);

// 注册 swagger-json 路由（在 responseHandler 之前）
app.use(swaggerJsonRouter.routes());
app.use(swaggerJsonRouter.allowedMethods());

// 注册通用中间件
app.use(errorHandler); // 错误处理
app.use(responseHandler); // 响应格式化

// 注册 swagger 路由
app.use(swaggerRouter.routes());
app.use(swaggerRouter.allowedMethods());

// 注册业务路由
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(webrtcRoutes.routes());
app.use(webrtcRoutes.allowedMethods());

// 未匹配路由处理
app.use(async (ctx: Context) => {
  ctx.status = 404;
  ctx.body = {
    code: 404,
    message: '接口不存在'
  };
});

// 初始化WebSocket信令服务
new WebRTCSignalingService(server);

// 监听错误事件
app.on('error', (err: Error, ctx: Context) => {
  console.error('服务器错误:', err);
});

// 导出 HTTP 服务器实例供启动使用
export default server;
