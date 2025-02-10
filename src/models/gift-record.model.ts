import mongoose, { Schema, Document } from 'mongoose';

// 礼物记录文档接口
export interface IGiftRecord extends Document {
  user_id: Schema.Types.ObjectId;
  room_id: Schema.Types.ObjectId;
  gift_id: Schema.Types.ObjectId;
  gift_name: string;
  gift_icon_url: string;
  gift_price: number;
  quantity: number;
  total_price: number;
  created_at: Date;
}

// 礼物记录Schema定义
const GiftRecordSchema = new Schema<IGiftRecord>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room_id: {
    type: Schema.Types.ObjectId,
    ref: 'LiveRoom',
    required: true
  },
  gift_id: {
    type: Schema.Types.ObjectId,
    ref: 'Gift',
    required: true
  },
  // 冗余存储礼物信息，避免频繁关联查询
  gift_name: {
    type: String,
    required: true
  },
  gift_icon_url: {
    type: String,
    required: true
  },
  gift_price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// 索引
GiftRecordSchema.index({ room_id: 1, created_at: -1 });
GiftRecordSchema.index({ user_id: 1, created_at: -1 });

// 虚拟字段：完整的礼物图标URL
GiftRecordSchema.virtual('gift_icon_full_url').get(function() {
  if (this.gift_icon_url.startsWith('http')) {
    return this.gift_icon_url;
  }
  // TODO: 配置文件中定义基础URL
  return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/gifts/${this.gift_icon_url}`;
});

// 创建模型
const GiftRecord = mongoose.model<IGiftRecord>('GiftRecord', GiftRecordSchema);

export default GiftRecord;
