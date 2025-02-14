import server from './app.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NODE_ENV = process.env.MONGO_ATLAS_URI;
console.log(`当前环境: ${NODE_ENV}`);

const PORT = process.env.PORT || 8088;

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket服务运行在 ws://localhost:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});
