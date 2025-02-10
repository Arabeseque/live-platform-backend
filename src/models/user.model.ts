import mongoose, { Schema, Document } from 'mongoose';

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  STREAMER = 'streamer',
  ADMIN = 'admin'
}

// 用户文档接口
export interface IUser extends Document {
  username: string;
  nickname: string;
  avatar_url: string;
  password_hash: string;
  phone: string;
  balance: number;
  role: UserRole;
  last_login_time: Date;
  last_login_ip: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// 用户Schema定义
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  avatar_url: {
    type: String,
    default: 'default-avatar.png' // 默认头像
  },
  password_hash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  last_login_time: {
    type: Date
  },
  last_login_ip: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 虚拟字段：完整的头像URL
UserSchema.virtual('avatar_full_url').get(function() {
  if (this.avatar_url.startsWith('http')) {
    return this.avatar_url;
  }
  // TODO: 配置文件中定义基础URL
  return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/avatars/${this.avatar_url}`;
});

// 创建模型
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
