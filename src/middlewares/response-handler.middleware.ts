import { Context, Next } from 'koa';
import { success } from '../utils/response.js';

/**
 * 响应格式化中间件
 * 确保所有响应都符合统一的格式：
 * {
 *   code: number,    // 状态码，0 表示成功
 *   message: string, // 响应信息
 *   data?: any       // 响应数据
 * }
 */
export async function responseHandler(ctx: Context, next: Next) {
  await next();

  // 跳过错误响应的处理（由错误处理中间件处理）
  if (ctx.status >= 400) {
    return;
  }

  // 如果已经设置了响应体，且不是标准格式，则格式化
  // NOTE: 如果后续的中间件或路由处理函数返回的响应体不是标准格式，responseHandler 会将其格式化为标准格式的成功响应。
  if (ctx.body && !isStandardResponse(ctx.body)) {
    ctx.body = success(ctx.body);
  }
}

/**
 * 判断是否为标准响应格式
 */
function isStandardResponse(body: any): boolean {
  return typeof body === 'object' && 
         'code' in body && 
         'message' in body;
}
