import 'reflect-metadata';

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Context } from 'koa';
import { container } from 'tsyringe';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import User from '../../src/models/user.model.js';
import VerificationCode from '../../src/models/verification-code.model.js';
import { AuthController } from '../../src/controllers/auth.controller.js';
import { VerificationCodeService } from '../../src/services/verification-code.service.js';
import { VerificationCodeType } from '../../src/models/verification-code.model.js';
import { ValidationError, AuthenticationError } from '../../src/utils/errors.js';

describe('AuthController', () => {
  let mongod: MongoMemoryServer;
  let mockCtx: Context;

  beforeAll(async () => {
    // 创建内存MongoDB实例
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // 清理并关闭数据库连接
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await VerificationCode.deleteMany({});
    
    // 初始化mock上下文
    mockCtx = {
      request: {
        body: {},
        app: {} as any,
        req: {} as any,
        res: {} as any,
        ctx: {} as any,
        response: {} as any,
      },
      response: {
        body: undefined
      },
      ip: '127.0.0.1',
      app: {} as any,
      req: {} as any,
      res: {} as any,
      state: {},
    } as Context;
  });

  // NOTE: 作用为测试发送验证码功能
  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      mockCtx.request.body = {
        phone: '13800138000',
        type: VerificationCodeType.REGISTER
      };

      await AuthController.sendVerificationCode(mockCtx);
      const response = mockCtx.body as any;

      expect(response).toBeDefined();
      expect(response.code).toBe(0);
      expect(response.data.expires_in).toBeDefined();

      // 验证数据库中是否保存了验证码
      const code = await VerificationCode.findOne({ phone: '13800138000' });
      expect(code).toBeDefined();
      if (code) {
        expect(code.type).toBe(VerificationCodeType.REGISTER);
      }
    });

    it('should validate phone number format', async () => {
      mockCtx.request.body = {
        phone: '123',
        type: VerificationCodeType.REGISTER
      };

      await expect(
        AuthController.sendVerificationCode(mockCtx)
      ).rejects.toThrow(ValidationError);
    });
  });

  // NOTE: 作用为测试验证码登录功能
  describe('loginWithCode', () => {
    it('should login successfully with valid code', async () => {
      // 创建验证码
      const verificationCode = await VerificationCode.create({
        phone: '13800138000',
        code: '123456',
        type: VerificationCodeType.LOGIN,
        expires_at: new Date(Date.now() + 300000),
        is_used: false,
        verify_attempts: 0
      });

      mockCtx.request.body = {
        phone: '13800138000',
        code: '123456'
      };

      await AuthController.loginWithCode(mockCtx);
      const response = mockCtx.body as any;
      expect(response).toBeDefined();
      expect(response.code).toBe(0);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();

      // 验证码应该被标记为已使用
      const updatedCode = await VerificationCode.findById(verificationCode._id);
      expect(updatedCode).toBeDefined();
      if (updatedCode) {
        expect(updatedCode.is_used).toBe(true);
      }
    });


  });

  // NOTE: 作用为测试使用验证码注册新用户功能
  describe('register', () => {
    it('should register new user successfully', async () => {
      // 创建验证码
      await VerificationCode.create({
        phone: '13800138000',
        code: '123456',
        type: VerificationCodeType.REGISTER,
        expires_at: new Date(Date.now() + 300000),
        is_used: false,
        verify_attempts: 0
      });

      mockCtx.request.body = {
        phone: '13800138000',
        code: '123456',
        password: 'TestPass123',
        username: 'testuser'
      };

      await AuthController.register(mockCtx);
      const response = mockCtx.body as any;

      expect(response).toBeDefined();
      expect(response.code).toBe(0);
      expect(response.data.token).toBeDefined();
      expect(response.data.user).toBeDefined();
      expect(response.data.user.username).toBe('testuser');

      // 验证用户是否被正确创建
      const user = await User.findOne({ username: 'testuser' });
      expect(user).toBeDefined();
      if (user) {
        expect(user.phone).toBe('13800138000');
        expect(user.is_active).toBe(true);
      }
    });

    it('should validate password strength', async () => {
      mockCtx.request.body = {
        phone: '13800138000',
        code: '123456',
        password: 'weak',
        username: 'testuser'
      };

      await expect(
        AuthController.register(mockCtx)
      ).rejects.toThrow(ValidationError);
    });
  });

  // NOTE: 作用为测试使用用户名密码登录功能
  describe('login with password', () => {
    it('should login successfully with correct password', async () => {
      // 创建测试用户
      const password = 'TestPass123';
      const user = await User.create({
        username: 'testuser',
        nickname: 'Test User',
        phone: '13800138000',
        password_hash: await bcrypt.hash(password, 10),
        is_active: true
      });

      mockCtx.request.body = {
        username: 'testuser',
        password
      };

      await AuthController.login(mockCtx);
      const response = mockCtx.body as any;

      expect(response).toBeDefined();
      expect(response.code).toBe(0);
      expect(response.data.token).toBeDefined();
      expect(response.data.user.username).toBe('testuser');
    });

    it('should fail with incorrect password', async () => {
      // 创建测试用户
      await User.create({
        username: 'testuser',
        nickname: 'Test User',
        phone: '13800138000',
        password_hash: await bcrypt.hash('TestPass123', 10),
        is_active: true
      });

      mockCtx.request.body = {
        username: 'testuser',
        password: 'wrong password'
      };

      await expect(
        AuthController.login(mockCtx)
      ).rejects.toThrow(AuthenticationError);
    });
  });
});
