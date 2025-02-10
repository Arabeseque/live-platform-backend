import mongoose, { Types } from 'mongoose';
import { connectDatabase } from './configs/database.js';
import {
  User,
  UserRole,
  LiveRoom,
  LiveRoomStatus,
  DanmakuMessage,
  BalanceRecord,
  BalanceRecordType,
  BalanceSourceType
} from './models/index.js';

const testDatabase = async () => {
  try {
    // 连接数据库
    await connectDatabase();
    console.log('数据库连接测试成功');

    // 创建测试用户
    const testUser = await User.create({
      username: 'testuser',
      nickname: '测试用户',
      password_hash: 'test_hash_password',
      phone: '13800138000',
      role: UserRole.STREAMER,
      balance: 1000, // 10元
      is_active: true
    });
    console.log('测试用户创建成功:', testUser.toJSON());

    // 创建测试直播间
    const testRoom = await LiveRoom.create({
      user_id: testUser._id,
      title: '测试直播间',
      stream_key: 'test_stream_key_123',
      status: LiveRoomStatus.PENDING
    });
    console.log('测试直播间创建成功:', testRoom.toJSON());

    // 开始直播
    await testRoom.startLive();
    console.log('直播已开始');

    // 发送测试弹幕
    const testDanmaku = await DanmakuMessage.create({
      user_id: testUser._id,
      room_id: testRoom._id,
      content: '测试弹幕消息',
      color: '#FF0000',
      font_size: 14
    });
    console.log('测试弹幕发送成功:', testDanmaku.toJSON());

    // 创建余额变动记录
    const rechargeOrderId = new Types.ObjectId(); // 使用Types.ObjectId
    const testBalanceRecord = await BalanceRecord.createRechargeRecord(
      testUser._id as Types.ObjectId, // 显式转换为Types.ObjectId
      1000,                          // amount (10元)
      rechargeOrderId,               // orderId
      '测试充值'                     // description
    );
    console.log('测试余额变动记录创建成功:', testBalanceRecord.toJSON());

    // 结束直播
    await testRoom.endLive();
    console.log('直播已结束');

    // 清理测试数据
    await Promise.all([
      User.deleteOne({ _id: testUser._id }),
      LiveRoom.deleteOne({ _id: testRoom._id }),
      DanmakuMessage.deleteOne({ _id: testDanmaku._id }),
      BalanceRecord.deleteOne({ _id: testBalanceRecord._id })
    ]);
    console.log('测试数据已清理');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
};

testDatabase();
