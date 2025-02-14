import { Context } from 'koa';
import LiveRoom, { LiveRoomStatus } from '../models/live-room.model';
import { randomBytes } from 'crypto';

// 请求体接口定义
interface CreateRoomRequest {
  title: string;
  user_id: string;
}

interface UpdateStatusRequest {
  action: 'start' | 'end';
}

export class LiveRoomController {
  /**
   * 创建直播间
   */
  static async create(ctx: Context) {
    try {
      const { title, user_id } = ctx.request.body as CreateRoomRequest;

      // 验证请求数据
      if (!title || !user_id) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '标题和用户ID是必需的'
        };
        return;
      }

      // 生成唯一的stream_key
      const stream_key = randomBytes(16).toString('hex');

      // 创建直播间
      const liveRoom = new LiveRoom({
        title,
        user_id,
        stream_key,
        status: LiveRoomStatus.PENDING,
      });

      // 保存到数据库
      await liveRoom.save();

      ctx.body = {
        code: 200,
        data: {
          roomId: liveRoom._id,
          stream_key: liveRoom.stream_key,
          title: liveRoom.title,
          status: liveRoom.status
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建直播间失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 获取直播间信息
   */
  static async getRoom(ctx: Context) {
    try {
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
        code: 200,
        data: {
          roomId: room._id,
          title: room.title,
          status: room.status,
          start_time: room.start_time,
          end_time: room.end_time
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取直播间信息失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 更新直播间状态
   */
  static async updateStatus(ctx: Context) {
    try {
      const { id } = ctx.params;
      const { action } = ctx.request.body as UpdateStatusRequest;

      const room = await LiveRoom.findById(id);
      
      if (!room) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '直播间不存在'
        };
        return;
      }

      switch (action) {
        case 'start':
          await room.startLive();
          break;
        case 'end':
          await room.endLive();
          break;
        default:
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '无效的操作'
          };
          return;
      }

      ctx.body = {
        code: 200,
        data: {
          roomId: room._id,
          status: room.status,
          start_time: room.start_time,
          end_time: room.end_time
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '更新直播间状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}
