import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors.js';
import { UserRole } from '../models/user.model.js';

interface JwtPayload {
  id: string;
  role?: UserRole;
}

/**
 * 认证中间件工厂函数，支持角色验证
 * @param allowedRoles 允许访问的角色列表
 */
export const authMiddleware = (allowedRoles?: UserRole[]) => {
  return async (ctx: Context, next: Next) => {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '请先登录'
      };
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      ctx.state.user = { id: decoded.id, role: decoded.role };

      // 如果指定了允许的角色，则验证用户角色
      if (allowedRoles && allowedRoles.length > 0 && decoded.role) {
        if (!allowedRoles.includes(decoded.role)) {
          ctx.status = 403;
          ctx.body = {
            code: 403,
            message: '没有访问权限'
          };
          return;
        }
      }

      await next();
    } catch (err) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '登录已过期，请重新登录'
      };
    }
  };
};
