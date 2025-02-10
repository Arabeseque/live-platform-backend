import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { connectDatabase } from './configs/database.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { responseHandler } from './middlewares/response-handler.middleware.js';
import { validateEnv } from './utils/env-validator.js';
import userRoutes from './routes/user.routes.js';

// 验证环境变量
validateEnv();

// 创建 Koa 实例
const app = new Koa();

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
app.use(errorHandler); // 错误处理（需要最先注册以捕获所有错误）
app.use(responseHandler); // 响应格式化

// 注册路由
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

// 未匹配路由处理
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    code: 404,
    message: '接口不存在'
  };
});

// 监听错误事件
app.on('error', (err, ctx) => {
  console.error('服务器错误:', err);
});

// 导出 app 实例供测试使用
export default app;
