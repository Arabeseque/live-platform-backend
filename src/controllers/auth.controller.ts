import 'reflect-metadata';

import { Context } from 'koa';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';
import User from '../models/user.model.js';
import { success } from '../utils/response.js';
import { ValidationError, NotFoundError, AuthenticationError } from '../utils/errors.js';

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
   * /api/auth/register:
   *   post:
   *     tags:
   *       - 认证管理
   *     summary: 用户注册
   *     description: 使用用户名和密码注册新用户
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *               - phone
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               password:
   *                 type: string
   *                 format: password
   *                 description: 密码（必须包含大小写字母和数字，且长度至少为8位）
   *     responses:
   *       200:
   *         description: 注册成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: 参数验证失败
   */
  static async register(ctx: Context) {
    const { username, password, phone } = ctx.request.body as {
      username: string;
      password: string;
      phone: string;
    };

    if (!username || !password || !phone) {
      throw new ValidationError('用户名、密码和手机号不能为空');
    }

    if (!AuthController.isValidPassword(password)) {
      throw new ValidationError('密码必须包含大小写字母和数字，且长度至少为8位');
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new ValidationError('用户名已存在');
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new ValidationError('该手机号已被注册');
    }

    const newUser = await User.create({
      username,
      nickname: username,
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
      expiresIn: process.env.JWT_EXPIRES_IN
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
