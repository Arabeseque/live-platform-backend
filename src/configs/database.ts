import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

// 连接选项
const options = {
  autoIndex: true, // 在生产环境中应该设置为false
  serverSelectionTimeoutMS: 5000, // 超时时间
  socketTimeoutMS: 45000, // Socket超时时间
  retryWrites: true,
  maxPoolSize: 10
};

// 连接事件处理
mongoose.connection.on('connected', () => {
  console.log('MongoDB连接成功');
  console.log(`连接地址: ${MONGO_URI}`);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
  console.error('错误详情:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
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
    if (!MONGO_URI) {
      throw new Error('MongoDB连接字符串未配置');
    }
    console.log('正在连接MongoDB...', {
      uri: MONGO_URI,
      options
    });
    
    await mongoose.connect(MONGO_URI, options);
    return mongoose.connection;
  } catch (error: any) {
    console.error('MongoDB连接失败:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// 重连函数
export const reconnectDatabase = async (retries = 5, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`尝试连接MongoDB (${i + 1}/${retries})...`);
      await connectDatabase();
      console.log('MongoDB重连成功');
      return;
    } catch (error: any) {
      console.error(`MongoDB重连失败 (${i + 1}/${retries}):`, {
        error: error.message,
        code: error.code,
        name: error.name
      });
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
