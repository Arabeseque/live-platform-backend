import Router from '@koa/router';
import { container } from 'tsyringe';
import { WebRTCController } from '../controllers/webrtc.controller';

const router = new Router({ prefix: '/api' });
const webrtcController = container.resolve(WebRTCController);

// 获取直播间WebRTC配置
router.get('/rooms/:roomId/rtc-config', (ctx) => webrtcController.getRoomConfig(ctx));

// 更新直播流状态
router.post('/rooms/:roomId/stream-status', (ctx) => webrtcController.updateStreamStatus(ctx));

// 获取直播流状态
router.get('/rooms/:roomId/stream-status', (ctx) => webrtcController.getStreamStatus(ctx));

export default router;
