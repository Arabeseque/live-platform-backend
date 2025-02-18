import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class WebSocketController {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('新的WebSocket连接');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (err) {
          console.error('解析WebSocket消息失败:', err);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket连接关闭');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, data: any) {
    // 处理不同类型的消息
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      // 可以添加其他消息类型的处理
      default:
        console.log('收到未知类型的消息:', data);
    }
  }

  // 广播消息给所有连接的客户端
  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export let websocketController: WebSocketController;

export function initializeWebSocket(server: Server) {
  websocketController = new WebSocketController(server);
  return websocketController;
}
