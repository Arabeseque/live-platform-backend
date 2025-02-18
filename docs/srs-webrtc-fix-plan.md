# SRS WebRTC 修复计划

## 当前问题

1. SRS WebRTC服务返回空响应:
   - POST http://localhost:8000/rtc/v1/publish/ 返回 ERR_EMPTY_RESPONSE
   - POST http://localhost:8000/rtc/v1/candidate/ 返回 ERR_EMPTY_RESPONSE

2. ICE候选项无法正确发送到SRS服务器
3. 信令服务器连接不稳定

## 解决方案

### 1. 完善SRS WebRTC配置

需要修改 `docker/srs/srs.conf` 文件，添加以下配置：

```nginx
listen              1935;
max_connections     1000;
daemon             off;

http_api {
    enabled         on;
    listen          1985;
    crossdomain     on;        # 允许跨域访问
}

http_server {
    enabled         on;
    listen          8080;
    dir            ./objs/nginx/html;
}

rtc {
    enabled         on;
    listen          8000;      # WebRTC端口
    candidate {
        # 配置STUN/TURN服务器
        local_ip    0.0.0.0;   # 监听所有网卡
        # 如果在公网环境，需要设置public_ip
        # public_ip  your_public_ip;
    }
    api {
        enabled     on;        # 启用WebRTC HTTP API
        listen      8000;      # API端口
    }
}

vhost __defaultVhost__ {
    http_remux {
        enabled     on;
        mount       [vhost]/[app]/[stream].flv;
    }
    rtc {
        enabled     on;
        rtmp_to_rtc on;       # 允许RTMP转WebRTC
        rtc_to_rtmp on;       # 允许WebRTC转RTMP
    }
}
```

### 2. 重启服务

配置修改后需要重启SRS服务：

```bash
docker-compose restart srs
```

### 3. 前端适配

1. 确保前端使用正确的API地址访问WebRTC服务
2. 实现错误重试机制
3. 优化ICE候选项的处理逻辑

## 实施步骤

1. 使用Code模式修改SRS配置文件
2. 重启SRS服务
3. 验证WebRTC API端点是否正常响应
4. 测试直播推流功能

## 预期结果

1. WebRTC API返回正常响应而不是空响应
2. ICE候选项可以正常发送和处理
3. 直播推流功能正常工作

## 后续监控

1. 监控WebRTC连接状态
2. 监控ICE候选项的收集和交换过程
3. 监控信令服务器的连接稳定性
