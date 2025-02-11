import mongoose, { Schema, Document } from 'mongoose';

// 验证码类型枚举
export enum VerificationCodeType {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password'
}

// 验证码文档接口
export interface IVerificationCode extends Document {
  phone: string;
  code: string;
  type: VerificationCodeType;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
  verify_attempts: number;
}

// 验证码Schema定义
const VerificationCodeSchema = new Schema<IVerificationCode>({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    length: 6
  },
  type: {
    type: String,
    enum: Object.values(VerificationCodeType),
    required: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  is_used: {
    type: Boolean,
    default: false
  },
  verify_attempts: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  }
});

// 索引
VerificationCodeSchema.index({ phone: 1, type: 1 });
// TTL索引，过期自动删除
VerificationCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// 创建模型
const VerificationCode = mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
