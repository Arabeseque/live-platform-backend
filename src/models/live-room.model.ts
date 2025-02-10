import mongoose, { Schema, Document, Model } from 'mongoose';

// 直播间状态枚举
export enum LiveRoomStatus {
  PENDING = 'pending',
  LIVE = 'live',
  FINISHED = 'finished'
}

// 直播间文档接口
export interface ILiveRoom extends Document {
  user_id: Schema.Types.ObjectId;
  title: string;
  stream_key: string;
  status: LiveRoomStatus;
  start_time: Date | null;
  end_time: Date | null;
  created_at: Date;
  updated_at: Date;

  // 实例方法
  startLive(): Promise<ILiveRoom>;
  endLive(): Promise<ILiveRoom>;
}

// 直播间Schema定义
const LiveRoomSchema = new Schema<ILiveRoom>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  stream_key: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: Object.values(LiveRoomStatus),
    default: LiveRoomStatus.PENDING
  },
  start_time: {
    type: Date,
    default: null
  },
  end_time: {
    type: Date,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 索引
LiveRoomSchema.index({ user_id: 1 });
LiveRoomSchema.index({ status: 1 });
LiveRoomSchema.index({ stream_key: 1 }, { unique: true });

// 方法：开始直播
LiveRoomSchema.methods.startLive = function(): Promise<ILiveRoom> {
  this.status = LiveRoomStatus.LIVE;
  this.start_time = new Date();
  this.end_time = null;
  return this.save();
};

// 方法：结束直播
LiveRoomSchema.methods.endLive = function(): Promise<ILiveRoom> {
  this.status = LiveRoomStatus.FINISHED;
  this.end_time = new Date();
  return this.save();
};

// 创建模型
const LiveRoom = mongoose.model<ILiveRoom>('LiveRoom', LiveRoomSchema);

export default LiveRoom;
