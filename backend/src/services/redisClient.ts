import { createClient, RedisClientType } from 'redis';

class RedisClientService {
    private client: RedisClientType | null = null;
    private subscriber: RedisClientType | null = null;
    private isConnected = false;

    // Redis Cloud Credentials
    private readonly REDIS_URL = 'redis://default:O3fAfZigzhtqQuqEVeLDjzNC8pKUOysM@redis-14777.crce264.ap-east-1-1.ec2.cloud.redislabs.com:14777';

    // Constants
    private readonly CHANNEL_LOGS = 'channel:system-logs';
    private readonly KEY_RECENT_LOGS = 'recent:logs';
    private readonly MAX_LOG_HISTORY = 100;

    constructor() {
        this.client = createClient({
            url: this.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 20) {
                        console.error('Redis: Max retries reached. Stopping reconnection attempts.');
                        return new Error('Redis max retries reached');
                    }
                    return Math.min(retries * 50, 1000);
                }
            }
        });

        this.subscriber = this.client.duplicate();

        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.on('connect', () => console.log('✅ Redis Client Connected'));
        this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    }

    async connect(): Promise<void> {
        if (!this.client || !this.subscriber) return;

        try {
            if (!this.client.isOpen) {
                await this.client.connect();
            }
            if (!this.subscriber.isOpen) {
                await this.subscriber.connect();
            }
            this.isConnected = true;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client?.isOpen) await this.client.quit();
        if (this.subscriber?.isOpen) await this.subscriber.quit();
        this.isConnected = false;
    }

    // Publish log to Pub/Sub channel (for real-time streaming)
    async publishLog(message: string): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            await this.client.publish(this.CHANNEL_LOGS, message);
        } catch (error) {
            console.error('Redis Publish Error:', error);
        }
    }

    // Push log to Capped List (for history / late joiners)
    async pushLog(message: string): Promise<void> {
        if (!this.isConnected || !this.client) return;
        try {
            // LPUSH + LTRIM pipeline
            const multi = this.client.multi();
            multi.lPush(this.KEY_RECENT_LOGS, message);
            multi.lTrim(this.KEY_RECENT_LOGS, 0, this.MAX_LOG_HISTORY - 1);
            await multi.exec();
        } catch (error) {
            console.error('Redis Push Error:', error);
        }
    }

    // Get recent logs (for new connections)
    async getRecentLogs(limit: number = 100): Promise<string[]> {
        if (!this.isConnected || !this.client) return [];
        try {
            return await this.client.lRange(this.KEY_RECENT_LOGS, 0, limit - 1);
        } catch (error) {
            console.error('Redis GetRecentLogs Error:', error);
            return [];
        }
    }

    // Subscribe to logs (for backend internal use if needed)
    async subscribeToLogs(callback: (message: string) => void): Promise<void> {
        if (!this.isConnected || !this.subscriber) return;
        try {
            await this.subscriber.subscribe(this.CHANNEL_LOGS, (message) => {
                callback(message);
            });
            console.log(`Subscribed to ${this.CHANNEL_LOGS}`);
        } catch (error) {
            console.error('Redis Subscribe Error:', error);
        }
    }
}

export const redisClient = new RedisClientService();
