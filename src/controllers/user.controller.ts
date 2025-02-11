import { Context } from 'koa';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import { CreateUserDTO, UpdateUserDTO, UserQueryDTO, toUserResponseDTO } from '../dto/user.dto.js';
import { success, successWithPagination, handlePagination } from '../utils/response.js';
import { ValidationError, NotFoundError, ConflictError, AuthorizationError } from '../utils/errors.js';

/**
 * 用户控制器
 */
export class UserController {
  /**
   * @swagger
   * /api/users:
   *   post:
   *     tags:
   *       - 用户管理
   *     summary: 创建用户
   *     description: 创建新用户账号
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *               - nickname
   *               - phone
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *                 minLength: 3
   *                 maxLength: 30
   *               password:
   *                 type: string
   *                 description: 密码
   *                 format: password
   *               nickname:
   *                 type: string
   *                 description: 昵称
   *                 maxLength: 30
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               avatar_url:
   *                 type: string
   *                 description: 头像URL
   *               role:
   *                 type: string
   *                 enum: [user, streamer, admin]
   *                 description: 用户角色
   *     responses:
   *       201:
   *         description: 用户创建成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: 参数验证失败
   *       409:
   *         description: 用户名或手机号已存在
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
   * @swagger
   * /api/users/{id}:
   *   get:
   *     tags:
   *       - 用户管理
   *     summary: 获取用户详情
   *     description: 获取指定用户的详细信息（需要管理员权限或本人）
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 用户ID
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: 未认证
   *       403:
   *         description: 没有权限
   *       404:
   *         description: 用户不存在
   */
  static async getById(ctx: Context) {
    const { id } = ctx.params;
    const user = await User.findById(id);
    
    // 验证权限：只有管理员或本人可以查看详细信息
    const currentUser = ctx.state.user;
    const isAdmin = currentUser.role === 'admin';
    const isSelf = currentUser.id === id;
    if (!isAdmin && !isSelf) {
      throw new AuthorizationError('没有权限查看其他用户的信息');
    }

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    ctx.body = success(toUserResponseDTO(user));
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     tags:
   *       - 用户管理
   *     summary: 更新用户信息
   *     description: 更新指定用户的信息（需要管理员权限或本人）
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 用户ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nickname:
   *                 type: string
   *                 description: 昵称
   *               avatar_url:
   *                 type: string
   *                 description: 头像URL
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               password:
   *                 type: string
   *                 description: 新密码
   *               role:
   *                 type: string
   *                 enum: [user, streamer, admin]
   *                 description: 用户角色
   *               is_active:
   *                 type: boolean
   *                 description: 是否激活
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: 未认证
   *       403:
   *         description: 没有权限
   *       404:
   *         description: 用户不存在
   *       409:
   *         description: 手机号已被使用
   */
  static async update(ctx: Context) {
    const { id } = ctx.params;
    const updateData: UpdateUserDTO = ctx.request.body as UpdateUserDTO;

    // 验证权限：只有管理员或本人可以更新用户信息
    const currentUser = ctx.state.user;
    const isAdmin = currentUser.role === 'admin';
    const isSelf = currentUser.id === id;
    if (!isAdmin && !isSelf) {
      throw new AuthorizationError('没有权限修改其他用户的信息');
    }

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
   * @swagger
   * /api/users:
   *   get:
   *     tags:
   *       - 用户管理
   *     summary: 获取用户列表
   *     description: 获取用户列表（需要管理员权限）
   *     parameters:
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（用户名或昵称）
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [user, streamer, admin]
   *         description: 用户角色
   *       - in: query
   *         name: is_active
   *         schema:
   *           type: boolean
   *         description: 是否激活
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 list:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserResponse'
   *                 total:
   *                   type: integer
   *                   description: 总记录数
   *                 page:
   *                   type: integer
   *                   description: 当前页码
   *                 limit:
   *                   type: integer
   *                   description: 每页数量
   *       401:
   *         description: 未认证
   *       403:
   *         description: 没有权限
   */
  static async list(ctx: Context) {
    // 验证权限：只有管理员可以获取用户列表
    const currentUser = ctx.state.user;
    const isAdmin = currentUser.role === 'admin';
    if (!isAdmin) {
      throw new AuthorizationError('没有权限访问用户列表');
    }

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
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     tags:
   *       - 用户管理
   *     summary: 停用用户
   *     description: 停用指定用户（软删除，需要管理员权限）
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 用户ID
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 停用成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: 未认证
   *       403:
   *         description: 没有权限
   *       404:
   *         description: 用户不存在
   */
  static async delete(ctx: Context) {
    const { id } = ctx.params;

    // 验证权限：只有管理员可以停用用户
    const currentUser = ctx.state.user;
    const isAdmin = currentUser.role === 'admin';
    if (!isAdmin) {
      throw new AuthorizationError('没有权限停用用户');
    }
    
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
