/// <reference types="node" />
// 确保已安装下面依赖项：
//    npm install dotenv
//    npm install --save-dev @types/node
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_ATLAS_URI,
  // 根据需要修改实体的路径
  entities: [__dirname + "/../entities/*.ts"],
  synchronize: process.env.NODE_ENV === 'development', // 仅在开发环境中使用 synchronize
  logging: true, // 开启日志
});

export const connectDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("成功连接到 MongoDB Atlas using TypeORM DataSource");
    return AppDataSource;
  } catch (error) {
    console.error("连接 MongoDB Atlas 失败:", error);
    throw error;
  }
};
