import Router from '@koa/router';
import { UserController } from '../controllers/user.controller.js';

const router = new Router({ prefix: '/api/users' });

// 创建用户
router.post('/', UserController.create);

// 获取用户详情
router.get('/:id', UserController.getById);

// 更新用户
router.patch('/:id', UserController.update);

// 获取用户列表
router.get('/', UserController.list);

// 删除用户（软删除）
router.delete('/:id', UserController.delete);

export default router;
