import Router from '@koa/router';
import { Context } from 'koa';
import LiveRoom from '../models/live-room.model';

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
  const liveRoom = await LiveRoom.findOne({ stream_key: stream });
  
  if (liveRoom) {
    // 只有在房间状态为 living 时才处理推流
    if (liveRoom.status === 'living') {
      await liveRoom.handleStreamStart();
      ctx.body = { code: 0 };
    } else {
      ctx.status = 403;
      ctx.body = { code: 1, message: '直播间未开始直播' };
    }
  } else {
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
    
    // 如果房间状态是 living，更新为已结束
    if (liveRoom.status === 'living') {
      await liveRoom.endLive();
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
