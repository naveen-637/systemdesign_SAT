type EventCallback = (event: { type: string; eventType: string; payload: any; timestamp: string }) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: EventCallback[] = [];
  private reconnectTimeout: any = null;
  private pingInterval: any = null;

  constructor() {
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
    this.url = `${wsBase}/ws/updates`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // Start ping heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 15000);
      };

      this.ws.onmessage = (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);
          if (data.type === 'DOMAIN_EVENT') {
            this.listeners.forEach((listener) => listener(data));
          }
        } catch {
          // ignore non-json messages like pong
        }
      };

      this.ws.onclose = () => {
        clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  subscribe(callback: EventCallback) {
    this.listeners.push(callback);
    this.connect();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const wsClient = new WebSocketClient();
