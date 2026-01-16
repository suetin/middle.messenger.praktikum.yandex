type ChatSocketHandlers = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  onMessage?: (data: string) => void;
};

type ChatSocketParams = {
  userId: number;
  chatId: number;
  token: string;
};

const WS_BASE_URL = 'wss://ya-praktikum.tech/ws/chats';

export default class ChatSocket {
  private _socket: WebSocket | null = null;
  private _pingTimer: number | null = null;
  private _handlers: ChatSocketHandlers;

  constructor(handlers: ChatSocketHandlers = {}) {
    this._handlers = handlers;
  }

  connect({ userId, chatId, token }: ChatSocketParams) {
    this.close();
    const socketUrl = `${WS_BASE_URL}/${userId}/${chatId}/${token}`;
    this._socket = new WebSocket(socketUrl);

    this._socket.addEventListener('open', () => {
      this._send({ content: '0', type: 'get old' });
      this._startPing();
      this._handlers.onOpen?.();
    });

    this._socket.addEventListener('message', (event) => {
      this._handlers.onMessage?.(String(event.data));
    });

    this._socket.addEventListener('close', () => {
      this._stopPing();
      this._handlers.onClose?.();
    });

    this._socket.addEventListener('error', (event) => {
      this._handlers.onError?.(event);
    });
  }

  sendMessage(content: string) {
    this._send({ type: 'message', content });
  }

  sendFile(fileId: number) {
    this._send({ type: 'file', content: String(fileId) });
  }

  close() {
    this._stopPing();
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
  }

  private _send(payload: Record<string, string>) {
    if (!this._socket || this._socket.readyState !== WebSocket.OPEN) {
      console.warn('socket is not ready');
      return;
    }
    this._socket.send(JSON.stringify(payload));
  }

  private _startPing() {
    this._stopPing();
    this._pingTimer = window.setInterval(() => {
      this._send({ type: 'ping' });
    }, 15000);
  }

  private _stopPing() {
    if (this._pingTimer) {
      window.clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }
}
