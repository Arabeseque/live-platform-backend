import { Context } from 'koa';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import { CreateUserDTO, UpdateUserDTO, UserQueryDTO, toUserResponseDTO } from '../dto/user.dto.js';
import { success, successWithPagination, handlePagination } from '../utils/response.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * 用户控制器
 */
export class UserController {
  /**
   * 创建用户
   */
  static async create(ctx: Context) {
    const userData: CreateUserDTO = ctx.request.body as CreateUserDTO;

    // 检查用户名和手机号是否已存在
    const existingUser = await User.findOne({
      $or: [
        { username: userData.username },
        { phone: userData.phone }
      ]
    });

    if (existingUser) {
      throw new ConflictError('用户名或手机号已存在');
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);

    // 创建用户
    const user = await User.create({
      ...userData,
      password_hash
    });

    ctx.status = 201;
    ctx.body = success(toUserResponseDTO(user), '用户创建成功');
  }

  /**
   * 获取用户详情
   */
  static async getById(ctx: Context) {
    const { id } = ctx.params;
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    ctx.body = success(toUserResponseDTO(user));
  }

  /**
   * 更新用户
   */
  static async update(ctx: Context) {
    const { id } = ctx.params;
    const updateData: UpdateUserDTO = ctx.request.body as UpdateUserDTO;

    // 如果更新手机号，检查是否已存在
    if (updateData.phone) {
      const existingUser = await User.findOne({
        phone: updateData.phone,
        _id: { $ne: id }
      });

      if (existingUser) {
        throw new ConflictError('手机号已被使用');
      }
    }

    // 如果更新密码，需要加密
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(updateData.password, salt);
      updateData.password_hash = password_hash;
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    ctx.body = success(toUserResponseDTO(user), '用户更新成功');
  }

  /**
   * 获取用户列表
   */
  static async list(ctx: Context) {
    const query: UserQueryDTO = ctx.query;
    const { page, limit } = handlePagination(query);

    // 构建查询条件
    const conditions: any = {};
    
    if (query.role) {
      conditions.role = query.role;
    }
    
    if (typeof query.is_active === 'boolean') {
      conditions.is_active = query.is_active;
    }
    
    if (query.keyword) {
      conditions.$or = [
        { username: new RegExp(query.keyword, 'i') },
        { nickname: new RegExp(query.keyword, 'i') }
      ];
    }

    // 执行查询
    const [users, total] = await Promise.all([
      User.find(conditions)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ created_at: -1 }),
      User.countDocuments(conditions)
    ]);

    const userList = users.map(toUserResponseDTO);

    ctx.body = successWithPagination({
      list: userList,
      total,
      page,
      limit
    });
  }

  /**
   * 删除用户（软删除）
   */
  static async delete(ctx: Context) {
    const { id } = ctx.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    ctx.body = success(toUserResponseDTO(user), '用户已停用');
  }
}
