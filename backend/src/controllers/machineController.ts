import { Request, Response } from 'express';
import Parse from '../services/parseServer';
import { generateESPSketch, MachineTemplateData, ProductTemplateData } from '../templates/sketchTemplate';
import { healthMonitor } from '../services/healthMonitor';
import { logMachineEvent } from './logController';
import os from 'os';

// Helper to fetch machine by ID (either objectId or machineId)
const getMachine = async (id: string): Promise<Parse.Object | null> => {
    const Machine = Parse.Object.extend('Machine');
    const query = new Parse.Query(Machine);
    try {
        return await query.get(id); // try getting by objectId
    } catch (e) {
        // if failed, try machineId
        const query2 = new Parse.Query(Machine);
        query2.equalTo('machineId', id);
        return await query2.first() || null;
    }
};

// Helper to get local IP address of this server
const getLocalIPAddress = (): string => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const nets = interfaces[name];
        if (!nets) continue;

        for (const net of nets) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '192.168.1.100'; // Fallback
};


export const downloadSketch = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        // Fetch products for this machine to map slots
        const Product = Parse.Object.extend('Product');
        const productQuery = new Parse.Query(Product);
        // Assuming products have 'machine' field storing machineId OR machineName, handle broadly
        const machineId = machine.get('machineId');
        const machineName = machine.get('name');

        // Complex query to match products
        const q1 = new Parse.Query(Product);
        q1.equalTo('machine', machineId);

        const q2 = new Parse.Query(Product);
        q2.equalTo('machine', machineName);

        const mainQuery = Parse.Query.or(q1, q2);
        const products = await mainQuery.find();

        const backendUrl = process.env.RENDER_EXTERNAL_HOSTNAME || getLocalIPAddress();

        const machineData: MachineTemplateData = {
            machineId: machine.get('machineId'),
            name: machine.get('name') || 'Vending Machine',
            ip: machine.get('ip'),
            backendUrl: backendUrl,
            // user can add wifiSsid/Password handling here later if stored in DB securely
        };

        const productData: ProductTemplateData[] = products.map((p: Parse.Object) => ({
            slot: p.get('slot'),
            name: p.get('name'),
            machine: p.get('machine')
        }));

        const sketchCode = generateESPSketch(machineData, productData);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${machineId}_vending_sketch.ino"`);
        res.send(sketchCode);

    } catch (error) {
        console.error('Error generating sketch:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const startMachine = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        const ip = machine.get('ip');
        if (!ip) {
            res.status(400).json({ error: 'Machine has no IP address configured' });
            return;
        }

        // Check WebSocket connection status
        const machineId = machine.get('machineId');
        const status = healthMonitor.getMachineStatus(machineId);

        if (status.connected) {
            // Update status in DB
            machine.set('status', 'online');
            machine.set('lastHeartbeat', new Date());
            await machine.save();

            res.json({
                success: true,
                status: 'online',
                message: 'Machine is reachable via WebSocket',
                data: status
            });
        } else {
            // If not connected via WebSocket, it's effectively offline/unreachable for commands
            res.status(504).json({
                success: false,
                message: 'Machine is not connected to WebSocket Server'
            });
        }

    } catch (error) {
        console.error('Error starting machine:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const dispenseProduct = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { items }: { items: { productId: string; quantity: number }[] } = req.body; // Expecting array of { productId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'No items to dispense' });
        return;
    }

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        const ip = machine.get('ip');
        if (!ip) {
            res.status(400).json({ error: 'Machine has no IP address configured' });
            return;
        }

        const results = [];
        const Product = Parse.Object.extend('Product');

        for (const item of items) {
            const { productId, quantity } = item;

            try {
                // Fetch product to get slot
                const query = new Parse.Query(Product);
                // item.productId might be the objectId
                const product = await query.get(productId);

                if (!product) {
                    results.push({ productId, success: false, error: 'Product not found' });
                    continue;
                }

                const rawSlot = product.get('slot');
                if (!rawSlot) {
                    results.push({ productId, success: false, error: 'Product has no slot assigned' });
                    continue;
                }

                // Parse Pin from Slot (e.g. "D12" -> 12)
                const pinMatch = rawSlot.match(/\d+/);
                const pin = pinMatch ? parseInt(pinMatch[0], 10) : -1;

                if (pin === -1) {
                    results.push({ productId, success: false, error: 'Invalid slot format' });
                    continue;
                }

                console.log(`Dispensing Product ${product.get('name')} (Slot ${rawSlot}, Pin ${pin}) x ${quantity} from Machine ${ip}`);

                // Fire-and-forget approach: Send dispense command without waiting for response
                // The ESP32 will process the command regardless, and waiting causes timeout issues
                // with the current ESP32 sketch that responds after dispensing completes

                const expectedTime = quantity * 1500; // 1.5s per dispense in milliseconds
                const machineId = machine.get('machineId');

                console.log(`Expected dispense time: ${expectedTime}ms`);
                console.log(`📤 Sending Dispense Command via WebSocket to ${machineId}`);

                const sent = healthMonitor.sendDispenseCommand(machineId, pin, quantity || 1);

                if (sent) {
                    logMachineEvent(
                        machineId,
                        'dispense',
                        `Dispense command sent for ${product.get('name')} x${quantity}`,
                        { productId, productName: product.get('name'), slot: rawSlot, pin, quantity, status: 'sent' },
                        'info'
                    );

                    results.push({
                        productId,
                        success: true,
                        message: 'Dispense command sent to machine via WebSocket',
                        expectedDuration: `${expectedTime}ms`
                    });
                } else {
                    logMachineEvent(
                        machineId,
                        'error',
                        `Failed to dispense ${product.get('name')}: Machine not connected via WebSocket`,
                        { productId, error: 'WEBSOCKET_NOT_CONNECTED', ip },
                        'error'
                    );

                    results.push({
                        productId,
                        success: false,
                        error: 'Machine not connected via WebSocket'
                    });
                }

            } catch (err: any) {
                console.error(`Failed to dispense item ${productId}:`, err);
                results.push({ productId, success: false, error: err.message });
            }
        }

        res.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Error in dispense process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMachineHealth = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        const machineId = machine.get('machineId');
        const status = healthMonitor.getMachineStatus(machineId);

        res.json({
            machineId,
            status: status.status,
            lastPing: status.lastPing,
            connected: status.connected
        });
    } catch (error) {
        console.error('Error getting machine health:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllMachinesHealth = async (req: Request, res: Response): Promise<void> => {
    try {
        const statuses = healthMonitor.getAllMachinesStatus();
        res.json({ machines: statuses });
    } catch (error) {
        console.error('Error getting all machines health:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get comprehensive statistics for a specific machine
export const getMachineStatistics = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        const machineId = machine.get('machineId');

        // Fetch products for this machine
        const Product = Parse.Object.extend('Product');
        const productQuery = new Parse.Query(Product);
        productQuery.equalTo('machine', machineId);
        const products = await productQuery.find();

        // Calculate total inventory
        const totalInventory = products.reduce((sum: number, p: Parse.Object) => sum + (p.get('stock') || 0), 0);

        // Fetch orders for this machine
        const Order = Parse.Object.extend('Order');
        const orderQuery = new Parse.Query(Order);
        orderQuery.equalTo('machine', machineId);
        orderQuery.descending('createdAt');
        const allOrders = await orderQuery.find();

        // Calculate revenue
        const totalRevenue = allOrders.reduce((sum: number, o: Parse.Object) => sum + (o.get('total') || 0), 0);

        // Get recent orders (last 5)
        const recentOrders = allOrders.slice(0, 5).map((order: Parse.Object) => ({
            id: order.id,
            total: order.get('total'),
            status: order.get('status'),
            items: order.get('items'),
            createdAt: order.createdAt
        }));

        // Product distribution
        const productDistribution = products.map((p: Parse.Object) => ({
            id: p.id,
            name: p.get('name'),
            stock: p.get('stock'),
            slot: p.get('slot')
        }));

        res.json({
            machineId,
            statistics: {
                totalInventory,
                totalRevenue,
                orderCount: allOrders.length,
                productCount: products.length
            },
            recentOrders,
            productDistribution
        });

    } catch (error) {
        console.error('Error getting machine statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update machine configuration
export const updateMachineConfig = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { config } = req.body;

    if (!config) {
        res.status(400).json({ error: 'Configuration data required' });
        return;
    }

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        // Update configuration fields
        if (config.name) machine.set('name', config.name);
        if (config.location) machine.set('location', config.location);
        if (config.ip) machine.set('ip', config.ip);
        if (config.wifiSsid || config.wifiPass) {
            const currentConfig = machine.get('config') || {};
            machine.set('config', {
                ...currentConfig,
                wifiSsid: config.wifiSsid || currentConfig.wifiSsid,
                wifiPass: config.wifiPass || currentConfig.wifiPass
            });
        }

        await machine.save();

        res.json({
            success: true,
            message: 'Configuration updated successfully',
            machine: {
                id: machine.id,
                machineId: machine.get('machineId'),
                name: machine.get('name'),
                location: machine.get('location'),
                ip: machine.get('ip'),
                config: machine.get('config')
            }
        });

    } catch (error) {
        console.error('Error updating machine config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update machine status
export const updateMachineStatusController = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['online', 'offline', 'maintenance'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be: online, offline, or maintenance' });
        return;
    }

    try {
        const machine = await getMachine(id);

        if (!machine) {
            res.status(404).json({ error: 'Machine not found' });
            return;
        }

        machine.set('status', status);
        machine.set('lastHeartbeat', new Date());
        await machine.save();

        res.json({
            success: true,
            message: `Machine status updated to ${status}`,
            machine: {
                id: machine.id,
                machineId: machine.get('machineId'),
                status: machine.get('status')
            }
        });

    } catch (error) {
        console.error('Error updating machine status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
