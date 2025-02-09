import { connectDatabase } from "./configs/database";

(async () => {
    try {
        await connectDatabase();
    } catch (error) {
        console.error("数据库连接测试失败:", error);
        process.exit(1);
    }
})();
