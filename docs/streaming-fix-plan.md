# 直播间连接问题修复方案

## 问题描述

当以主播模式访问直播页面时（无 roomId 参数），系统传递了一个空字符串作为 roomId，导致以下错误：
```
CastError: Cast to ObjectId failed for value "" (type string) at path "_id" for model "LiveRoom"
```

## 原因分析

1. 当前逻辑在主播模式下：
```typescript
const isStreamer = computed(() => !route.query.id)
const roomId = ref(route.query.id?.toString() || '')
```

2. 这导致：
- 主播模式下 roomId 为空字符串
- 空字符串无法被转换为 MongoDB 的 ObjectId
- WebSocket 信令服务器尝试查找房间时失败

## 修复方案

### 1. 修改直播页面逻辑

在 `stream.vue` 中：

```typescript
// 1. 添加创建房间的函数
async function createRoom() {
  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '我的直播间',
        streamerId: userId.value
      })
    });
    const data = await response.json();
    return data.roomId;
  } catch (error) {
    console.error('创建房间失败:', error);
    throw error;
  }
}

// 2. 修改 roomId 的处理逻辑
const roomId = ref('');

onMounted(async () => {
  if (isStreamer.value) {
    // 主播模式：创建新房间
    try {
      roomId.value = await createRoom();
    } catch (err) {
      error.value = '创建直播间失败';
    }
  } else {
    // 观众模式：使用URL参数的房间ID
    roomId.value = route.query.id?.toString() || '';
  }
});
```

### 2. 添加后端API端点

在后端添加创建房间的API：

```typescript
// routes/room.routes.ts
router.post('/rooms', async (ctx) => {
  const { title, streamerId } = ctx.request.body;
  const room = new LiveRoom({
    title,
    streamerId,
    status: 'created',
    startTime: Date.now()
  });
  await room.save();
  ctx.body = { roomId: room._id };
});
```

### 3. 修改信令服务处理

在 `webrtc-signaling.service.ts` 中增加房间验证逻辑：

```typescript
private async handleMessage(ws: WebSocket, message: SignalingMessage) {
  const { type, roomId, payload } = message;

  // 验证房间ID
  if (!roomId || roomId.length !== 24) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      payload: '无效的房间ID' 
    }));
    return;
  }

  // 其余代码保持不变...
}
```

## 实施步骤

1. 在后端添加创建房间的API端点
2. 修改前端直播页面的房间ID处理逻辑
3. 更新WebSocket信令服务的错误处理
4. 添加房间状态管理
5. 测试所有场景：
   - 主播创建新直播
   - 观众进入已存在的直播
   - 处理无效房间ID的情况

## 注意事项

1. 确保新创建的房间ID立即可用
2. 适当处理房间创建失败的情况
3. 添加适当的错误提示
4. 考虑添加房间清理机制
