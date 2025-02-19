import Router from '@koa/router';
import { Context } from 'koa';
import LiveRoom from '../models/live-room.model';
import { websocketController } from '../controllers/websocket.controller';

interface SRSCallbackBody {
  app: string;
  stream: string;
  action?: string;
  client_id?: string;
  ip?: string;
  vhost?: string;
}

const router = new Router({
  prefix: '/api/stream'
});

// SRS 推流开始回调
router.post('/on_publish', async (ctx: Context) => {
  const { app, stream } = ctx.request.body as SRSCallbackBody;
  console.log('收到推流请求:', { stream_key: stream, body: ctx.request.body });
  
  const liveRoom = await LiveRoom.findOne({ stream_key: stream });
  console.log('查询到的房间:', liveRoom ? {
    id: liveRoom._id,
    status: liveRoom.status,
    stream_key: liveRoom.stream_key,
    has_stream: liveRoom.has_stream
  } : null);
  
  if (liveRoom) {
    // 只有在房间状态为 living 时才处理推流
    if (liveRoom.status === 'living') {
      console.log(`房间 ${liveRoom._id} 状态正确，处理推流开始`);
      await liveRoom.handleStreamStart();
      ctx.body = { code: 0 };
    } else {
      console.log(`房间 ${liveRoom._id} 状态错误: ${liveRoom.status}`);
      ctx.status = 403;
      ctx.body = { code: 1, message: '直播间未开始直播' };
    }
  } else {
    console.log('未找到直播间:', { stream_key: stream });
    ctx.status = 404;
    ctx.body = { code: 1, message: 'Stream not found' };
  }
});

// SRS 推流结束回调
router.post('/on_unpublish', async (ctx: Context) => {
  const { app, stream } = ctx.request.body as SRSCallbackBody;
  const liveRoom = await LiveRoom.findOne({ stream_key: stream });
  
  if (liveRoom) {
    // 设置推流状态为 false
    liveRoom.has_stream = false;
    await liveRoom.save();
    
    // 只有当房间状态为 living 时才结束直播
    // 如果是 idle 状态，让初始检查计时器继续运行
    if (liveRoom.status === 'living') {
      console.log(`房间 ${liveRoom._id} 推流结束，结束直播`);
      await liveRoom.endLive();
      
      websocketController.broadcast({
        type: 'roomEnded',
        data: {
          roomId: liveRoom._id,
          reason: '主播结束推流，直播已结束'
        }
      });
    }
    
    ctx.body = { code: 0 };
  } else {
    ctx.status = 404;
    ctx.body = { code: 1, message: 'Stream not found' };
  }
});

// SRS 播放开始回调
router.post('/on_play', async (ctx: Context) => {
  const { app, stream } = ctx.request.body as SRSCallbackBody;
  await LiveRoom.updateOne(
    { stream_key: stream },
    { $inc: { viewer_count: 1 } }
  );
  ctx.body = { code: 0 };
});

// SRS 播放结束回调
router.post('/on_stop', async (ctx: Context) => {
  const { app, stream } = ctx.request.body as SRSCallbackBody;
  await LiveRoom.updateOne(
    { stream_key: stream },
    { $inc: { viewer_count: -1 } }
  );
  ctx.body = { code: 0 };
});

// 获取直播流信息
router.get('/info/:streamId', async (ctx: Context) => {
  const { streamId } = ctx.params;
  const liveRoom = await LiveRoom.findOne({ stream_key: streamId });
  
  if (!liveRoom) {
    ctx.status = 404;
    ctx.body = { code: 1, message: 'Stream not found' };
    return;
  }

  ctx.body = {
    id: liveRoom._id,
    title: liveRoom.title,
    status: liveRoom.status,
    startTime: liveRoom.start_time,
    endTime: liveRoom.end_time,
    viewerCount: liveRoom.viewer_count || 0,
    streamUrls: {
      flv: `${process.env.STREAM_HTTP_URL}/${streamId}.flv`,
      hls: `${process.env.STREAM_HLS_URL}/${streamId}.m3u8`,
      webrtc: `${process.env.STREAM_WEBRTC_URL}/${streamId}`
    }
  };
});

export default router;
