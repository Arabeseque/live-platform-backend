import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors.js';
import { UserRole } from '../models/user.model.js';

/**
 * 认证中间件工厂函数，支持角色验证
 * @param allowedRoles 允许访问的角色列表
 */
export const authMiddleware = (allowedRoles?: UserRole[]) => {
  return async (ctx: Context, next: Next) => {
    const authHeader = ctx.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('未提供有效的认证令牌');
    }

    const token = authHeader.substring(7); // 去掉 "Bearer " 前缀

    console.log('token:', token);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; username: string; role: UserRole };
      
      // 如果指定了允许的角色，则验证用户角色
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(decoded.role)) {
          throw new AuthenticationError('没有访问权限');
        }
      }

      ctx.state.user = decoded;
      await next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('无效的认证令牌');
      }
      throw error;
    }
  };
};
