import { Context, Next } from 'koa';
import { verify } from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

/**
 * JWT负载接口
 */
interface JwtPayload {
  id: string;
  username: string;
  role: string;
}

/**
 * 验证JWT Token
 */
export function authMiddleware(allowedRoles?: string[]) {
  return async (ctx: Context, next: Next) => {
    // 获取token
    const authHeader = ctx.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError('未提供认证令牌');
    }

    // 验证token格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('认证令牌格式错误');
    }

    const token = parts[1];

    try {
      // 验证token
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as JwtPayload;

      // 将用户信息存储在上下文中
      ctx.state.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };

      // 验证角色权限
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(decoded.role)) {
          throw new AuthorizationError('没有操作权限');
        }
      }

      await next();
    } catch (error) {
      if (error instanceof Error) {
        // 处理不同类型的JWT错误
        if (error.name === 'TokenExpiredError') {
          throw new AuthenticationError('认证令牌已过期');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new AuthenticationError('无效的认证令牌');
        }
      }
      throw error;
    }
  };
}
