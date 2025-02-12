import Router from '@koa/router';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = new Router({
  prefix: '/api/auth'
});

// 登录相关路由
router.post('/login', AuthController.login);

// 注册相关路由
router.post('/register', AuthController.register);

// 获取当前用户信息（需要认证）
router.get('/current-user', authMiddleware(), AuthController.getCurrentUser);

export default router;
