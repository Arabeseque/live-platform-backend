import Router from '@koa/router';
import { UserController } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { UserRole } from '../models/user.model.js';

const router = new Router({ prefix: '/api/users' });

// 创建用户 (仅管理员)
router.post('/', authMiddleware([UserRole.ADMIN]), UserController.create);

// 获取用户详情 (已登录用户)
router.get('/:id', authMiddleware(), UserController.getById);

// 更新用户 (本人或管理员 - 在控制器中验证)
router.patch('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), UserController.update);

// 获取用户列表 (仅管理员)
router.get('/', authMiddleware([UserRole.ADMIN]), UserController.list);

// 删除用户 (仅管理员)
router.delete('/:id', authMiddleware([UserRole.ADMIN]), UserController.delete);

export default router;
