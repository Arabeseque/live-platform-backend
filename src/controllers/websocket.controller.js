"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketController = exports.WebSocketController = void 0;
exports.initializeWebSocket = initializeWebSocket;
var ws_1 = require("ws");
var WebSocketController = /** @class */ (function () {
    function WebSocketController(server) {
        var _this = this;
        this.clients = new Set();
        this.wss = new ws_1.WebSocketServer({ server: server, path: '/ws' });
        this.wss.on('connection', function (ws) {
            console.log('新的WebSocket连接');
            _this.clients.add(ws);
            ws.on('message', function (message) {
                try {
                    var data = JSON.parse(message.toString());
                    _this.handleMessage(ws, data);
                }
                catch (err) {
                    console.error('解析WebSocket消息失败:', err);
                }
            });
            ws.on('close', function () {
                console.log('WebSocket连接关闭');
                _this.clients.delete(ws);
            });
            ws.on('error', function (error) {
                console.error('WebSocket错误:', error);
                _this.clients.delete(ws);
            });
        });
    }
    WebSocketController.prototype.handleMessage = function (ws, data) {
        // 处理不同类型的消息
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            // 可以添加其他消息类型的处理
            default:
                console.log('收到未知类型的消息:', data);
        }
    };
    // 广播消息给所有连接的客户端
    WebSocketController.prototype.broadcast = function (data) {
        var message = JSON.stringify(data);
        this.clients.forEach(function (client) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    };
    return WebSocketController;
}());
exports.WebSocketController = WebSocketController;
function initializeWebSocket(server) {
    exports.websocketController = new WebSocketController(server);
    return exports.websocketController;
}
