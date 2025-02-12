# WebRTC信令服务器实现计划

## 1. WebSocket服务器实现

### 1.1 依赖安装
```bash
pnpm add ws @types/ws
```

### 1.2 WebSocket服务器结构
```typescript
// src/services/signaling.service.ts
interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  roomId: string;
  userId: string;
  payload: any;
}

class SignalingService {
  private rooms: Map<string, Set<WebSocket>>;
  private userConnections: Map<WebSocket, { roomId: string; userId: string }>;
}
```

### 1.3 核心功能实现
- 连接管理
  - 处理WebSocket连接
  - 用户加入/离开房间
  - 心跳检测
  - 断线重连处理

- 消息处理
  - Offer/Answer转发
  - ICE候选转发
  - 错误处理
  - 房间广播

- 权限验证
  - JWT验证
  - 房间权限检查
  - 推流权限验证

## 2. API接口设计

### 2.1 WebSocket路由
```typescript
// src/routes/signaling.routes.ts
router.ws('/signaling', signallingHandler);
```

### 2.2 房间管理API
```typescript
// 创建房间
POST /api/rooms
{
  roomId: string;
  title: string;
  isPrivate: boolean;
}

// 获取房间信息
GET /api/rooms/:roomId

// 获取房间列表
GET /api/rooms

// 更新房间状态
PUT /api/rooms/:roomId
{
  status: 'live' | 'ended';
}
```

## 3. 数据模型扩展

### 3.1 扩展LiveRoom模型
```typescript
// src/models/live-room.model.ts
interface LiveRoom {
  id: string;
  userId: string;
  title: string;
  status: 'preparing' | 'live' | 'ended';
  isPrivate: boolean;
  streamKey: string;
  startTime?: Date;
  endTime?: Date;
  viewers: number;
  maxViewers: number;
}
```

## 4. SRS服务器集成

### 4.1 SRS配置
```nginx
# conf/srs.conf
listen              1935;
max_connections     1000;
daemon              off;
http_api {
    enabled         on;
    listen          1985;
}
http_server {
    enabled         on;
    listen          8080;
}
rtc {
    enabled         on;
    listen          8000;
    # CANDIDATE-DONE
    tcp_candidates  on;
}
vhost __defaultVhost__ {
    http_remux {
        enabled     on;
        mount       [vhost]/[app]/[stream].flv;
    }
    rtc {
        enabled     on;
        # DTLS-DONE
        dtls_certificate    conf/server.crt;
        dtls_private_key   conf/server.key;
    }
}
```

### 4.2 SRS API代理
```typescript
// src/services/srs.service.ts
class SRSService {
  // 获取推流信息
  async getPublishUrl(roomId: string): Promise<string>;
  
  // 获取播放地址
  async getPlayUrl(roomId: string): Promise<{
    rtmp: string;
    flv: string;
    hls: string;
    webrtc: string;
  }>;
  
  // 获取流状态
  async getStreamStatus(roomId: string): Promise<boolean>;
}
```

## 5. 安全考虑

### 5.1 安全机制
- WebSocket连接的JWT验证
- 房间访问权限控制
- 推流鉴权
- 防止重复推流
- 限制最大连接数

### 5.2 错误处理
- 连接异常处理
- 消息格式验证
- 推流异常处理
- 重连机制

## 6. 实现步骤

1. 配置SRS服务器
   - 设置WebRTC支持
   - 配置HTTPS证书
   - 启用HTTP API

2. 实现信令服务器
   - 创建WebSocket服务器
   - 实现房间管理
   - 处理信令消息

3. 实现SRS集成
   - 创建SRS服务类
   - 实现API代理
   - 管理推流权限

4. 添加安全机制
   - 实现JWT验证中间件
   - 添加房间权限检查
   - 配置错误处理

5. 测试验证
   - 单元测试
   - 集成测试
   - 负载测试

## 7. 性能优化

### 7.1 连接优化
- WebSocket心跳检测
- 断线自动重连
- 消息队列处理

### 7.2 资源管理
- 限制单房间最大连接数
- 定期清理无效连接
- 资源使用监控

## 8. 监控报警

### 8.1 监控指标
- WebSocket连接数
- 消息处理延迟
- 房间数量
- 推流状态

### 8.2 告警机制
- 连接数超限告警
- 推流异常告警
- 服务器资源告警
