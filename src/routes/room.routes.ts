import Router from '@koa/router';
import { roomController } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = new Router({
  prefix: '/api/rooms'
});

// 获取直播间列表
router.get('/', roomController.getRooms.bind(roomController));

// 创建直播间
router.post('/', authMiddleware(), roomController.createRoom.bind(roomController));

// 获取直播间详情
router.get('/:id', roomController.getRoomById.bind(roomController));

// 开始直播
router.post('/:id/start', authMiddleware(), roomController.startLive.bind(roomController));

// 结束直播
router.post('/:id/end', authMiddleware(), roomController.endLive.bind(roomController));

export default router;
