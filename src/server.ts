import server from './app.js';
import dotenv from 'dotenv';
import { reconnectDatabase } from './configs/database.js';

// 加载环境变量
dotenv.config();

const NODE_ENV = process.env.NODE_ENV;
console.log(`当前环境: ${NODE_ENV}`);

const PORT = process.env.PORT || 8088;

// 启动服务器
const startServer = async () => {
  try {
    // 尝试连接数据库
    await reconnectDatabase(5, 5000);

    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`WebSocket服务运行在 ws://localhost:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();
