# WebRTC API 测试指南

## 1. 环境准备

确保以下服务已启动：
```bash
# 启动所有服务
docker compose up -d

# 检查服务状态
docker compose ps
```

## 2. 测试步骤

### 2.1 用户登录
```bash
# 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'

# 保存返回的token，后续请求需要使用
export TOKEN="your-token-here"
```

### 2.2 创建直播间
```bash
# 创建直播间
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试直播"
  }'

# 返回示例：
{
  "success": true,
  "data": {
    "id": "ROOM_ID",
    "title": "测试直播",
    "stream_key": "stream-xxx",
    "status": "pending",
    "user_id": "USER_ID",
    "created_at": "2025-02-13T07:00:00.000Z"
  }
}

# 保存返回的roomId，后续请求需要使用
export ROOM_ID="your-room-id-here"
```

### 2.3 获取WebRTC配置
```bash
# 获取WebRTC推流配置
curl http://localhost:3000/api/rooms/$ROOM_ID/rtc-config \
  -H "Authorization: Bearer $TOKEN"

# 返回示例：
{
  "success": true,
  "data": {
    "roomId": "ROOM_ID",
    "streamKey": "stream-xxx",
    "webrtcUrl": "webrtc://localhost:8000/live/stream-xxx",
    "wsUrl": "ws://localhost:8088/rtc"
  }
}
```

### 2.4 推流测试

#### 使用OBS Studio（推荐）：
1. 打开OBS Studio
2. 配置推流服务：
   - 服务：自定义
   - 服务器：之前获取的webrtcUrl（webrtc://localhost:8000/live）
   - 串流密钥：之前获取的streamKey（stream-xxx）
3. 添加视频源（摄像头或者屏幕）
4. 点击"开始推流"

#### 使用FFmpeg（可选）：
```bash
# 推流测试视频
ffmpeg -re -i test.mp4 -c:v libx264 -preset veryfast -c:a aac \
  -f flv webrtc://localhost:8000/live/your-stream-key
```

### 2.5 更新直播状态
```bash
# 开始直播
curl -X POST http://localhost:3000/api/rooms/$ROOM_ID/stream-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live"
  }'

# 返回示例：
{
  "success": true,
  "data": {
    "status": "live",
    "startTime": "2025-02-13T07:10:00.000Z"
  }
}
```

### 2.6 获取直播状态
```bash
# 查询直播状态
curl http://localhost:3000/api/rooms/$ROOM_ID/stream-status

# 返回示例：
{
  "success": true,
  "data": {
    "status": "live",
    "startTime": "2025-02-13T07:10:00.000Z",
    "endTime": null
  }
}
```

### 2.7 结束直播
```bash
# 结束直播
curl -X POST http://localhost:3000/api/rooms/$ROOM_ID/stream-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "finished"
  }'
```

## 3. 错误排查

### 3.1 API错误
- 401 Unauthorized: 检查token是否正确及是否过期
- 404 Not Found: 检查roomId是否正确
- 400 Bad Request: 检查请求参数格式

### 3.2 推流问题
1. 检查服务状态：
```bash
# 查看SRS日志
docker compose logs srs

# 查看信令服务日志
docker compose logs signaling
```

2. 检查网络连接：
```bash
# 测试WebSocket连接
websocat ws://localhost:8088/rtc

# 测试SRS WebRTC服务
curl http://localhost:1985/api/v1/versions
```

3. 常见推流错误：
- 连接被拒绝：检查防火墙设置
- 无法获取媒体设备：检查摄像头权限
- ICE连接失败：检查STUN服务器配置

## 4. 监控指标

### 4.1 查看SRS统计
```bash
# 获取SRS概况
curl http://localhost:1985/api/v1/summaries

# 查看当前流列表
curl http://localhost:1985/api/v1/streams
```

### 4.2 查看WebSocket连接
查看信令服务日志中的连接信息：
```bash
docker compose logs --tail 100 signaling | grep "connection"
