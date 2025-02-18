# 使用SRS官方镜像
FROM ossrs/srs:4

# 创建日志目录
RUN mkdir -p /usr/local/srs/objs/logs

# 复制自定义配置文件
COPY srs.conf /usr/local/srs/conf/srs.conf

# 暴露端口（RTMP/HTTP/WebRTC）
EXPOSE 1935 8080 1985 8000

# 工作目录
WORKDIR /usr/local/srs

# 启动命令
CMD ["./objs/srs", "-c", "./conf/srs.conf"]
