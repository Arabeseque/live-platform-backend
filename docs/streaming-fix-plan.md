# 直播系统修复方案

## 一、问题描述

当前在页面 http://localhost:3333/stream?id=67aee006c491e8b3f3f73cd4 点击开始直播时，SRS 没有显示有内容在直播。需要实现 OBS 推流功能。

## 二、解决方案

### 1. SRS 配置优化

需要修改 docker/srs/srs.conf 配置，主要调整：

```nginx
rtc_server {
    enabled         on;
    listen          8000;
    candidate {
        # 使用通配符监听所有网卡
        internal            {
            address         0.0.0.0;
            port           8000;
        }
    }
}

vhost __defaultVhost__ {
    live on;
    http_remux {
        enabled     on;
        mount       [vhost]/[app]/[stream].flv;
    }
    rtc {
        enabled     on;
        rtmp_to_rtc on;
        rtc_to_rtmp on;
    }
}
```

### 2. OBS 推流设置指南

1. OBS 基础设置：
   - 流类型：自定义流媒体服务器
   - 服务器：rtmp://localhost:1935/live
   - 串流密钥：与直播房间 ID 对应 (67aee006c491e8b3f3f73cd4)

2. OBS 视频设置：
   - 输出分辨率：1920x1080 或 1280x720
   - 帧率：30fps
   - 码率：2500-4000 Kbps

### 3. 验证步骤

1. 重启 SRS 服务：
```bash
docker-compose restart srs
```

2. 验证 SRS WebRTC API：
   - 测试端点：http://localhost:8080/rtc/v1/publish
   - 确保返回正确响应而不是空响应

3. OBS 推流测试：
   - 按照上述配置设置 OBS
   - 开始推流
   - 验证 SRS 服务器是否正确接收流
   - 验证网页播放器是否正确显示直播内容

## 三、预期效果

1. SRS 服务器正常接收 OBS 推流
2. 网页端可以正常播放直播内容
3. WebRTC 连接建立正常，没有 ICE 连接错误

## 四、故障排查指南

如果遇到问题，按以下步骤排查：

1. 检查 SRS 日志：
```bash
docker-compose logs srs
```

2. 验证 WebRTC 连接状态：
   - 使用浏览器开发工具查看 WebRTC 连接状态
   - 检查 ICE 候选项收集过程

3. 确认 OBS 推流状态：
   - 查看 OBS 推流指示器
   - 检查 OBS 日志是否有错误信息

## 五、后续优化

1. 监控方案：
   - 添加 WebRTC 连接状态监控
   - 添加推流质量监控
   - 实现自动重连机制

2. 性能优化：
   - 优化 WebRTC 传输参数
   - 实现自适应码率
