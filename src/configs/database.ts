import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_ATLAS_URI || 'mongodb://localhost:27017/live-platform';

// 连接选项
const options = {
  autoIndex: true, // 在生产环境中应该设置为false
  serverSelectionTimeoutMS: 5000, // 超时时间
  socketTimeoutMS: 45000, // Socket超时时间
};

// 连接事件处理
mongoose.connection.on('connected', () => {
  console.log('MongoDB连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB连接断开');
});

// 优雅关闭连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB连接已关闭');
  process.exit(0);
});

// 连接函数
export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI, options);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    throw error;
  }
};

// 重连函数
export const reconnectDatabase = async (retries = 5, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDatabase();
      console.log('MongoDB重连成功');
      return;
    } catch (error) {
      console.error(`MongoDB重连失败 (${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        console.log(`${interval / 1000}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  throw new Error('MongoDB重连次数超过限制');
};

// 导出mongoose实例
export default mongoose;
