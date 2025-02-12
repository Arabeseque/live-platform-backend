FROM node:18-alpine

WORKDIR /app

# 设置 npm 镜像源 (可选，但推荐)
RUN npm config set registry https://registry.npmjs.org/ || \
    npm config set registry https://registry.npmmirror.com/

# 安装 pnpm (确保安装到 /usr/local/bin，这样所有用户都能访问)
RUN npm install -g pnpm --prefix /usr/local
# 从项目根目录复制package文件和lock文件
COPY ../../package*.json ./
# 如果有pnpm-lock.yaml文件，也需要复制
COPY ../../pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY ../../src ./src
COPY ../../.env . 

# 暴露端口
EXPOSE 8088

# 启动服务
CMD ["npm", "start"]
