import 'reflect-metadata';


import { Context } from 'koa';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import User from '../models/user.model.js';
import { success } from '../utils/response.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.js';
import { VerificationCodeService } from '../services/verification-code.service.js';
import { VerificationCodeType } from '../models/verification-code.model.js';

/**
 * 认证控制器
 * @swagger
 * tags:
 *   name: 认证管理
 *   description: 用户认证相关接口
 * 
 * components:
 *   schemas:
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             nickname:
 *               type: string
 *             avatar_url:
 *               type: string
 *             role:
 *               type: string
 *               enum: [user, streamer, admin]
 *             last_login_time:
 *               type: string
 *               format: date-time
 */
export class AuthController {
  private static verificationCodeService = container.resolve(VerificationCodeService);
  private static SALT_ROUNDS = 10;

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags:
   *       - 认证管理
   *     summary: 用户名密码登录
   *     description: 使用用户名和密码进行登录
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               password:
   *                 type: string
   *                 format: password
   *                 description: 密码
   *     responses:
   *       200:
   *         description: 登录成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: 参数验证失败
   *       401:
   *         description: 密码错误
   *       404:
   *         description: 用户不存在
   */
  static async login(ctx: Context) {
    const { username, password } = ctx.request.body as { username: string; password: string };

    if (!username || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    const user = await User.findOne({ username });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!user.is_active) {
      throw new AuthenticationError('账号已被禁用');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('密码错误');
    }

    await AuthController.handleSuccessLogin(ctx, user);
  }

  /**
   * @swagger
   * /api/auth/verification-code:
   *   post:
   *     tags:
   *       - 认证管理
   *     summary: 发送验证码
   *     description: 向指定手机号发送验证码
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - type
   *             properties:
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               type:
   *                 type: string
   *                 enum: [LOGIN, REGISTER, RESET_PASSWORD]
   *                 description: 验证码类型
   *     responses:
   *       200:
   *         description: 验证码发送成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 expires_in:
   *                   type: number
   *                   description: 验证码有效期（秒）
   *       400:
   *         description: 参数验证失败
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
   * @swagger
   * /api/auth/login/code:
   *   post:
   *     tags:
   *       - 认证管理
   *     summary: 验证码登录
   *     description: 使用手机号和验证码进行登录，如果用户不存在则自动注册
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - code
   *             properties:
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               code:
   *                 type: string
   *                 description: 验证码
   *     responses:
   *       200:
   *         description: 登录成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: 参数验证失败
   *       401:
   *         description: 验证码验证失败
   */
  static async loginWithCode(ctx: Context) {
    const { phone, code } = ctx.request.body as { phone: string; code: string };

    if (!phone || !code) {
      throw new ValidationError('手机号和验证码不能为空');
    }

    const isValid = await AuthController.verificationCodeService.verifyCode(
      phone,
      code,
      VerificationCodeType.LOGIN
    );

    if (!isValid) {
      throw new AuthenticationError('验证码验证失败');
    }

    let user = await User.findOne({ phone });
    if (!user) {
      const username = `user_${Date.now()}`;
      const randomPassword = Math.random().toString(36).slice(-8);
      
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
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags:
   *       - 认证管理
   *     summary: 用户注册
   *     description: 使用手机号、验证码和密码注册新用户
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phone
   *               - code
   *               - password
   *             properties:
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               code:
   *                 type: string
   *                 description: 验证码
   *               password:
   *                 type: string
   *                 format: password
   *                 description: 密码（必须包含大小写字母和数字，且长度至少为8位）
   *               username:
   *                 type: string
   *                 description: 用户名（可选）
   *     responses:
   *       200:
   *         description: 注册成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: 参数验证失败
   *       401:
   *         description: 验证码验证失败
   */
  static async register(ctx: Context) {
    const { phone, code, password, username } = ctx.request.body as {
      phone: string;
      code: string;
      password: string;
      username?: string;
    };

    if (!phone || !code || !password) {
      throw new ValidationError('手机号、验证码和密码不能为空');
    }

    if (!AuthController.isValidPassword(password)) {
      throw new ValidationError('密码必须包含大小写字母和数字，且长度至少为8位');
    }

    const isValid = await AuthController.verificationCodeService.verifyCode(
      phone,
      code,
      VerificationCodeType.REGISTER
    );

    if (!isValid) {
      throw new AuthenticationError('验证码验证失败');
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      throw new ValidationError('该手机号已被注册');
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new ValidationError('用户名已存在');
      }
    }

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
   * @swagger
   * /api/auth/current:
   *   get:
   *     tags:
   *       - 认证管理
   *     summary: 获取当前用户信息
   *     description: 获取当前登录用户的详细信息
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 username:
   *                   type: string
   *                 nickname:
   *                   type: string
   *                 avatar_url:
   *                   type: string
   *                 role:
   *                   type: string
   *                   enum: [user, streamer, admin]
   *                 last_login_time:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: 未认证
   *       404:
   *         description: 用户不存在
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
    const jwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const jwtOptions = {
      expiresIn: Number(process.env.JWT_EXPIRES_IN)
    };

    user.last_login_time = new Date();
    user.last_login_ip = ctx.ip;
    await user.save();

    ctx.body = success({
      token: jwt.sign(jwtPayload, process.env.JWT_SECRET, jwtOptions),
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }
}
