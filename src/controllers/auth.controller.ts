import { Context } from 'koa';
import bcrypt from 'bcrypt';
import { sign, SignOptions } from 'jsonwebtoken';
import User from '../models/user.model.js';
import { success } from '../utils/response.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.js';

/**
 * 认证控制器
 */
export class AuthController {
  /**
   * 用户登录
   */
  static async login(ctx: Context) {
    const { username, password } = ctx.request.body as { username: string; password: string };

    // 参数验证
    if (!username || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 验证用户状态
    if (!user.is_active) {
      throw new AuthenticationError('账号已被禁用');
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('密码错误');
    }

    // 生成JWT token
    const jwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const jwtOptions: SignOptions = {
      expiresIn: Number(process.env.JWT_EXPIRES_IN)
    };

    // 更新最后登录信息
    user.last_login_time = new Date();
    user.last_login_ip = ctx.ip;
    await user.save();

    // 返回token和用户信息
    ctx.body = success({
      token: sign(jwtPayload, process.env.JWT_SECRET, jwtOptions),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
        last_login_time: user.last_login_time
      }
    }, '登录成功');
  }

  /**
   * 获取当前登录用户信息
   */
  static async getCurrentUser(ctx: Context) {
    const user = await User.findById(ctx.state.user.id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    ctx.body = success({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      role: user.role,
      last_login_time: user.last_login_time
    });
  }
}
