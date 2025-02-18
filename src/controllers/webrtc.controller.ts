import { Context } from 'koa';
import LiveRoom, { LiveRoomStatus } from '../models/live-room.model';
import { injectable } from 'tsyringe';

interface UpdateStreamStatusBody {
    status: 'live' | 'finished';
}

interface CreateRoomBody {
    title: string;
}

interface WHIPSessionResponse {
    url: string;
    token: string;
}

@injectable()
export class WebRTCController {
    /**
     * 创建直播间
     */
    async createRoom(ctx: Context) {
        console.log('createRoom');
        try {
            const { title } = ctx.request.body as CreateRoomBody;
            const userId = ctx.state.user.id; // 修改这里：从 _id 改为 id

            // 生成唯一的streamKey
            const streamKey = `stream-${Math.random().toString(36).substr(2, 9)}`;

            const room = new LiveRoom({
                title,
                user_id: userId,
                stream_key: streamKey,
                status: LiveRoomStatus.PENDING
            });

            await room.save();

            // 生成WHIP推流配置
            const whipCredentials = await room.generateWHIPCredentials();

            ctx.body = {
                success: true,
                data: {
                    room,
                    whip: whipCredentials
                }
            };
        } catch (error: any) {
            console.error('创建房间错误:', error);
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取直播间WHIP配置
     */
    async getWHIPConfig(ctx: Context) {
        try {
            const roomId = ctx.params.roomId;
            const room = await LiveRoom.findById(roomId);

            if (!room) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    message: '直播间不存在'
                };
                return;
            }

            // 检查是否是房主
            if (room.user_id.toString() !== ctx.state.user.id) {
                ctx.status = 403;
                ctx.body = {
                    success: false,
                    message: '只有房主可以获取推流配置'
                };
                return;
            }

            // 生成或获取WHIP配置
            const whipConfig = await room.generateWHIPCredentials();
            
            ctx.body = {
                success: true,
                data: {
                    roomId: room._id,
                    streamKey: room.stream_key,
                    whip: whipConfig,
                    playUrl: `webrtc://${process.env.SRS_HOST || 'localhost'}/live/${room.stream_key}` // WebRTC 播放地址
                }
            };
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 更新直播状态
     */
    async updateStreamStatus(ctx: Context) {
        try {
            const { roomId } = ctx.params;
            const { status } = ctx.request.body as UpdateStreamStatusBody;

            const room = await LiveRoom.findById(roomId);
            if (!room) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    message: '直播间不存在'
                };
                return;
            }

            if (status === 'live') {
                await room.startLive();
            } else if (status === 'finished') {
                await room.endLive();
            }

            ctx.body = {
                success: true,
                data: room
            };
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取直播流状态
     */
    async getStreamStatus(ctx: Context) {
        try {
            const { roomId } = ctx.params;
            const room = await LiveRoom.findById(roomId);

            if (!room) {
                ctx.status = 404;
                ctx.body = {
                    success: false,
                    message: '直播间不存在'
                };
                return;
            }

            ctx.body = {
                success: true,
                data: {
                    status: room.status,
                    startTime: room.start_time,
                    endTime: room.end_time
                }
            };
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取所有直播间列表
     */
    async getRooms(ctx: Context) {
        try {
            const rooms = await LiveRoom.find()
                .sort({ created_at: -1 })
                .select('title status start_time end_time user_id');

            ctx.body = {
                success: true,
                data: rooms
            };
        } catch (error: any) {
            console.error('获取房间列表失败:', error);
            ctx.status = 500;
            ctx.body = {
                success: false,
                message: error.message
            };
        }
    }
}
