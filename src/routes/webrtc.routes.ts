import Router from '@koa/router';
import { container } from 'tsyringe';
import { WebRTCController } from '../controllers/webrtc.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = new Router({ prefix: '/api/rooms' });
const webrtcController = container.resolve(WebRTCController);

// 创建直播间（需要认证）
// 接口 URL: POST /api/rooms
router.post('/', authMiddleware(), (ctx) => webrtcController.createRoom(ctx));

// 获取直播间WebRTC配置
router.get('/:roomId/rtc-config', authMiddleware(), (ctx) => webrtcController.getRoomConfig(ctx));

// 更新直播流状态（需要认证）
router.post('/:roomId/stream-status', authMiddleware(), (ctx) => webrtcController.updateStreamStatus(ctx));

// 获取直播流状态
router.get('/:roomId/stream-status', (ctx) => webrtcController.getStreamStatus(ctx));

export default router;
