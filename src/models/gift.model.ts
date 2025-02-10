import mongoose, { Schema, Document } from 'mongoose';

// 礼物文档接口
export interface IGift extends Document {
  name: string;
  icon_url: string;
  price: number;
  description: string;
  is_available: boolean;
  created_at: Date;
}

// 礼物Schema定义
const GiftSchema = new Schema<IGift>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  icon_url: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  is_available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// 虚拟字段：完整的图标URL
GiftSchema.virtual('icon_full_url').get(function() {
  if (this.icon_url.startsWith('http')) {
    return this.icon_url;
  }
  // TODO: 配置文件中定义基础URL
  return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/gifts/${this.icon_url}`;
});

// 创建模型
const Gift = mongoose.model<IGift>('Gift', GiftSchema);

export default Gift;
