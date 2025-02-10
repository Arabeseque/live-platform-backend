import mongoose, { Schema, Document } from 'mongoose';

// 弹幕消息文档接口
export interface IDanmakuMessage extends Document {
  user_id: Schema.Types.ObjectId;
  room_id: Schema.Types.ObjectId;
  content: string;
  color: string;
  font_size: number;
  is_sensitive: boolean;
  created_at: Date;
}

// 弹幕消息Schema定义
const DanmakuMessageSchema = new Schema<IDanmakuMessage>({
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
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  color: {
    type: String,
    default: '#FFFFFF',
    // 验证颜色格式
    validate: {
      validator: function(v: string) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: '颜色格式无效'
    }
  },
  font_size: {
    type: Number,
    default: 14,
    min: 12,
    max: 36
  },
  is_sensitive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// 索引
DanmakuMessageSchema.index({ room_id: 1, created_at: 1 });
DanmakuMessageSchema.index({ user_id: 1, created_at: -1 });

// 静态方法：批量创建弹幕
DanmakuMessageSchema.statics.createBatch = async function(messages: Array<Partial<IDanmakuMessage>>) {
  return await this.insertMany(messages);
};

// 方法：标记为敏感
DanmakuMessageSchema.methods.markAsSensitive = function() {
  this.is_sensitive = true;
  return this.save();
};

// 创建模型
const DanmakuMessage = mongoose.model<IDanmakuMessage>('DanmakuMessage', DanmakuMessageSchema);

export default DanmakuMessage;
