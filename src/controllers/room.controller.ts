import { Context } from 'koa';
import LiveRoom from '../models/live-room.model';

export class RoomController {
  // 获取直播间列表
  async getRooms(ctx: Context) {
    const rooms = await LiveRoom.find({
      status: { $in: ['idle', 'living'] }
    }).sort({
      status: -1,
      createdAt: -1
    });

    ctx.body = {
      code: 0,
      message: 'success',
      data: rooms.map(room => ({
        id: room._id,
        title: room.title,
        status: room.status,
        start_time: room.start_time,
        end_time: room.end_time,
        viewer_count: room.viewer_count,
        stream_key: room.stream_key,
        user_id: room.user_id,
        streamUrls: {
          flv: `${process.env.STREAM_HTTP_URL}/${room.stream_key}.flv`,
          hls: `${process.env.STREAM_HLS_URL}/${room.stream_key}.m3u8`,
          webrtc: `${process.env.STREAM_WEBRTC_URL}/${room.stream_key}`
        }
      }))
    };
  }

  // 创建直播间
  async createRoom(ctx: Context) {
    const body = ctx.request.body as { title: string };
    if (!body.title) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '直播间标题不能为空'
      };
      return;
    }

    const userId = ctx.state.user.id;
    const existingRoom = await LiveRoom.findOne({
      user_id: userId,
      status: { $in: ['idle', 'living'] }
    });

    if (existingRoom) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '您已有一个直播间，请先结束当前直播'
      };
      return;
    }

    const room = new LiveRoom({
      title: body.title,
      user_id: userId,
      stream_key: `${userId}_${Date.now()}`
    });

    await room.save();

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        id: room._id,
        title: room.title,
        status: room.status,
        start_time: room.start_time,
        end_time: room.end_time,
        viewer_count: room.viewer_count,
        stream_key: room.stream_key,
        user_id: room.user_id,
        streamUrls: {
          flv: `${process.env.STREAM_HTTP_URL}/${room.stream_key}.flv`,
          hls: `${process.env.STREAM_HLS_URL}/${room.stream_key}.m3u8`,
          webrtc: `${process.env.STREAM_WEBRTC_URL}/${room.stream_key}`
        }
      }
    };
  }

  // 获取直播间详情
  async getRoomById(ctx: Context) {
    const { id } = ctx.params;
    const room = await LiveRoom.findById(id);

    if (!room) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '直播间不存在'
      };
      return;
    }

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        id: room._id,
        title: room.title,
        status: room.status,
        start_time: room.start_time,
        end_time: room.end_time,
        viewer_count: room.viewer_count,
        stream_key: room.stream_key,
        user_id: room.user_id,
        streamUrls: {
          flv: `${process.env.STREAM_HTTP_URL}/${room.stream_key}.flv`,
          hls: `${process.env.STREAM_HLS_URL}/${room.stream_key}.m3u8`,
          webrtc: `${process.env.STREAM_WEBRTC_URL}/${room.stream_key}`
        }
      }
    };
  }

  // 开始直播
  async startLive(ctx: Context) {
    const { id } = ctx.params;
    const room = await LiveRoom.findById(id);

    if (!room) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '直播间不存在'
      };
      return;
    }

    if (room.user_id !== ctx.state.user.id) {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: '只有房主可以开始直播'
      };
      return;
    }

    await room.startLive();

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        id: room._id,
        title: room.title,
        status: room.status,
        start_time: room.start_time,
        end_time: room.end_time,
        viewer_count: room.viewer_count,
        stream_key: room.stream_key,
        user_id: room.user_id,
        streamUrls: {
          flv: `${process.env.STREAM_HTTP_URL}/${room.stream_key}.flv`,
          hls: `${process.env.STREAM_HLS_URL}/${room.stream_key}.m3u8`,
          webrtc: `${process.env.STREAM_WEBRTC_URL}/${room.stream_key}`
        }
      }
    };
  }

  // 结束直播
  async endLive(ctx: Context) {
    const { id } = ctx.params;
    const room = await LiveRoom.findById(id);

    if (!room) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '直播间不存在'
      };
      return;
    }

    if (room.user_id !== ctx.state.user.id) {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: '只有房主可以结束直播'
      };
      return;
    }

    await room.endLive();

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        id: room._id,
        title: room.title,
        status: room.status,
        start_time: room.start_time,
        end_time: room.end_time,
        viewer_count: room.viewer_count,
        stream_key: room.stream_key,
        user_id: room.user_id,
        streamUrls: {
          flv: `${process.env.STREAM_HTTP_URL}/${room.stream_key}.flv`,
          hls: `${process.env.STREAM_HLS_URL}/${room.stream_key}.m3u8`,
          webrtc: `${process.env.STREAM_WEBRTC_URL}/${room.stream_key}`
        }
      }
    };
  }
}

export const roomController = new RoomController();
