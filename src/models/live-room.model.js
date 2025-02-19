"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importStar(require("mongoose"));
var websocket_controller_1 = require("../controllers/websocket.controller");
// 全局定时器，用于检查所有直播中的房间
var globalCheckInterval;
// 启动全局检查
var startGlobalCheck = function () {
    if (globalCheckInterval) {
        clearInterval(globalCheckInterval);
    }
    globalCheckInterval = setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
        var rooms, _i, rooms_1, room;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoose_1.default.model('LiveRoom').find({
                        status: 'living',
                        has_stream: false,
                        $or: [
                            { last_stream_time: { $lt: new Date(Date.now() - 60000) } }, // 1分钟没有推流
                            { last_stream_time: null }
                        ]
                    })];
                case 1:
                    rooms = _a.sent();
                    _i = 0, rooms_1 = rooms;
                    _a.label = 2;
                case 2:
                    if (!(_i < rooms_1.length)) return [3 /*break*/, 5];
                    room = rooms_1[_i];
                    console.log("\u623F\u95F4 ".concat(room._id, " \u957F\u65F6\u95F4\u672A\u63A8\u6D41\uFF0C\u81EA\u52A8\u7ED3\u675F\u76F4\u64AD"));
                    websocket_controller_1.websocketController.broadcast({
                        type: 'roomEnded',
                        data: {
                            roomId: room._id,
                            reason: '直播间长时间未推流，已自动结束'
                        }
                    });
                    return [4 /*yield*/, room.endLive()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    }); }, 30000); // 每30秒检查一次
};
// 启动全局检查
startGlobalCheck();
var liveRoomSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['idle', 'living', 'ended'], default: 'idle' },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },
    user_id: { type: String, required: true },
    stream_key: { type: String, required: true, unique: true },
    viewer_count: { type: Number, default: 0 },
    has_stream: { type: Boolean, default: false },
    last_stream_time: { type: Date, default: null }
}, {
    timestamps: true
});
// 清理超时检查
liveRoomSchema.methods.cleanupTimeout = function () {
    if (this.stream_check_timeout) {
        clearTimeout(this.stream_check_timeout);
        this.stream_check_timeout = null;
    }
};
// 开始直播
liveRoomSchema.methods.startLive = function () {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.status = 'living';
                    this.start_time = new Date();
                    this.end_time = null;
                    this.has_stream = false;
                    this.last_stream_time = null;
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    // 设置2分钟检查计时器
                    this.cleanupTimeout();
                    this.stream_check_timeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!!this.has_stream) return [3 /*break*/, 2];
                                    console.log("\u76F4\u64AD\u95F4 ".concat(this._id, " \u8D85\u8FC72\u5206\u949F\u672A\u63A8\u6D41\uFF0C\u81EA\u52A8\u5220\u9664"));
                                    // 通过 WebSocket 通知前端
                                    websocket_controller_1.websocketController.broadcast({
                                        type: 'roomDeleted',
                                        data: {
                                            roomId: this._id,
                                            reason: '超过2分钟未推流，直播间已自动删除'
                                        }
                                    });
                                    // 删除房间
                                    return [4 /*yield*/, this.delete()];
                                case 1:
                                    // 删除房间
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); }, 2 * 60 * 1000); // 2分钟
                    return [2 /*return*/];
            }
        });
    });
};
// 结束直播
liveRoomSchema.methods.endLive = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.cleanupTimeout();
                    this.status = 'ended';
                    this.end_time = new Date();
                    this.has_stream = false;
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
// 处理推流开始
liveRoomSchema.methods.handleStreamStart = function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.has_stream = true;
                    this.last_stream_time = new Date();
                    return [4 /*yield*/, this.save()];
                case 1:
                    _a.sent();
                    // 如果是首次推流，清理初始检查计时器
                    if (this.stream_check_timeout) {
                        this.cleanupTimeout();
                    }
                    return [2 /*return*/];
            }
        });
    });
};
exports.default = mongoose_1.default.model('LiveRoom', liveRoomSchema);
