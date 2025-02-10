import { UserRole } from '../models/user.model.js';

/**
 * 创建用户DTO
 */
export interface CreateUserDTO {
  username: string;
  nickname: string;
  password: string;
  phone: string;
  avatar_url?: string;
  role?: UserRole;
}

/**
 * 更新用户DTO
 */
export interface UpdateUserDTO {
  nickname?: string;
  avatar_url?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  password_hash?: string; // 添加 password_hash 字段
}

/**
 * 用户查询DTO
 */
export interface UserQueryDTO {
  keyword?: string;    // 用户名或昵称
  role?: UserRole;     // 用户角色
  is_active?: boolean; // 是否激活
  page?: number;       // 页码
  limit?: number;      // 每页条数
}

/**
 * 用户响应DTO
 */
export interface UserResponseDTO {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string;
  phone: string;
  balance: number;
  role: UserRole;
  last_login_time?: Date;
  last_login_ip?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

/**
 * 转换为用户响应DTO
 * @param user 用户模型实例
 */
export function toUserResponseDTO(user: any): UserResponseDTO {
  return {
    id: user._id.toString(),
    username: user.username,
    nickname: user.nickname,
    avatar_url: user.avatar_full_url || user.avatar_url,
    phone: user.phone,
    balance: user.balance,
    role: user.role,
    last_login_time: user.last_login_time,
    last_login_ip: user.last_login_ip,
    created_at: user.created_at,
    updated_at: user.updated_at,
    is_active: user.is_active
  };
}
