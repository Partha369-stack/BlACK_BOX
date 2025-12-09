import { config } from '../config';

// WebSocket service for real-time machine health updates
class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    // Dynamic WebSocket URL - works in both development and production
    private getWebSocketURL(): string {
        return config.wsUrl;
    }

    private readonly RECONNECT_INTERVAL = 5000;
    private isConnecting = false;

    connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;
        const wsURL = this.getWebSocketURL();
        console.log('🔌 Connecting to WebSocket:', wsURL);

        try {
            this.ws = new WebSocket(wsURL);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnecting = false;

                // Send subscribe message to identify as frontend monitor
                this.send({ type: 'subscribe' });

                this.emit('connected', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message:', data);
                    // Emit based on message type
                    if (data.type) {
                        this.emit(data.type, data);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnecting = false;
            };

            this.ws.onclose = () => {
                console.log('📴 WebSocket disconnected');
                this.isConnecting = false;
                this.ws = null;
                this.emit('disconnected', {});
                this.scheduleReconnect();
            };
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = setTimeout(() => {
            console.log('🔄 Attempting to reconnect WebSocket...');
            this.connect();
        }, this.RECONNECT_INTERVAL);
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    private emit(event: string, data: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
        }
    }

    getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
        if (this.isConnecting) return 'connecting';
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
        return 'disconnected';
    }
}

// Export singleton instance
export const websocketService = new WebSocketService();
