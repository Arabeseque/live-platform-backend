import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import LiveRoom, { LiveRoomStatus } from '../models/live-room.model';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  payload: any;
}

export class WebRTCSignalingService {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', async (message: string) => {
        try {
          const data: SignalingMessage = JSON.parse(message);
          console.log('收到消息:', data);
          await this.handleMessage(ws, data);
        } catch (err) {
          console.error('消息处理错误:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: SignalingMessage) {
    const { type, roomId, payload } = message;

    // 验证房间是否存在且正在直播
    const room = await LiveRoom.findById(roomId);
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', payload: '房间不存在' }));
      return;
    }

    switch (type) {
      case 'join':
        console.log('加入房间:', roomId);
        await this.handleJoin(ws, roomId);
        break;
      case 'leave':
        await this.handleLeave(ws, roomId);
        break;
      case 'offer':
        if (room.status !== LiveRoomStatus.LIVE) {
          room.startLive(); // 收到推流offer时自动开始直播
        }
        this.broadcastToRoom(roomId, message, ws);
        break;
      default:
        this.broadcastToRoom(roomId, message, ws);
    }
  }

  private async handleJoin(ws: WebSocket, roomId: string) {
    // 加入房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)?.add(ws);
    
    // 通知房间内其他用户
    this.broadcastToRoom(roomId, {
      type: 'user-joined',
      roomId,
      payload: { timestamp: Date.now() }
    }, ws);
  }

  private async handleLeave(ws: WebSocket, roomId: string) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.rooms.delete(roomId);
          
          // 当所有用户离开时，检查并结束直播
          const liveRoom = await LiveRoom.findById(roomId);
          if (liveRoom && liveRoom.status === LiveRoomStatus.LIVE) {
            await liveRoom.endLive();
          }
        }
      }
    }
  }

  private handleDisconnect(ws: WebSocket) {
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(ws)) {
        this.handleLeave(ws, roomId);
      }
    });
  }

  private broadcastToRoom(roomId: string, message: any, sender: WebSocket) {
    const room = this.rooms.get(roomId);
    if (room) {
      const messageStr = JSON.stringify(message);
      room.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }
}
