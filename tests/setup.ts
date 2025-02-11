// tests/setup.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 加载 .env 文件
dotenv.config({ path: resolve(__dirname, './.env.test') });

// 可选：设置一些全局变量
process.env.TEST_ENV_VAR = 'test_value';

console.log('Setup file executed!'); // 确认 setup file 被执行
