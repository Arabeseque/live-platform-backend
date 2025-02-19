import mongoose, { Schema, Document } from 'mongoose';
import { websocketController } from '../controllers/websocket.controller';

// 全局定时器，用于检查所有直播中的房间
let globalCheckInterval: NodeJS.Timeout;

// 启动全局检查
const startGlobalCheck = () => {
  if (globalCheckInterval) {
    clearInterval(globalCheckInterval);
  }

  globalCheckInterval = setInterval(async () => {
    // 处理 idle 状态超过2分钟未推流的房间
    const idleRooms = await mongoose.model('LiveRoom').find({
      status: 'idle',
      createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) }  // 2分钟
    });

    for (const room of idleRooms) {
      console.log(`房间 ${room._id} 创建超过2分钟未开播，自动删除`);
      
      websocketController.broadcast({
        type: 'roomDeleted',
        data: {
          roomId: room._id,
          reason: '直播间创建超过2分钟未开播，已自动删除'
        }
      });

      await room.deleteOne();
    }

    // 处理 living 状态超过1分钟未推流的房间
    const livingRooms = await mongoose.model('LiveRoom').find({ 
      status: 'living',
      has_stream: false,
      $or: [
        { last_stream_time: { $lt: new Date(Date.now() - 60000) } }, // 1分钟
        { last_stream_time: null }
      ]
    });

    for (const room of livingRooms) {
      console.log(`房间 ${room._id} 长时间未推流，自动结束直播`);
      
      websocketController.broadcast({
        type: 'roomEnded',
        data: {
          roomId: room._id,
          reason: '直播间长时间未推流，已自动结束'
        }
      });

      await room.endLive();
    }
  }, 30000); // 每30秒检查一次
};

// 启动全局检查
startGlobalCheck();

export interface ILiveRoom extends Document {
  title: string;
  status: 'idle' | 'living' | 'ended';
  start_time: Date | null;
  end_time: Date | null;
  user_id: string;
  stream_key: string;
  viewer_count: number;
  has_stream: boolean;
  stream_check_timeout: NodeJS.Timeout | null;
  last_stream_time: Date | null;
  startLive: () => Promise<void>;
  endLive: () => Promise<void>;
  handleStreamStart: () => Promise<void>;
  cleanupTimeout: () => void;
}

const liveRoomSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['idle', 'living', 'ended'], default: 'idle' },
  start_time: { type: Date, default: null },
  end_time: { type: Date, default: null },
  user_id: { type: String, required: true },
  stream_key: { type: String, required: true, unique: true },
  viewer_count: { type: Number, default: 0 },
  has_stream: { type: Boolean, default: false },
  last_stream_time: { type: Date, default: null }
}, {
  timestamps: true
});

// 清理超时检查
liveRoomSchema.methods.cleanupTimeout = function() {
  if (this.stream_check_timeout) {
    clearTimeout(this.stream_check_timeout);
    this.stream_check_timeout = null;
  }
};

// 开始直播
liveRoomSchema.methods.startLive = async function() {
  this.status = 'living';
  this.start_time = new Date();
  this.end_time = null;
  this.has_stream = false;
  this.last_stream_time = null;
  await this.save();
};

// 结束直播
liveRoomSchema.methods.endLive = async function() {
  this.cleanupTimeout();
  this.status = 'ended';
  this.end_time = new Date();
  this.has_stream = false;
  await this.save();
};

// 处理推流开始
liveRoomSchema.methods.handleStreamStart = async function() {
  this.has_stream = true;
  this.last_stream_time = new Date();
  await this.save();
  
  // 如果是首次推流，清理初始检查计时器
  if (this.stream_check_timeout) {
    this.cleanupTimeout();
  }
};

export default mongoose.model<ILiveRoom>('LiveRoom', liveRoomSchema);
