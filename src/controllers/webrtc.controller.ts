import { Context } from 'koa';
import LiveRoom, { LiveRoomStatus } from '../models/live-room.model';
import { injectable } from 'tsyringe';

interface UpdateStreamStatusBody {
    status: 'live' | 'finished';
}

@injectable()
export class WebRTCController {
    /**
     * 获取直播间WebRTC配置
     */
    async getRoomConfig(ctx: Context) {
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

            // 返回WebRTC所需的配置信息
            ctx.body = {
                success: true,
                data: {
                    roomId: room._id,
                    streamKey: room.stream_key,
                    webrtcUrl: `webrtc://${ctx.host}:8000/live/${room.stream_key}`,
                    wsUrl: `ws://${ctx.host}:8088/rtc`
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
}
