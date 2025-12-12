import Parse from 'parse';
import { config } from '../config';

// Initialize Parse
Parse.initialize(
    import.meta.env.VITE_PARSE_APPLICATION_ID, // Application ID
    import.meta.env.VITE_PARSE_JAVASCRIPT_KEY  // JavaScript Key
);

Parse.serverURL = 'https://parseapi.back4app.com/';

export interface ProductData {
    id?: string;
    name: string;
    slot: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    description?: string;
    machine?: string;
}

export interface OrderItemData {
    productId: string;
    name: string;
    quantity: number;
    priceAtPurchase: number;
}

export interface OrderData {
    id?: string;
    items: OrderItemData[];
    total: number;
    status: 'completed' | 'processing' | 'cancelled' | 'refunded';
    machine: string;
    transactionId?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    createdAt?: Date;
}

export interface MachineData {
    id?: string;
    machineId: string;
    name?: string;
    location: string;
    status: 'online' | 'offline' | 'maintenance';
    lastHeartbeat?: Date;
    lastPingTime?: Date;
    wsConnected?: boolean;
    owner?: string;
    ip?: string;
}

export const ParseService = {
    // ==================== PRODUCT METHODS ====================

    // Fetch all products
    getProducts: async (): Promise<ProductData[]> => {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        try {
            const results = await query.find();
            return results.map(product => ({
                id: product.id,
                name: product.get('name'),
                slot: product.get('slot'),
                price: product.get('price'),
                stock: product.get('stock'),
                category: product.get('category'),
                image: product.get('image'),
                description: product.get('description'),
                machine: product.get('machine'),
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Add a new product
    addProduct: async (data: ProductData): Promise<ProductData> => {
        const Product = Parse.Object.extend('Product');
        const product = new Product();

        product.set('name', data.name);
        product.set('slot', data.slot);
        product.set('price', data.price);
        product.set('stock', data.stock);
        product.set('category', data.category);
        product.set('image', data.image);
        product.set('description', data.description);
        product.set('machine', data.machine);

        try {
            const result = await product.save();
            return { ...data, id: result.id };
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    },

    // Update an existing product
    updateProduct: async (id: string, data: Partial<ProductData>): Promise<void> => {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        try {
            const product = await query.get(id);
            if (data.name) product.set('name', data.name);
            if (data.slot) product.set('slot', data.slot);
            if (data.price !== undefined) product.set('price', data.price);
            if (data.stock !== undefined) product.set('stock', data.stock);
            if (data.category) product.set('category', data.category);
            if (data.image) product.set('image', data.image);
            if (data.description) product.set('description', data.description);
            if (data.machine) product.set('machine', data.machine);

            await product.save();
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    // Delete a product
    deleteProduct: async (id: string): Promise<void> => {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        try {
            const product = await query.get(id);
            await product.destroy();
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // ==================== ORDER METHODS ====================

    // Create a new order
    createOrder: async (data: OrderData): Promise<OrderData> => {
        const Order = Parse.Object.extend('Order');
        const order = new Order();
        const currentUser = Parse.User.current();

        order.set('items', data.items);
        order.set('total', data.total);
        order.set('status', data.status);
        order.set('machine', data.machine);
        if (data.transactionId) order.set('transactionId', data.transactionId);

        // Associate order with current user
        if (currentUser) {
            order.set('userId', currentUser.id);
            order.set('userName', currentUser.get('name') || currentUser.get('username'));
            order.set('userEmail', currentUser.get('email'));
        }

        try {
            const result = await order.save();
            return {
                ...data,
                id: result.id,
                userId: result.get('userId'),
                userName: result.get('userName'),
                userEmail: result.get('userEmail'),
                createdAt: result.createdAt
            };
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    // Fetch all orders (admin use)
    getOrders: async (): Promise<OrderData[]> => {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.descending('createdAt');
        try {
            const results = await query.find();
            return results.map(order => ({
                id: order.id,
                items: order.get('items'),
                total: order.get('total'),
                status: order.get('status'),
                machine: order.get('machine'),
                transactionId: order.get('transactionId'),
                userId: order.get('userId'),
                userName: order.get('userName'),
                userEmail: order.get('userEmail'),
                createdAt: order.createdAt
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Get orders for a specific user
    getUserOrders: async (userId: string): Promise<OrderData[]> => {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.equalTo('userId', userId);
        query.descending('createdAt');
        try {
            const results = await query.find();
            return results.map(order => ({
                id: order.id,
                items: order.get('items'),
                total: order.get('total'),
                status: order.get('status'),
                machine: order.get('machine'),
                transactionId: order.get('transactionId'),
                userId: order.get('userId'),
                userName: order.get('userName'),
                userEmail: order.get('userEmail'),
                createdAt: order.createdAt
            }));
        } catch (error) {
            console.error('Error fetching user orders:', error);
            throw error;
        }
    },

    // Update order status
    updateOrderStatus: async (id: string, status: OrderData['status']): Promise<void> => {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        try {
            const order = await query.get(id);
            order.set('status', status);
            await order.save();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    // ==================== MACHINE METHODS ====================

    // Add a new machine
    addMachine: async (data: MachineData): Promise<MachineData> => {
        const Machine = Parse.Object.extend('Machine');
        const machine = new Machine();

        machine.set('machineId', data.machineId);
        if (data.name) machine.set('name', data.name);
        machine.set('location', data.location);
        machine.set('status', data.status);
        machine.set('lastHeartbeat', data.lastHeartbeat || new Date());
        if (data.owner) machine.set('owner', data.owner);
        if (data.ip) machine.set('ip', data.ip);

        try {
            const result = await machine.save();
            return {
                ...data,
                id: result.id
            };
        } catch (error) {
            console.error('Error adding machine:', error);
            throw error;
        }
    },

    // Fetch all machines
    getMachines: async (): Promise<MachineData[]> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        try {
            const results = await query.find();
            return results.map(machine => ({
                id: machine.id,
                machineId: machine.get('machineId'),
                name: machine.get('name'),
                location: machine.get('location'),
                status: machine.get('status'),
                lastHeartbeat: machine.get('lastHeartbeat'),
                lastPingTime: machine.get('lastPingTime'),
                wsConnected: machine.get('wsConnected'),
                owner: machine.get('owner'),
                ip: machine.get('ip')
            }));
        } catch (error) {
            console.error('Error fetching machines:', error);
            throw error;
        }
    },

    // Fetch a single machine by machineId
    getMachineById: async (machineId: string): Promise<MachineData | null> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        query.equalTo('machineId', machineId);
        try {
            const machine = await query.first();
            if (!machine) return null;

            return {
                id: machine.id,
                machineId: machine.get('machineId'),
                name: machine.get('name'),
                location: machine.get('location'),
                status: machine.get('status'),
                lastHeartbeat: machine.get('lastHeartbeat'),
                lastPingTime: machine.get('lastPingTime'),
                wsConnected: machine.get('wsConnected'),
                owner: machine.get('owner'),
                ip: machine.get('ip')
            };
        } catch (error) {
            console.error('Error fetching machine:', error);
            throw error;
        }
    },

    // Update machine
    updateMachine: async (id: string, data: Partial<MachineData>): Promise<void> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        try {
            const machine = await query.get(id);
            if (data.machineId) machine.set('machineId', data.machineId);
            if (data.name) machine.set('name', data.name);
            if (data.location) machine.set('location', data.location);
            if (data.status) machine.set('status', data.status);
            if (data.owner) machine.set('owner', data.owner);
            if (data.ip) machine.set('ip', data.ip);

            await machine.save();
        } catch (error) {
            console.error('Error updating machine:', error);
            throw error;
        }
    },

    // Get basic machine details including sensitive config/token
    getMachineDetails: async (id: string): Promise<any> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        try {
            const machine = await query.get(id);
            return {
                id: machine.id,
                machineId: machine.get('machineId'),
                name: machine.get('name'),
                status: machine.get('status'),
                location: machine.get('location'),
                token: machine.get('token'),
                config: machine.get('config') || {}
            };
        } catch (error) {
            console.error('Error fetching machine details:', error);
            throw error;
        }
    },

    // Sync/Migrate machine data (Admin Utility)
    syncMachineData: async (): Promise<number> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        query.limit(1000); // Increase limit just in case
        try {
            const results = await query.find();
            console.log(`Found ${results.length} machines to check...`);

            const dirtyMachines: Parse.Object[] = [];

            for (const machine of results) {
                let needsUpdate = false;
                const machineId = machine.get('machineId');

                // Check Name
                if (!machine.get('name') || machine.get('name') === '') {
                    const name = machineId === 'VM-001' ? 'Lobby Master' :
                        machineId === 'VM-002' ? '2nd Floor Snack Bot' :
                            machineId === 'VM-003' ? 'Gym Hydration Station' :
                                machineId === 'VM-004' ? 'Cafeteria Annex' : `Machine ${machineId}`;
                    machine.set('name', name);
                    needsUpdate = true;
                }

                // Check Owner
                if (!machine.get('owner') || machine.get('owner') === '') {
                    machine.set('owner', 'Black Box HQ');
                    needsUpdate = true;
                }

                // Check IP
                if (!machine.get('ip') || machine.get('ip') === '') {
                    machine.set('ip', '192.168.1.xxx');
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    dirtyMachines.push(machine);
                }
            }

            if (dirtyMachines.length > 0) {
                console.log(`Saving ${dirtyMachines.length} distinct machines...`);
                await Parse.Object.saveAll(dirtyMachines);
            }

            return dirtyMachines.length;
        } catch (error) {
            console.error('Error syncing machines:', error);
            throw error;
        }
    },

    // Update machine status
    updateMachineStatus: async (id: string, status: MachineData['status']): Promise<void> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        try {
            const machine = await query.get(id);
            machine.set('status', status);
            machine.set('lastHeartbeat', new Date());
            await machine.save();
        } catch (error) {
            console.error('Error updating machine status:', error);
            throw error;
        }
    },

    // ==================== AUTHENTICATION METHODS ====================

    // Sign up a new user with email and password
    signUp: async (username: string, email: string, password: string, name: string, phone: string): Promise<Parse.User> => {
        const user = new Parse.User();
        user.set('username', username);
        user.set('email', email);
        user.set('password', password);
        user.set('name', name);
        user.set('phone', phone);

        try {
            const newUser = await user.signUp();

            // Set ACL to allow public read so admins can view the user
            // Note: In a production environment with strict security, consider using Parse Roles (e.g., 'Admin' role).
            const acl = newUser.getACL() || new Parse.ACL(newUser);
            acl.setPublicReadAccess(true);
            newUser.setACL(acl);
            await newUser.save();

            return newUser;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    },

    // Login with username/email and password
    login: async (username: string, password: string): Promise<Parse.User> => {
        try {
            const user = await Parse.User.logIn(username, password);

            // Explicitly fetch the user object to ensure custom fields like 'role' are loaded
            await user.fetch();

            // Self-heal: Ensure ACL is public read if not already
            const acl = user.getACL() || new Parse.ACL(user);
            if (!acl.getPublicReadAccess()) {
                acl.setPublicReadAccess(true);
                user.setACL(acl);
                await user.save();
            }

            return user;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Login with Google OAuth
    loginWithGoogle: async (idToken: string, googleUser: any): Promise<Parse.User> => {
        try {
            // Create auth data for Parse
            const authData = {
                id: googleUser.id,
                id_token: idToken,
            };

            // Link with Google
            const user = new Parse.User();
            await user.linkWith('google', { authData });

            // Set additional user info from Google
            if (!user.get('email')) {
                user.set('email', googleUser.email);
            }
            if (!user.get('username') && googleUser.email) {
                // Use email prefix as username if not set
                user.set('username', googleUser.email.split('@')[0]);
            }
            if (googleUser.name) {
                user.set('name', googleUser.name);
            }
            if (googleUser.picture) {
                user.set('profilePicture', googleUser.picture);
            }

            // Ensure ACL is set to Public Read so admins can see the user
            const acl = user.getACL() || new Parse.ACL(user);
            if (!acl.getPublicReadAccess()) {
                acl.setPublicReadAccess(true);
                user.setACL(acl);
            }

            await user.save();
            return user;
        } catch (error) {
            console.error('Error logging in with Google:', error);
            throw error;
        }
    },

    // Logout current user
    logout: async (): Promise<void> => {
        try {
            await Parse.User.logOut();
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    // Get current logged-in user
    getCurrentUser: (): Parse.User | null => {
        return Parse.User.current();
    },

    // Request password reset
    resetPassword: async (email: string): Promise<void> => {
        try {
            await Parse.User.requestPasswordReset(email);
        } catch (error) {
            console.error('Error requesting password reset:', error);
            throw error;
        }
    },

    // Update user profile
    updateUserProfile: async (updates: { name?: string; email?: string; phone?: string; profilePicture?: any }): Promise<void> => {
        const user = Parse.User.current();
        if (!user) {
            throw new Error('No user logged in');
        }

        try {
            if (updates.name) user.set('name', updates.name);
            if (updates.email) user.set('email', updates.email);
            if (updates.phone) user.set('phone', updates.phone);
            if (updates.profilePicture) user.set('profilePicture', updates.profilePicture);
            await user.save();
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    // Check if current user has completed their profile (has name and phone)
    isProfileComplete: (): boolean => {
        const user = Parse.User.current();
        if (!user) {
            return false;
        }
        const name = user.get('name');
        const phone = user.get('phone');
        return !!(name && phone);
    },

    // ==================== ROLE MANAGEMENT METHODS ====================

    // Get the role of the current user
    getUserRole: (): string => {
        const user = Parse.User.current();
        if (!user) {
            return 'guest';
        }
        return user.get('role') || 'user';
    },

    // Check if current user is an admin
    isAdmin: (): boolean => {
        const user = Parse.User.current();
        if (!user) {
            return false;
        }
        return user.get('role') === 'admin';
    },

    // Set a user's role (admin-only function, should be protected)
    setUserRole: async (userId: string, role: 'user' | 'admin'): Promise<void> => {
        const currentUser = Parse.User.current();
        if (!currentUser || currentUser.get('role') !== 'admin') {
            throw new Error('Unauthorized: Only admins can change user roles');
        }

        const query = new Parse.Query(Parse.User);
        try {
            const user = await query.get(userId);
            user.set('role', role);
            await user.save();
        } catch (error) {
            console.error('Error setting user role:', error);
            throw error;
        }
    },

    // Get all users (admin-only function)
    getAllUsers: async (): Promise<Array<{ id: string; username: string; email: string; name?: string; profilePicture?: string; role: string; createdAt: Date; updatedAt: Date }>> => {
        const currentUser = Parse.User.current();
        if (!currentUser || currentUser.get('role') !== 'admin') {
            throw new Error('Unauthorized: Only admins can view all users');
        }

        const query = new Parse.Query(Parse.User);
        query.limit(1000);
        try {
            const results = await query.find();
            return results.map(user => ({
                id: user.id,
                username: user.get('username'),
                email: user.get('email'),
                name: user.get('name'),
                profilePicture: user.get('profilePicture'),
                role: user.get('role') || 'user',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // ==================== MACHINE-SPECIFIC DATA METHODS ====================

    // Get products for a specific machine
    getProductsByMachine: async (machineId: string): Promise<ProductData[]> => {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.equalTo('machine', machineId);
        try {
            const results = await query.find();
            return results.map(product => ({
                id: product.id,
                name: product.get('name'),
                slot: product.get('slot'),
                price: product.get('price'),
                stock: product.get('stock'),
                category: product.get('category'),
                image: product.get('image'),
                description: product.get('description'),
                machine: product.get('machine'),
            }));
        } catch (error) {
            console.error('Error fetching products by machine:', error);
            throw error;
        }
    },

    // Get orders for a specific machine
    getOrdersByMachine: async (machineId: string): Promise<OrderData[]> => {
        const Order = Parse.Object.extend('Order');
        const query = new Parse.Query(Order);
        query.equalTo('machine', machineId);
        query.descending('createdAt');
        try {
            const results = await query.find();
            return results.map(order => ({
                id: order.id,
                items: order.get('items'),
                total: order.get('total'),
                status: order.get('status'),
                machine: order.get('machine'),
                transactionId: order.get('transactionId'),
                userId: order.get('userId'),
                userName: order.get('userName'),
                userEmail: order.get('userEmail'),
                createdAt: order.createdAt
            }));
        } catch (error) {
            console.error('Error fetching orders by machine:', error);
            throw error;
        }
    },

    // Calculate total revenue for a machine
    getMachineRevenue: async (machineId: string): Promise<number> => {
        try {
            const orders = await ParseService.getOrdersByMachine(machineId);
            return orders.reduce((sum, order) => sum + order.total, 0);
        } catch (error) {
            console.error('Error calculating machine revenue:', error);
            throw error;
        }
    },

    // Get total inventory count for a machine
    getMachineInventoryCount: async (machineId: string): Promise<number> => {
        try {
            const products = await ParseService.getProductsByMachine(machineId);
            return products.reduce((sum, product) => sum + product.stock, 0);
        } catch (error) {
            console.error('Error calculating machine inventory:', error);
            throw error;
        }
    },

    // Update machine configuration
    updateMachineConfig: async (id: string, config: any): Promise<void> => {
        const Machine = Parse.Object.extend('Machine');
        const query = new Parse.Query(Machine);
        try {
            const machine = await query.get(id);

            // Update basic fields
            if (config.name !== undefined) machine.set('name', config.name);
            if (config.location !== undefined) machine.set('location', config.location);
            if (config.ip !== undefined) machine.set('ip', config.ip);
            if (config.owner !== undefined) machine.set('owner', config.owner);

            // Update config object
            const currentConfig = machine.get('config') || {};
            if (config.wifiSsid !== undefined || config.wifiPass !== undefined) {
                machine.set('config', {
                    ...currentConfig,
                    wifiSsid: config.wifiSsid !== undefined ? config.wifiSsid : currentConfig.wifiSsid,
                    wifiPass: config.wifiPass !== undefined ? config.wifiPass : currentConfig.wifiPass
                });
            }

            await machine.save();
        } catch (error) {
            console.error('Error updating machine config:', error);
            throw error;
        }
    },

    // Get machine statistics
    getMachineStatistics: async (machineId: string): Promise<{
        totalInventory: number;
        totalRevenue: number;
        orderCount: number;
        productCount: number;
    }> => {
        try {
            const [products, orders] = await Promise.all([
                ParseService.getProductsByMachine(machineId),
                ParseService.getOrdersByMachine(machineId)
            ]);

            return {
                totalInventory: products.reduce((sum, p) => sum + p.stock, 0),
                totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
                orderCount: orders.length,
                productCount: products.length
            };
        } catch (error) {
            console.error('Error fetching machine statistics:', error);
            throw error;
        }
    },

    // ==================== MACHINE LOG METHODS ====================

    // Get logs for a specific machine
    getMachineLogs: async (machineId: string, filters?: { logType?: string; limit?: number }): Promise<Array<{
        id: string;
        machineId: string;
        logType: string;
        message: string;
        metadata: any;
        severity: 'info' | 'warning' | 'error';
        timestamp: Date;
    }>> => {
        try {
            const { logType, limit = 100 } = filters || {};
            const params = new URLSearchParams();
            if (logType) params.append('logType', logType);
            params.append('limit', limit.toString());

            const response = await fetch(`${config.apiUrl}/logs/${machineId}?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch machine logs');
            }

            const logs = await response.json();
            return logs.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
        } catch (error) {
            console.error('Error fetching machine logs:', error);
            throw error;
        }
    },

    // ==================== DASHBOARD METHODS ====================

    getDashboardStats: async (): Promise<any> => {
        try {
            // Parallel fetch for efficiency
            const [summaryRes, transactionsRes] = await Promise.all([
                fetch(`${config.apiUrl}/finance/summary?range=today`),
                fetch(`${config.apiUrl}/finance/transactions?limit=5`)
            ]);

            const summary = await summaryRes.json();
            const transactionsData = await transactionsRes.json();

            // Machines Query (Get ALL machines to calculate Online/Total)
            const Machine = Parse.Object.extend('Machine');
            const machineQuery = new Parse.Query(Machine);
            const machines = await machineQuery.find();
            const machinesData = machines.map(m => ({
                id: m.id,
                status: m.get('status'),
                connected: m.get('status') === 'online'
            }));

            // Low Stock Query
            const Product = Parse.Object.extend('Product');
            const query = new Parse.Query(Product);
            query.lessThan('stock', 10);
            const lowStockCount = await query.count();

            return {
                revenue: summary.totalRevenue || 0,
                orders: summary.totalOrders || 0,
                avgOrder: summary.avgOrderValue || 0,
                machines: machinesData,
                recentTransactions: transactionsData.data || [],
                lowStockCount
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return safe defaults
            return {
                revenue: 0,
                orders: 0,
                avgOrder: 0,
                machines: [],
                recentTransactions: [],
                lowStockCount: 0
            };
        }
    },

    async getSalesChartData(range: 'today' | 'week' | 'month'): Promise<any[]> {
        try {
            const response = await fetch(`${config.apiUrl}/finance/summary?range=${range}`);
            const data = await response.json();
            return data.chartData || [];
        } catch (error) {
            console.error(`Error fetching sales chart for ${range}:`, error);
            return [];
        }
    }
};
