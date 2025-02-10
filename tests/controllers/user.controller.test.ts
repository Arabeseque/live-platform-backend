import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Context } from 'koa';
import { UserController } from '../../src/controllers/user.controller.js';
import User, { UserRole } from '../../src/models/user.model.js';
import { CreateUserDTO } from '../../src/dto/user.dto.js';

// 模拟数据
const mockUser: CreateUserDTO = {
  username: 'testuser',
  nickname: '测试用户',
  password: 'Test123456',
  phone: '13800138000',
  role: UserRole.USER
};

// 模拟 Koa Context
const createMockContext = (data?: any): Context => ({
  app: {} as any,
  request: {
    body: data
  },
  params: {},
  query: {},
  status: 0,
  body: null,
  ...({} as any) // 其他必要的Context属性
});

describe('UserController', () => {
  let mongod: MongoMemoryServer;

  // 在所有测试前启动内存数据库
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({

      binary: {
        downloadDir: './.mongodb-memory-server/mongodb-binaries'
      }
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  // 每个测试前清理数据库
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // 所有测试后关闭连接和内存数据库
  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  describe('create', () => {
    it('应该成功创建用户', async () => {
      const ctx = createMockContext(mockUser);
      await UserController.create(ctx);

      expect(ctx.status).toBe(201);
      expect((ctx.body as any).data).toMatchObject({
        username: mockUser.username,
        nickname: mockUser.nickname,
        phone: mockUser.phone,
        role: mockUser.role
      });
    });

    it('当用户名已存在时应该抛出错误', async () => {
      // 先创建一个用户
      await UserController.create(createMockContext(mockUser));

      // 尝试创建相同用户名的用户
      const ctx = createMockContext(mockUser);
      await expect(UserController.create(ctx))
        .rejects
        .toThrow('用户名或手机号已存在');
    });
  });

  describe('getById', () => {
    it('应该获取到用户详情', async () => {
      // 先创建用户
      const createCtx = createMockContext(mockUser);
      await UserController.create(createCtx);
      const userId = (createCtx.body as any).data.id;

      // 获取用户详情
      const ctx = createMockContext();
      ctx.params = { id: userId };
      await UserController.getById(ctx);

      expect((ctx.body as any).data).toMatchObject({
        id: (createCtx.body as any).data.id,
        username: mockUser.username,
        nickname: mockUser.nickname
      });
    });

    it('当用户不存在时应该抛出错误', async () => {
      const ctx = createMockContext();
      ctx.params = { id: new mongoose.Types.ObjectId().toString() };

      await expect(UserController.getById(ctx))
        .rejects
        .toThrow('用户不存在');
    });
  });

  describe('update', () => {
    it('应该成功更新用户信息', async () => {
      // 先创建用户
      const createCtx = createMockContext(mockUser);
      await UserController.create(createCtx);
      const userId = (createCtx.body as any).data.id;

      // 更新用户信息
      const updateData = {
        nickname: '新昵称',
        phone: '13900139000'
      };
      const ctx = createMockContext(updateData);
      ctx.params = { id: userId };
      await UserController.update(ctx);

      expect((ctx.body as any).data).toMatchObject({
        id: userId,
        nickname: updateData.nickname,
        phone: updateData.phone
      });
    });

    it('当更新不存在的用户时应该抛出错误', async () => {
      const ctx = createMockContext({ nickname: '新昵称' });
      ctx.params = { id: new mongoose.Types.ObjectId().toString() };

      await expect(UserController.update(ctx))
        .rejects
        .toThrow('用户不存在');
    });
  });

  describe('list', () => {
    it('应该获取用户列表', async () => {
      // 创建多个用户
      const users = [
        { ...mockUser, username: 'user1', phone: '13800138001' },
        { ...mockUser, username: 'user2', phone: '13800138002' },
        { ...mockUser, username: 'user3', phone: '13800138003' }
      ];

      for (const user of users) {
        await UserController.create(createMockContext(user));
      }

      // 获取用户列表
      const ctx = createMockContext();
      ctx.query = { page: '1', limit: '10' };
      await UserController.list(ctx);

      const responseData = (ctx.body as any).data;
      expect(responseData.total).toBe(3);
      expect(responseData.list).toHaveLength(3);
      expect(responseData.page).toBe(1);
      expect(responseData.limit).toBe(10);
    });

    it('应该根据关键字搜索用户', async () => {
      // 创建测试用户
      const users = [
        { ...mockUser, username: 'test2', nickname: '搜索', phone: '13800138002' },
        { ...mockUser, username: 'other', nickname: '其他', phone: '13800138003' }
      ];

      for (const user of users) {
        await UserController.create(createMockContext(user));
      }

      // 按关键字搜索
      const ctx = createMockContext();
      ctx.query = { keyword: '搜索' };
      await UserController.list(ctx);

      const responseData = (ctx.body as any).data;
      expect(responseData.total).toBe(1);
      expect(responseData.list[0].nickname).toBe('搜索');
    });
  });

  describe('delete', () => {
    it('应该成功停用用户（软删除）', async () => {
      // 先创建用户
      const createCtx = createMockContext(mockUser);
      await UserController.create(createCtx);
      const userId = (createCtx.body as any).data.id;

      // 删除用户
      const ctx = createMockContext();
      ctx.params = { id: userId };
      await UserController.delete(ctx);

      expect((ctx.body as any).data.is_active).toBe(false);
    });

    it('当删除不存在的用户时应该抛出错误', async () => {
      const ctx = createMockContext();
      ctx.params = { id: new mongoose.Types.ObjectId().toString() };

      await expect(UserController.delete(ctx))
        .rejects
        .toThrow('用户不存在');
    });
  });
});
