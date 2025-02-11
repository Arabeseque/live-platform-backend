import { config } from 'dotenv';

// 确保在所有测试运行前加载测试环境变量
config({ path: 'tests/.env.test', override: true });
