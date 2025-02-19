import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LiveRoomModel from '../models/live-room.model.js';
import { websocketController } from '../controllers/websocket.controller.js';

// 加载环境变量
dotenv.config();

async function migrateRooms() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/live-platform');
    console.log('Connected to MongoDB');

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // 处理 idle 状态的房间
    const idleRooms = await LiveRoomModel.find({
      status: 'idle',
      createdAt: { $lt: twoMinutesAgo }
    });

    for (const room of idleRooms) {
      console.log(`删除未开始推流的房间: ${room._id}`);
      websocketController.broadcast({
        type: 'roomDeleted',
        data: {
          roomId: room._id,
          reason: '房间创建超过2分钟未推流，已自动删除'
        }
      });
      await room.deleteOne();
    }

    // 处理 living 状态但没有推流的房间
    const livingRooms = await LiveRoomModel.find({
      status: 'living',
      has_stream: false
    });

    for (const room of livingRooms) {
      console.log(`结束无推流的直播房间: ${room._id}`);
      websocketController.broadcast({
        type: 'roomEnded',
        data: {
          roomId: room._id,
          reason: '直播间无推流，已自动结束'
        }
      });
      await room.endLive();
    }

    // 初始化 last_stream_time 字段
    await LiveRoomModel.updateMany(
      { last_stream_time: null },
      { $set: { last_stream_time: new Date() } }
    );

    console.log('房间迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrateRooms();
