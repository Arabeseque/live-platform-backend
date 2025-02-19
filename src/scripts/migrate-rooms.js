"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var dotenv_1 = __importDefault(require("dotenv"));
var live_room_model_js_1 = __importDefault(require("../models/live-room.model.js"));
var websocket_controller_js_1 = require("../controllers/websocket.controller.js");
// 加载环境变量
dotenv_1.default.config();
function migrateRooms() {
    return __awaiter(this, void 0, void 0, function () {
        var twoMinutesAgo, idleRooms, _i, idleRooms_1, room, livingRooms, _a, livingRooms_1, room, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 13, , 14]);
                    // 连接数据库
                    return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/live-platform')];
                case 1:
                    // 连接数据库
                    _b.sent();
                    console.log('Connected to MongoDB');
                    twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
                    return [4 /*yield*/, live_room_model_js_1.default.find({
                            status: 'idle',
                            createdAt: { $lt: twoMinutesAgo }
                        })];
                case 2:
                    idleRooms = _b.sent();
                    _i = 0, idleRooms_1 = idleRooms;
                    _b.label = 3;
                case 3:
                    if (!(_i < idleRooms_1.length)) return [3 /*break*/, 6];
                    room = idleRooms_1[_i];
                    console.log("\u5220\u9664\u672A\u5F00\u59CB\u63A8\u6D41\u7684\u623F\u95F4: ".concat(room._id));
                    websocket_controller_js_1.websocketController.broadcast({
                        type: 'roomDeleted',
                        data: {
                            roomId: room._id,
                            reason: '房间创建超过2分钟未推流，已自动删除'
                        }
                    });
                    return [4 /*yield*/, room.deleteOne()];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, live_room_model_js_1.default.find({
                        status: 'living',
                        has_stream: false
                    })];
                case 7:
                    livingRooms = _b.sent();
                    _a = 0, livingRooms_1 = livingRooms;
                    _b.label = 8;
                case 8:
                    if (!(_a < livingRooms_1.length)) return [3 /*break*/, 11];
                    room = livingRooms_1[_a];
                    console.log("\u7ED3\u675F\u65E0\u63A8\u6D41\u7684\u76F4\u64AD\u623F\u95F4: ".concat(room._id));
                    websocket_controller_js_1.websocketController.broadcast({
                        type: 'roomEnded',
                        data: {
                            roomId: room._id,
                            reason: '直播间无推流，已自动结束'
                        }
                    });
                    return [4 /*yield*/, room.endLive()];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11: 
                // 初始化 last_stream_time 字段
                return [4 /*yield*/, live_room_model_js_1.default.updateMany({ last_stream_time: null }, { $set: { last_stream_time: new Date() } })];
                case 12:
                    // 初始化 last_stream_time 字段
                    _b.sent();
                    console.log('房间迁移完成');
                    process.exit(0);
                    return [3 /*break*/, 14];
                case 13:
                    error_1 = _b.sent();
                    console.error('迁移失败:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
migrateRooms();
