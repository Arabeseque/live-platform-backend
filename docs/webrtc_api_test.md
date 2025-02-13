# WebRTC API 测试步骤

## 前置条件
- 确保服务已经启动：`docker compose up`
- 已经登录并获取了JWT token

## 测试步骤

### 1. 创建直播间
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试直播间"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "id": "ROOM_ID",
    "title": "测试直播间",
    "status": "preparing"
  }
}
```

### 2. 获取WebRTC配置
```bash
curl http://localhost:3000/api/rooms/ROOM_ID/rtc-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

预期响应：
```json
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

### 3. 开始直播
```bash
curl -X POST http://localhost:3000/api/rooms/ROOM_ID/stream-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "live",
    "startTime": "2025-02-13T03:00:00.000Z"
  }
}
```

### 4. 查询直播状态
```bash
curl http://localhost:3000/api/rooms/ROOM_ID/stream-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "live",
    "startTime": "2025-02-13T03:00:00.000Z",
    "endTime": null
  }
}
```

### 5. 结束直播
```bash
curl -X POST http://localhost:3000/api/rooms/ROOM_ID/stream-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "finished"
  }'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "finished",
    "startTime": "2025-02-13T03:00:00.000Z",
    "endTime": "2025-02-13T04:00:00.000Z"
  }
}
```

## WebSocket测试

WebSocket连接可以使用wscat工具测试：

```bash
# 安装wscat
npm install -g wscat

# 连接到WebSocket服务器
wscat -c ws://localhost:8088/rtc

# 发送加入房间消息
{"type":"join","roomId":"ROOM_ID"}

# 发送offer
{
  "type": "offer",
  "roomId": "ROOM_ID",
  "payload": {
    "type": "offer",
    "sdp": "YOUR_SDP_HERE"
  }
}
```

## 推流测试

推流可以使用以下工具之一：

1. OBS Studio:
   - 服务器：webrtc://localhost:8000/live
   - 串流密钥：从rtc-config API获取的streamKey

2. FFmpeg:
```bash
ffmpeg -f lavfi -i testsrc -c:v libx264 -f flv webrtc://localhost:8000/live/YOUR_STREAM_KEY
```

## 常见问题

1. 401错误：
   - 检查JWT token是否有效
   - 确认token格式：Bearer YOUR_TOKEN

2. 404错误：
   - 确认房间ID是否正确
   - 检查房间是否已被删除

3. WebSocket连接失败：
   - 确认服务是否正常运行
   - 检查WebSocket URL是否正确
   - 查看服务器日志是否有错误信息

4. 推流失败：
   - 确认SRS服务是否正常运行
   - 检查streamKey是否正确
   - 查看SRS日志是否有错误信息
