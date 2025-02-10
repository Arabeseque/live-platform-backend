/**
 * 环境变量类型定义
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGO_ATLAS_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      BASE_URL: string;
      UPLOAD_DIR?: string;
      LOG_LEVEL?: string;
    }
  }
}

/**
 * 必需的环境变量列表
 */
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGO_ATLAS_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BASE_URL'
] as const;

type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number];

/**
 * 验证环境变量配置
 * @throws {Error} 如果有必需的环境变量未配置
 */
export function validateEnv() {
  const missingVars = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(
      `缺少必需的环境变量:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n` +
      '请检查 .env 文件或环境变量配置。'
    );
  }

  // 验证 MongoDB 连接字符串
  const mongoUri = process.env.MONGO_ATLAS_URI as string;
  if (!mongoUri.includes('mongodb://') && !mongoUri.includes('mongodb+srv://')) {
    throw new Error('MONGO_ATLAS_URI 格式无效');
  }

  // 验证 JWT 配置
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN as string;
  if (!jwtExpiresIn.match(/^\d+[hdwmy]$/)) {
    throw new Error('JWT_EXPIRES_IN 格式无效 (例如: 7d, 24h, 30d)');
  }

  // 验证 BASE_URL 格式
  try {
    new URL(process.env.BASE_URL as string);
  } catch {
    throw new Error('BASE_URL 必须是有效的 URL');
  }

  // 在开发环境打印配置信息
  if (process.env.NODE_ENV === 'development') {
    console.log('环境变量验证通过 ✅');
    // NOTE: 在开发环境中，这个文件会在控制台打印配置信息，方便开发人员查看和确认环境变量的设置是否正确。
    console.log('配置信息:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // NOTE: 对敏感信息（例如数据库密码）进行掩盖，防止泄露。
      MONGO_URI: maskSensitiveInfo(process.env.MONGO_ATLAS_URI),
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      BASE_URL: process.env.BASE_URL
    });
  }
}

/**
 * 掩盖敏感信息
 * 例如: mongodb+srv://user:pass@host -> mongodb+srv://user:***@host
 */
function maskSensitiveInfo(str: string): string {
  return str.replace(/:([^@]+)@/, ':***@');
}
