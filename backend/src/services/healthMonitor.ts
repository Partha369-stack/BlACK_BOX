import WebSocket from 'ws';
import { Server as HTTPServer, IncomingMessage } from 'http';
import Parse from './parseServer';
import { logMachineEvent } from '../controllers/logController';
// Redis temporarily disabled
// import { redisClient } from './redisClient';

interface MachineConnection {
    ws: WebSocket;
    machineId: string;
    lastPing: Date;
    isAlive: boolean;
}

class HealthMonitorService {
    private wss: WebSocket.Server | null = null;
    private connections: Map<string, MachineConnection> = new Map();
    private monitors: Set<WebSocket> = new Set();
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 10000; // 10 seconds (less aggressive)
    private readonly PING_TIMEOUT = 30000; // 30 seconds before marking offline

    initialize(server: HTTPServer) {
        console.log('🔌 Initializing WebSocket Health Monitor...');

        this.wss = new WebSocket.Server({ server, path: '/ws' });

        // Subscribe to Redis logs for Real-time broadcasting - DISABLED
        // redisClient.subscribeToLogs((message) => {
        //     this.broadcastLogToMonitors(message);
        // });

        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            console.log('📱 New WebSocket connection from:', req.socket.remoteAddress);

            let connectionType: 'machine' | 'monitor' | null = null;

            // Handle initial handshake - expect machine to send its ID or frontend to subscribe
            ws.on('message', (message: WebSocket.Data) => {
                try {
                    const data = JSON.parse(message.toString());

                    // Machine registration (ESP32 devices)
                    if (data.type === 'register' && data.machineId) {
                        connectionType = 'machine';
                        this.registerMachine(ws, data.machineId);
                    }
                    // Frontend monitoring subscription
                    else if (data.type === 'subscribe') {
                        connectionType = 'monitor';
                        this.monitors.add(ws);
                        console.log('👁️  Frontend monitor connected');
                        // Send current status to new monitor
                        this.sendStatusUpdate(ws);
                        // Send acknowledgment
                        ws.send(JSON.stringify({
                            type: 'subscribed',
                            message: 'Connected to health monitor'
                        }));
                    }
                    // Pong from machines
                    else if (data.type === 'pong' && data.machineId) {
                        this.handlePong(data.machineId);
                    }
                    // Logs from machines (Remote Serial Monitor)
                    else if (data.type === 'log' && data.machineId && data.message) {
                        this.handleMachineLog(data.machineId, data.message);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                if (connectionType === 'machine') {
                    this.handleDisconnection(ws);
                } else if (connectionType === 'monitor') {
                    console.log('👁️  Frontend monitor disconnected');
                    this.monitors.delete(ws);
                }
            });

            ws.on('error', (error: Error) => {
                console.error('❌ WebSocket error:', error);
            });
        });

        // Start ping interval
        this.startPingInterval();

        console.log('✅ WebSocket Health Monitor started on /ws');
    }

    private registerMachine(ws: WebSocket, machineId: string) {
        console.log(`✨ Machine registered: ${machineId}`);

        // Remove old connection if exists
        const oldConnection = this.connections.get(machineId);
        if (oldConnection && oldConnection.ws !== ws) {
            oldConnection.ws.close();
        }

        // Store new connection
        this.connections.set(machineId, {
            ws,
            machineId,
            lastPing: new Date(),
            isAlive: true
        });

        // Update database
        this.updateMachineStatus(machineId, 'online', new Date());

        // Log connection event
        logMachineEvent(machineId, 'websocket_connect', `Machine connected via WebSocket`, {}, 'info');

        // Send acknowledgment
        ws.send(JSON.stringify({ type: 'registered', machineId }));

        // Broadcast "online" status to all monitors
        this.broadcastMachineStatus(machineId, 'online');
    }

    private handlePong(machineId: string) {
        const connection = this.connections.get(machineId);
        if (connection) {
            connection.lastPing = new Date();
            connection.isAlive = true;

            // Update database with latest ping time
            this.updateMachineStatus(machineId, 'online', new Date());

            // Log ping event (only log every 10th ping to avoid spam)
            const randomSample = Math.random() < 0.1; // 10% sampling rate
            if (randomSample) {
                logMachineEvent(machineId, 'websocket_ping', `WebSocket ping received`, { timestamp: new Date() }, 'info');
            }

            // Also broadcast "online" status update to monitors to keep UI fresh
            this.broadcastMachineStatus(machineId, 'online');
        }
    }

    private handleMachineLog(machineId: string, message: string) {
        // 1. Save/Publish via Logger (which goes to Redis)
        logMachineEvent(machineId, 'device_log', message, {}, 'info');

        // Note: We don't need to manually broadcast here anymore because 
        // logMachineEvent -> Logger -> Redis -> subscribeToLogs -> broadcastLogToMonitors
    }

