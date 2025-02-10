import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose, { Types } from 'mongoose';

import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  User,
  UserRole,
  LiveRoom,
  LiveRoomStatus,
  DanmakuMessage,
  BalanceRecord,
  BalanceRecordType,
  BalanceSourceType
} from '../../src/models/index.js';

describe('数据库模型测试', () => {
  let mongoServer: MongoMemoryServer;

  // 在所有测试开始前连接到内存数据库
  beforeAll(async () => {
    try {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: './.mongodb-memory-server/mongodb-binaries'
        },
        binary: {
          downloadDir: './.mongodb-memory-server/mongodb-binaries'
        }
      });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    } catch (error) {
      console.error('Failed to start MongoDB Memory Server:', error);
      // 如果启动失败，确保清理资源
      if (mongoServer) await mongoServer.stop();
      throw error;
    }
  });

  // 每个测试后清理数据库
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });

  // 所有测试结束后断开连接
  afterAll(async () => {
    try {
      await mongoose.disconnect();
      if (mongoServer) await mongoServer.stop();
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });

  describe('User Model', () => {
    it('应该能够创建新用户', async () => {
      const userData = {
        username: 'testuser',
        nickname: '测试用户',
        password_hash: 'test_hash_password',
        phone: '13800138000',
        role: UserRole.STREAMER,
        balance: 1000,
        is_active: true
      };

      const user = await User.create(userData);
      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.role).toBe(UserRole.STREAMER);
      expect(user.balance).toBe(1000);
    });
  });

  describe('LiveRoom Model', () => {
    it('应该能够创建直播间并管理状态', async () => {
      // 创建测试用户
      const user = await User.create({
        username: 'streamer',
        nickname: '主播',
        password_hash: 'test',
        phone: '13800138001',
        role: UserRole.STREAMER
      });

      // 创建直播间
      const roomData = {
        user_id: user._id,
        title: '测试直播间',
        stream_key: 'test_stream_key_123',
        status: LiveRoomStatus.PENDING
      };

      const room = await LiveRoom.create(roomData);
      expect(room).toBeDefined();
      expect(room.status).toBe(LiveRoomStatus.PENDING);

      // 测试开始直播
      await room.startLive();
      expect(room.status).toBe(LiveRoomStatus.LIVE);
      expect(room.start_time).toBeDefined();
      expect(room.end_time).toBeNull();

      // 测试结束直播
      await room.endLive();
      expect(room.status).toBe(LiveRoomStatus.FINISHED);
      expect(room.end_time).toBeDefined();
    });
  });

  describe('DanmakuMessage Model', () => {
    it('应该能够创建弹幕消息', async () => {
      // 创建测试用户和直播间
      const user = await User.create({
        username: 'viewer',
        nickname: '观众',
        password_hash: 'test',
        phone: '13800138002',
        role: UserRole.USER
      });

      const room = await LiveRoom.create({
        user_id: user._id,
        title: '测试直播间',
        stream_key: 'test_key',
        status: LiveRoomStatus.LIVE
      });

      // 创建弹幕
      const danmakuData = {
        user_id: user._id,
        room_id: room._id,
        content: '测试弹幕消息',
        color: '#FF0000',
        font_size: 14
      };

      const danmaku = await DanmakuMessage.create(danmakuData);
      expect(danmaku).toBeDefined();
      expect(danmaku.content).toBe(danmakuData.content);
      expect(danmaku.color).toBe(danmakuData.color);
      expect(danmaku.font_size).toBe(danmakuData.font_size);
    });
  });

  describe('BalanceRecord Model', () => {
    it('应该能够创建充值记录', async () => {
      // 创建测试用户
      const user = await User.create({
        username: 'user',
        nickname: '用户',
        password_hash: 'test',
        phone: '13800138003',
        role: UserRole.USER,
        balance: 0
      });

      // 创建充值记录
      const orderId = new mongoose.Types.ObjectId();
      const balanceRecord = await BalanceRecord.createRechargeRecord(
        user._id as Types.ObjectId,
        1000, // 10元
        orderId,
        '测试充值'
      );

      expect(balanceRecord).toBeDefined();
      expect(balanceRecord.type).toBe(BalanceRecordType.RECHARGE);
      expect(balanceRecord.amount).toBe(1000);
      expect(balanceRecord.source_type).toBe(BalanceSourceType.RECHARGE_ORDER);
    });

    it('应该能够创建礼物收支记录', async () => {
      // 创建送礼用户和主播
      const sender = await User.create({
        username: 'sender',
        nickname: '送礼用户',
        password_hash: 'test',
        phone: '13800138004',
        role: UserRole.USER,
        balance: 2000
      });

      const receiver = await User.create({
        username: 'receiver',
        nickname: '主播',
        password_hash: 'test',
        phone: '13800138005',
        role: UserRole.STREAMER,
        balance: 0
      });

      // 创建礼物记录ID
      const giftRecordId = new mongoose.Types.ObjectId();

      // 创建送礼记录
      const senderRecord = await BalanceRecord.createGiftRecord(
        sender._id as Types.ObjectId,
        1000,
        giftRecordId,
        true, // isSender
        '送出礼物'
      );

      // 创建收礼记录
      const receiverRecord = await BalanceRecord.createGiftRecord(
        receiver._id as Types.ObjectId,
        1000,
        giftRecordId,
        false, // isSender
        '收到礼物'
      );

      expect(senderRecord.amount).toBe(-1000); // 送礼为负数
      expect(receiverRecord.amount).toBe(1000); // 收礼为正数
      expect(senderRecord.type).toBe(BalanceRecordType.GIFT_SEND);
      expect(receiverRecord.type).toBe(BalanceRecordType.GIFT_RECEIVE);
    });
  });
});
