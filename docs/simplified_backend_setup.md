# 简化版WebRTC直播后端实现方案

## 1. 项目结构
```
live-platform/
├── docker-compose.yml       # Docker编排文件
├── docker/
│   ├── srs/
│   │   ├── Dockerfile
│   │   └── srs.conf        # SRS配置文件
│   └── signaling/
│       └── Dockerfile
├── src/
│   ├── signaling/          # 信令服务器实现
│   │   ├── index.ts        # 入口文件
│   │   ├── ws-server.ts    # WebSocket服务
│   │   └── room-manager.ts # 房间管理
│   ├── controllers/
│   │   └── room.ts         # 房间控制器
│   └── types/
│       └── room.ts         # 类型定义
```

## 2. Docker配置

### 2.1 docker-compose.yml
```yaml
version: '3'

services:
  srs:
    build: ./docker/srs
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"  # HTTP服务
      - "8000:8000"  # WebRTC
    volumes:
      - ./docker/srs/srs.conf:/usr/local/srs/conf/srs.conf
    restart: always

  signaling:
    build: ./docker/signaling
    ports:
      - "8088:8088"  # WebSocket服务
    environment:
      - NODE_ENV=production
    depends_on:
      - srs
    restart: always
```

## 3. 房间管理实现

### 3.1 类型定义 (room.ts)
```typescript
export interface Room {
  id: string;
  title: string;
  streamKey: string;
  status: 'preparing' | 'live' | 'ended';
  startTime?: number;
  endTime?: number;
  viewerCount: number;
}

export interface CreateRoomParams {
  title: string;
}
```

### 3.2 房间管理器 (room-manager.ts)
```typescript
class RoomManager {
  private rooms: Map<string, Room> = new Map();

  // 创建房间
  createRoom(params: CreateRoomParams): Room {
    const roomId = Math.random().toString(36).substr(2, 9);
    const streamKey = `stream-${roomId}`;
    
    const room: Room = {
      id: roomId,
      title: params.title,
      streamKey,
      status: 'preparing',
      viewerCount: 0
    };
    
    this.rooms.set(roomId, room);
    return room;
  }

  // 获取房间信息
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // 获取所有直播房间
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  // 更新房间状态
  updateRoomStatus(roomId: string, status: Room['status']): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      if (status === 'live') {
        room.startTime = Date.now();
      } else if (status === 'ended') {
        room.endTime = Date.now();
      }
    }
  }

  // 更新观众数量
  updateViewerCount(roomId: string, delta: number): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.viewerCount += delta;
      if (room.viewerCount < 0) room.viewerCount = 0;
    }
  }

  // 关闭房间
  closeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'ended';
      room.endTime = Date.now();
    }
  }
}

export const roomManager = new RoomManager();
```

### 3.3 房间控制器 (room.ts)
```typescript
import express from 'express';
import { roomManager } from '../signaling/room-manager';

const router = express.Router();

// 创建房间
router.post('/rooms', (req, res) => {
  const { title } = req.body;
  const room = roomManager.createRoom({ title });
  res.json(room);
});

// 获取所有房间
router.get('/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms();
  res.json(rooms);
});

// 获取房间信息
router.get('/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json(room);
});

// 关闭房间
router.post('/rooms/:roomId/close', (req, res) => {
  const { roomId } = req.params;
  roomManager.closeRoom(roomId);
  res.json({ success: true });
});

export default router;
```

### 3.4 WebSocket服务扩展 (ws-server.ts)
```typescript
import WebSocket from 'ws';
import { Server } from 'http';
import { roomManager } from './room-manager';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  payload: any;
  roomId: string;
}

export class SignalingServer {
  private wss: WebSocket.Server;
  private rooms: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          const data: SignalingMessage = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (err) {
          console.error('消息处理错误:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: SignalingMessage) {
    const { type, roomId } = message;
    
    switch (type) {
      case 'join':
        this.handleJoin(ws, roomId);
        break;
      case 'leave':
        this.handleLeave(ws, roomId);
        break;
      default:
        this.broadcastToRoom(roomId, message, ws);
    }
  }

  private handleJoin(ws: WebSocket, roomId: string) {
    // 加入房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)?.add(ws);
    
    // 更新观众数量
    roomManager.updateViewerCount(roomId, 1);
  }

  private handleLeave(ws: WebSocket, roomId: string) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId)?.delete(ws);
      roomManager.updateViewerCount(roomId, -1);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        roomManager.updateViewerCount(roomId, -1);
        if (clients.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });
  }

  private broadcastToRoom(roomId: string, message: SignalingMessage, sender: WebSocket) {
    this.rooms.get(roomId)?.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}
```

### 3.5 入口文件更新 (index.ts)
```typescript
import express from 'express';
import http from 'http';
import { SignalingServer } from './ws-server';
import roomRouter from '../controllers/room';

const app = express();
const server = http.createServer(app);

// 中间件
app.use(express.json());

// 初始化WebSocket服务器
new SignalingServer(server);

// API路由
app.use('/api', roomRouter);

const PORT = process.env.PORT || 8088;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 4. API接口说明

### 4.1 HTTP接口
- `POST /api/rooms` - 创建直播房间
- `GET /api/rooms` - 获取所有直播房间列表
- `GET /api/rooms/:roomId` - 获取特定房间信息
- `POST /api/rooms/:roomId/close` - 关闭直播房间

### 4.2 WebSocket消息
```typescript
// 加入房间
{
  type: 'join',
  roomId: string
}

// 离开房间
{
  type: 'leave',
  roomId: string
}

// WebRTC信令
{
  type: 'offer' | 'answer' | 'candidate',
  roomId: string,
  payload: any
}
```

## 5. 部署和使用

1. 启动服务
```bash
docker-compose up -d
```

2. 创建房间
```bash
curl -X POST http://localhost:8088/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"title": "测试直播间"}'
```

3. 获取房间列表
```bash
curl http://localhost:8088/api/rooms
```

4. WebRTC地址格式
```
webrtc://localhost:8000/live/{streamKey}
```

## 6. 注意事项

1. 直播状态变化
   - 开始推流时自动更新状态为'live'
   - 断开推流后自动更新状态为'ended'

2. 观众计数
   - 加入房间时自动增加
   - 离开房间时自动减少
   - 断开连接时自动清理

3. 房间清理
   - 直播结束后房间信息保留
   - 可以通过API手动关闭房间