    private broadcastLogToMonitors(message: string) {
        this.monitors.forEach(monitor => {
            if (monitor.readyState === WebSocket.OPEN) {
                try {
                    monitor.send(message);
                } catch (error) {
                    console.error('Failed to broadcast log to monitor:', error);
                }
            }
        });
    }

    private handleDisconnection(ws: WebSocket) {
        // Find and remove the connection
        for (const [machineId, connection] of this.connections.entries()) {
            if (connection.ws === ws) {
                console.log(`📴 Machine disconnected: ${machineId}`);
                this.connections.delete(machineId);
                this.updateMachineStatus(machineId, 'offline', connection.lastPing);

                // Broadcast "offline" status to all monitors
                this.broadcastMachineStatus(machineId, 'offline');

                // Log disconnection event
                logMachineEvent(machineId, 'websocket_disconnect', `Machine disconnected from WebSocket`, { lastPing: connection.lastPing }, 'warning');
                break;
            }
        }
    }

    private startPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            this.pingAllMachines();
        }, this.PING_INTERVAL);

        console.log(`⏱️  Ping interval started: ${this.PING_INTERVAL}ms`);
    }

    private pingAllMachines() {
        const now = Date.now();

        for (const [machineId, connection] of this.connections.entries()) {
            // Check if machine is still alive (responded to last ping)
            const timeSinceLastPing = now - connection.lastPing.getTime();

            if (timeSinceLastPing > this.PING_TIMEOUT) {
                // Machine hasn't responded in time, mark as offline
                console.log(`⚠️  Machine ${machineId} timed out (${timeSinceLastPing}ms since last ping)`);
                connection.ws.terminate(); // terminate is more forceful than close()
                this.connections.delete(machineId);
                this.updateMachineStatus(machineId, 'offline', connection.lastPing);

                // Broadcast "offline" status to all monitors
                this.broadcastMachineStatus(machineId, 'offline');
                continue;
            }

            // Send ping
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.isAlive = false; // Will be set to true when pong received
                try {
                    connection.ws.send(JSON.stringify({
                        type: 'ping',
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error(`❌ Error sending ping to ${machineId}:`, error);
                }
            }
        }
    }

    private sendStatusUpdate(ws: WebSocket) {
        const statuses = this.getAllMachinesStatus();
        try {
            ws.send(JSON.stringify({
                type: 'machine_update', // Standardized from health_update
                machines: statuses,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('❌ Error sending status update:', error);
        }
    }

    private broadcastMachineStatus(machineId: string, status: string) {
        const update = JSON.stringify({
            type: 'machine_update',
            machineId,
            status,
            connected: status === 'online',
            timestamp: new Date().toISOString()
        });

        this.monitors.forEach(monitor => {
            if (monitor.readyState === WebSocket.OPEN) {
                try {
                    monitor.send(update);
                } catch (error) {
                    console.error(`❌ Error broadcasting status to monitor:`, error);
                }
            }
        });
    }

    private async updateMachineStatus(machineId: string, status: string, lastPingTime: Date) {
        try {
            const Machine = Parse.Object.extend('Machine');
            const query = new Parse.Query(Machine);
            query.equalTo('machineId', machineId);

            const machine = await query.first();
            if (machine) {
                machine.set('status', status);
                machine.set('lastPingTime', lastPingTime);
                machine.set('wsConnected', status === 'online');
                await machine.save();

                console.log(`💾 Updated ${machineId}: ${status}, last ping: ${lastPingTime.toLocaleTimeString()}`);
            }
        } catch (error) {
            console.error(`❌ Error updating machine status for ${machineId}:`, error);
        }
    }

    getMachineStatus(machineId: string) {
        const connection = this.connections.get(machineId);
        if (connection) {
            return {
                machineId,
                status: 'online',
                lastPing: connection.lastPing,
                connected: true
            };
        }
        return {
            machineId,
            status: 'offline',
            lastPing: null,
            connected: false
        };
    }

    getAllMachinesStatus() {
        const statuses: any[] = [];
        for (const [machineId, connection] of this.connections.entries()) {
            statuses.push({
                machineId,
                status: 'online',
                lastPing: connection.lastPing,
                connected: true
            });
        }
        return statuses;
    }

    sendDispenseCommand(machineId: string, slot: number, quantity: number): boolean {
        const connection = this.connections.get(machineId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            try {
                connection.ws.send(JSON.stringify({
                    type: 'dispense',
                    slot,
                    quantity,
                    timestamp: new Date().toISOString()
                }));
                console.log(`🚀 Sent dispense command to ${machineId}: Slot ${slot}, Qty ${quantity}`);
                return true;
            } catch (error) {
                console.error(`❌ Error sending dispense command to ${machineId}:`, error);
                return false;
            }
        }
        console.warn(`⚠️ Cannot dispense: Machine ${machineId} not connected via WebSocket`);
        return false;
    }

    shutdown() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        if (this.wss) {
            this.wss.close();
        }
        console.log('🛑 Health Monitor shut down');
    }
}

export const healthMonitor = new HealthMonitorService();
