import { Context, Next } from 'koa';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError
} from '../utils/errors.js';
import { error } from '../utils/response.js';

/**
 * 统一错误处理中间件
 */
export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    // 开发环境打印错误堆栈
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
    }

    // 处理已知错误类型
    // NOTE: 错误类型： ValidationError、AuthenticationError、AuthorizationError、NotFoundError、ConflictError、ServerError
    // NOTE: AppError 通常是所有自定义错误类的基类。 它的子类（例如 ValidationError、AuthenticationError）代表了应用程序中不同类型的已知错误。
    if (err instanceof AppError) {
      ctx.status = err.status;
      ctx.body = error(err.message, err.code);
      return;
    }

    // 处理 Mongoose 验证错误
    // NOTE: 数据库验证错误，例如字段类型不匹配、字段缺失等
    if (err.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = error(Object.values(err.errors).map((e: any) => e.message).join(', '), 400);
      return;
    }

    // 处理 Mongoose 重复键错误
    // NOTE: 例如唯一索引重复
    if (err.code === 11000) {
      ctx.status = 409;
      const field = Object.keys(err.keyPattern)[0];
      ctx.body = error(`${field} 已存在`, 409);
      return;
    }

    // 处理其他未知错误
    ctx.status = 500;
    ctx.body = error('服务器内部错误', 500);
  }
}
