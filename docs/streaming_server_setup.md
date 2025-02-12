# 流媒体服务器部署方案

## 1. Docker安装步骤

### Windows环境下安装Docker Desktop
1. 下载Docker Desktop安装程序
   - 访问 https://www.docker.com/products/docker-desktop
   - 下载Windows版本的Docker Desktop安装程序

2. 安装要求
   - Windows 10/11 64位: 专业版、企业版或教育版
   - 启用WSL 2功能
   - 启用硬件虚拟化

3. 安装步骤
   ```bash
   # 启用WSL 2
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   
   # 下载并安装WSL 2内核更新包
   # 从微软官方网站下载: https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi
   
   # 设置WSL 2为默认版本
   wsl --set-default-version 2
   ```

4. 验证安装
   ```bash
   docker --version
   docker-compose --version
   ```

## 2. SRS容器部署

### 使用Docker Compose部署SRS
1. 创建docker-compose.yml配置文件:
```yaml
version: '3'
services:
  srs:
    image: ossrs/srs:5.0.30
    container_name: srs
    restart: always
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"  # HTTP API
      - "1985:1985"  # HTTP API
      - "8000:8000"  # WebRTC
    volumes:
      - ./conf/srs.conf:/usr/local/srs/conf/srs.conf
```

2. 创建SRS配置文件 (conf/srs.conf):
```
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
    dir             ./objs/nginx/html;
}
rtc_server {
    enabled         on;
    listen          8000;
    # @see https://ossrs.net/lts/zh-cn/docs/v4/doc/webrtc#config-candidate
    candidate       $CANDIDATE;
}
vhost __defaultVhost__ {
    http_remux {
        enabled     on;
        mount       [vhost]/[app]/[stream].flv;
    }
    rtc {
        enabled     on;
        # @see https://ossrs.net/lts/zh-cn/docs/v4/doc/webrtc#rtmp-to-rtc
        rtmp_to_rtc on;
        # @see https://ossrs.net/lts/zh-cn/docs/v4/doc/webrtc#rtc-to-rtmp
        rtc_to_rtmp on;
    }
    hls {
        enabled         on;
        hls_fragment    10;
        hls_window     60;
        hls_path       ./objs/nginx/html;
        hls_m3u8_file  [app]/[stream].m3u8;
        hls_ts_file    [app]/[stream]-[seq].ts;
    }
}
```

3. 启动容器:
```bash
docker-compose up -d
```

## 3. 推流地址配置

### RTMP推流
- RTMP推流地址: `rtmp://localhost:1935/live/STREAM_KEY`
- RTMP播放地址: `rtmp://localhost:1935/live/STREAM_KEY`
- HTTP-FLV播放: `http://localhost:8080/live/STREAM_KEY.flv`
- HLS播放: `http://localhost:8080/live/STREAM_KEY.m3u8`

### WebRTC配置
- WebRTC推流: `webrtc://localhost:8000/live/STREAM_KEY`
- WebRTC播放: `webrtc://localhost:8000/live/STREAM_KEY`

## 4. 与现有系统集成

### 环境变量配置
在项目的.env文件中添加以下配置:
```
# Streaming Server Configuration
RTMP_SERVER_URL=rtmp://localhost:1935/live
WEBRTC_SERVER_URL=webrtc://localhost:8000/live
HLS_SERVER_URL=http://localhost:8080/live
```

### API集成
1. 在live-room.model.ts中添加推流地址相关字段
2. 实现推流密钥生成和管理功能
3. 为直播间API添加获取推流地址的端点

## 5. 安全性考虑

1. 推流验证
   - 实现推流密钥认证机制
   - 限制推流IP地址
   - 设置推流过期时间

2. 播放安全
   - 实现播放地址签名机制
   - 设置播放权限控制
   - 配置防盗链机制

## 6. 后续优化建议

1. 监控告警
   - 配置容器资源监控
   - 设置推流质量监控
   - 添加系统告警机制

2. 扩展性优化
   - 考虑使用CDN分发
   - 规划多节点部署方案
   - 优化存储方案

3. 性能优化
   - 调整SRS配置参数
   - 优化网络设置
   - 监控并优化资源使用
