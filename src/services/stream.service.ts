import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveRoom } from '../models/live-room.model';

@Injectable()
export class StreamService {
  constructor(
    @InjectModel(LiveRoom.name) private liveRoomModel: Model<LiveRoom>,
  ) {}

  async startStream(app: string, streamId: string) {
    const liveRoom = await this.liveRoomModel.findOne({ streamId });
    if (liveRoom) {
      liveRoom.status = 'live';
      liveRoom.startTime = new Date();
      await liveRoom.save();
    }
  }

  async stopStream(app: string, streamId: string) {
    const liveRoom = await this.liveRoomModel.findOne({ streamId });
    if (liveRoom) {
      liveRoom.status = 'ended';
      liveRoom.endTime = new Date();
      await liveRoom.save();
    }
  }

  async addViewer(app: string, streamId: string) {
    await this.liveRoomModel.updateOne(
      { streamId },
      { $inc: { viewerCount: 1 } }
    );
  }

  async removeViewer(app: string, streamId: string) {
    await this.liveRoomModel.updateOne(
      { streamId },
      { $inc: { viewerCount: -1 } }
    );
  }

  async getStreamInfo(streamId: string) {
    const liveRoom = await this.liveRoomModel.findOne({ streamId });
    if (!liveRoom) {
      return null;
    }

    return {
      id: liveRoom._id,
      title: liveRoom.title,
      status: liveRoom.status,
      startTime: liveRoom.startTime,
      endTime: liveRoom.endTime,
      viewerCount: liveRoom.viewerCount,
      streamUrls: {
        flv: `${process.env.STREAM_HTTP_URL}/${streamId}.flv`,
        hls: `${process.env.STREAM_HLS_URL}/${streamId}.m3u8`,
        webrtc: `${process.env.STREAM_WEBRTC_URL}/${streamId}`
      }
    };
  }
} 
