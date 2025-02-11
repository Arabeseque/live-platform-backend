import { Context } from 'koa';
import bcrypt from 'bcrypt';
import { sign, SignOptions } from 'jsonwebtoken';
import { container } from 'tsyringe';
import User from '../models/user.model.js';
import { success } from '../utils/response.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.js';
import { VerificationCodeService } from '../services/verification-code.service.js';
import { VerificationCodeType } from '../models/verification-code.model.js';

/**
 * 认证控制器
 */
export class AuthController {
  private static verificationCodeService = container.resolve(VerificationCodeService);
  private static SALT_ROUNDS = 10;

  /**
   * 用户名密码登录
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

    await AuthController.handleSuccessLogin(ctx, user);
  }

  /**
   * 发送验证码
   */
  static async sendVerificationCode(ctx: Context) {
    const { phone, type } = ctx.request.body as { phone: string; type: VerificationCodeType };

    if (!phone || !type) {
      throw new ValidationError('手机号和验证码类型不能为空');
    }

    if (!Object.values(VerificationCodeType).includes(type)) {
      throw new ValidationError('无效的验证码类型');
    }

    const expiresIn = await AuthController.verificationCodeService.sendCode(phone, type);

    ctx.body = success({
      expires_in: expiresIn
    }, '验证码发送成功');
  }

  /**
   * 验证码登录
   */
  static async loginWithCode(ctx: Context) {
    const { phone, code } = ctx.request.body as { phone: string; code: string };

    if (!phone || !code) {
      throw new ValidationError('手机号和验证码不能为空');
    }

    // 验证验证码
    const isValid = await AuthController.verificationCodeService.verifyCode(
      phone,
      code,
      VerificationCodeType.LOGIN
    );

    if (!isValid) {
      throw new AuthenticationError('验证码验证失败');
    }

    // 查找或创建用户
    let user = await User.findOne({ phone });
    if (!user) {
      // 如果用户不存在，创建新用户
      const username = `user_${Date.now()}`; // 生成临时用户名
      const randomPassword = Math.random().toString(36).slice(-8); // 生成随机密码
      
      user = await User.create({
        username,
        nickname: username,
        phone,
        password_hash: await bcrypt.hash(randomPassword, AuthController.SALT_ROUNDS),
        is_active: true
      });
    }

    await AuthController.handleSuccessLogin(ctx, user);
  }

  /**
   * 使用验证码注册
   */
  static async register(ctx: Context) {
    const { phone, code, password, username } = ctx.request.body as {
      phone: string;
      code: string;
      password: string;
      username?: string;
    };

    // 参数验证
    if (!phone || !code || !password) {
      throw new ValidationError('手机号、验证码和密码不能为空');
    }

    // 密码强度验证
    if (!AuthController.isValidPassword(password)) {
      throw new ValidationError('密码必须包含大小写字母和数字，且长度至少为8位');
    }

    // 验证验证码
    const isValid = await AuthController.verificationCodeService.verifyCode(
      phone,
      code,
      VerificationCodeType.REGISTER
    );

    if (!isValid) {
      throw new AuthenticationError('验证码验证失败');
    }

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      throw new ValidationError('该手机号已被注册');
    }

    // 检查用户名是否已存在
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new ValidationError('用户名已存在');
      }
    }

    // 创建用户
    const newUser = await User.create({
      username: username || `user_${Date.now()}`,
      nickname: username || `user_${Date.now()}`,
      phone,
      password_hash: await bcrypt.hash(password, AuthController.SALT_ROUNDS),
      is_active: true
    });

    await AuthController.handleSuccessLogin(ctx, newUser);
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

  /**
   * 处理成功登录
   */
  private static async handleSuccessLogin(ctx: Context, user: any) {
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
   * 验证密码强度
   */
  private static isValidPassword(password: string): boolean {
    // 密码必须包含大小写字母和数字，且长度至少为8位
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }
}
