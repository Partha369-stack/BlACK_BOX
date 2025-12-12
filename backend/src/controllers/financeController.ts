
import { Request, Response } from 'express';
// @ts-ignore
import Parse from 'parse/node';

// Helper to get start/end of day/week/month
const getDateRange = (range: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'custom' && customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
        // Ensure end date includes the full day if time is 00:00
        if (end.getHours() === 0 && end.getMinutes() === 0) {
            end.setHours(23, 59, 59, 999);
        }
    } else {
        // Default to last 30 days
        start.setDate(now.getDate() - 30);
    }

    return { start, end };
};

export const financeController = {
    // 1. Global Finance Summary
    getFinanceSummary: async (req: Request, res: Response) => {
        try {
            const { range, startDate, endDate } = req.query;
            const { start, end } = getDateRange(range as string, startDate as string, endDate as string);

            console.log(`[Finance] Fetching summary from ${start.toISOString()} to ${end.toISOString()}`);

            // Query Orders
            const Order = Parse.Object.extend('Order');
            const query = new Parse.Query(Order);
            query.greaterThanOrEqualTo('createdAt', start);
            query.lessThanOrEqualTo('createdAt', end);
            // query.equalTo('status', 'completed'); // Temporarily removed to see all data
            query.limit(10000);

            // Log the query to see if it's correct
            console.log('[Finance] Querying Orders...');

            // @ts-ignore - useMasterKey is valid in node SDK if initialized
            const orders = await query.find({ useMasterKey: true });

            console.log(`[Finance] Found ${orders.length} orders.`);

            let totalRevenue = 0;
            let totalOrders = orders.length;
            const paymentMethods: Record<string, number> = {};

            // Initialize Chart Data Buckets
            const chartMap: Map<string, number> = new Map();
            const labels: string[] = [];

            if (range === 'today') {
                // Hourly buckets (00 to 23)
                for (let i = 0; i < 24; i++) {
                    const label = i.toString().padStart(2, '0') + ':00';
                    chartMap.set(label, 0);
                    labels.push(label);
                }
            } else {
                // Daily buckets (from start to end)
                const current = new Date(start);
                while (current <= end) {
                    const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    // Avoid duplicate labels for same day if loop increments by time? No, we'll increment by day.
                    if (!chartMap.has(label)) {
                        chartMap.set(label, 0);
                        labels.push(label);
                    }
                    current.setDate(current.getDate() + 1);
                }
            }

            orders.forEach((order: any) => {
                const status = (order.get('status') || '').toLowerCase();
                const total = order.get('total') || 0;
                const createdAt = order.createdAt;

                // 1. Revenue & Payment Methods
                if (status !== 'failed' && status !== 'cancelled' && status !== 'refunded') {
                    totalRevenue += total;

                    // 2. Chart Data Population
                    let label = '';
                    if (range === 'today') {
                        // Group by Hour (adjusted to local time approximately or server time)
                        // Using getHours() uses server local time. 
                        const hour = createdAt.getHours();
                        label = hour.toString().padStart(2, '0') + ':00';
                    } else {
                        // Group by Date
                        label = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }

                    if (chartMap.has(label)) {
                        chartMap.set(label, (chartMap.get(label) || 0) + total);
                    }
                }

                const method = order.get('paymentMethod') || 'UPI';
                paymentMethods[method] = (paymentMethods[method] || 0) + 1;
            });

            // Convert Map to Array for Frontend
            const chartData = labels.map(label => ({
                label,
                value: chartMap.get(label) || 0
            }));

            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            res.json({
                totalRevenue,
                totalOrders,
                avgOrderValue,
                paymentMethods,
                chartData,
                period: { start, end }
            });
        } catch (error) {
            console.error('Error fetching finance summary:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 2. Per-Machine Finance
    getMachineFinance: async (req: Request, res: Response) => {
        try {
            const { range, startDate, endDate, machineId } = req.query;
            const { start, end } = getDateRange(range as string, startDate as string, endDate as string);

            const Order = Parse.Object.extend('Order');
            const query = new Parse.Query(Order);
            query.greaterThanOrEqualTo('createdAt', start);
            query.lessThanOrEqualTo('createdAt', end);
            // query.equalTo('status', 'completed'); // Relaxed filter
            if (machineId) {
                query.equalTo('machine', machineId);
            }
            query.limit(10000);

            const orders = await query.find({ useMasterKey: true });

            // Aggregation by machine
            const machineStats: Record<string, any> = {};

            for (const order of orders) {
                const macId = order.get('machine'); // This assumes 'machine' field stores the Machine ID string
                const total = order.get('total') || 0;

                if (!machineStats[macId]) {
                    // We might want to fetch machine details here or separate lookup
                    machineStats[macId] = {
                        machineId: macId,
                        revenue: 0,
                        orders: 0,
                        lastTransaction: null
                    };
                }

                machineStats[macId].revenue += total;
                machineStats[macId].orders += 1;

                const orderDate = order.createdAt || new Date(0); // Fallback to epoch if undefined
                if (!machineStats[macId].lastTransaction || orderDate > machineStats[macId].lastTransaction) {
                    machineStats[macId].lastTransaction = orderDate;
                }
            }

            // Convert to array
            const results = Object.values(machineStats).map(stat => ({
                ...stat,
                avgOrderValue: stat.orders > 0 ? stat.revenue / stat.orders : 0
            }));

            res.json(results);
        } catch (error) {
            console.error('Error fetching machine finance:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 3. Transactions List
    getTransactions: async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 20, machineId, status, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const Order = Parse.Object.extend('Order');
            const query = new Parse.Query(Order);

            if (search) {
                // Search by Order ID, Transaction ID, or Machine ID
                const searchStr = String(search);
                const q1 = new Parse.Query(Order);
                q1.equalTo('objectId', searchStr);

                const q2 = new Parse.Query(Order);
                q2.matches('transactionId', searchStr, 'i'); // Case insensitive regex match

                const q3 = new Parse.Query(Order);
                q3.matches('machine', searchStr, 'i');

                // Combine queries with OR
                const mainQuery = Parse.Query.or(q1, q2, q3);

                // We need to apply other filters to this main query, which is tricky with 'OR'. 
                // Parse Query.or() creates a new composite query.
                // Re-apply filters to each sub-query or use mainQuery (limitations apply).
                // Simpler approach: Apply search as primary filter, then apply others if standard query structure allows or warn about limitations.
                // For simplicity and robustness with Parse OR queries, let's just use the OR query if search is present.
                // To combine AND with OR in Parse, we use Parse.Query.and() or simple constraint chaining if acceptable.

                // Let's refine:
                const queries = [q1, q2, q3];
                // If we had user search, we'd add it here but it requires querying users first.

                // Apply common filters to all OR-branches or construct a main AND query that contains the OR
                // Note: Parse complex queries can be heavy. Let's stick to IDs for efficiency.

                // Using the composite query as the base
                // query = Parse.Query.or(...queries); // Reassigning query variable won't work well due to 'const' but wait, I can use 'let' or just work with 'mainQuery'

                // Let's rewrite the variable declaration above to let
                var finalQuery = Parse.Query.or(...queries);
            } else {
                var finalQuery = query;
            }

            if (machineId) finalQuery.equalTo('machine', machineId);
            if (status) finalQuery.equalTo('status', status);

            finalQuery.include('user'); // Fetch related user data
            finalQuery.descending('createdAt');
            finalQuery.skip(skip);
            finalQuery.limit(Number(limit));

            // 1. Fetch Orders
            const results = await finalQuery.find({ useMasterKey: true });
            const total = await finalQuery.count({ useMasterKey: true });

            // 2. Collect unique User IDs from 'userId' string field
            const userIds = new Set<string>();
            results.forEach((order: any) => {
                const uid = order.get('userId'); // String field
                if (uid) userIds.add(uid);
            });

            // 3. Fetch Users efficiently
            let usersMap = new Map<string, any>();
            if (userIds.size > 0) {
                const userQuery = new Parse.Query(Parse.User);
                userQuery.containedIn('objectId', Array.from(userIds));
                const users = await userQuery.find({ useMasterKey: true });
                users.forEach((u: any) => usersMap.set(u.id, u));
            }

            // 4. Map transactions with user data
            const transactions = results.map((order: any) => {
                const userId = order.get('userId');
                const user = usersMap.get(userId);

                // Fallback to Order-stored details if User object not found
                // PRIORITIZE 'name' (Display Name) over 'username' (which might be an ID)
                const customerName = user?.get('name') || user?.get('username') || order.get('userName') || 'Guest';
                const customerEmail = user?.get('email') || order.get('userEmail') || 'N/A';

                // Use 'profilePicture' (based on ParseService) instead of 'profileImage'
                const profilePic = user?.get('profilePicture');
                const customerImage = profilePic?._url || profilePic || null;

                return {
                    id: order.id,
                    orderId: order.id,
                    machine: order.get('machine'),
                    amount: order.get('total'),
                    status: order.get('status'),
                    created: order.createdAt,
                    transactionId: order.get('transactionId'),
                    items: order.get('items'),
                    customer: {
                        name: customerName,
                        email: customerEmail,
                        image: customerImage
                    }
                };
            });

            res.json({
                data: transactions,
                pagination: {
                    total,
                    page: Number(page),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });

        } catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 4. Per-Partner Finance
    getPartnerFinance: async (req: Request, res: Response) => {
        try {
            const query = new Parse.Query(Parse.User);
            query.equalTo('role', 'partner');
            const partners = await query.find();

            // In a real scenario, we would aggregate revenue from orders linked to these partners
            // For now, we return the partners with placeholder stats
            const results = partners.map((p: Parse.Object) => ({
                id: p.id,
                name: p.get('username'), // or 'name'
                email: p.get('email'),
                machineCount: 0, // Would need to query machines count
                totalRevenue: 0,
                pendingPayout: 0
            }));

            res.json(results);
        } catch (error) {
            console.error('Error fetching partner finance:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 5. Create Payout
    createPayout: async (req: Request, res: Response) => {
        try {
            const { partnerId, amount, periodStart, periodEnd } = req.body;

            if (!partnerId || !amount) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const Payout = Parse.Object.extend('Payout');
            const payout = new Payout();

            payout.set('partner', Parse.User.createWithoutData(partnerId));
            payout.set('amount', Number(amount));
            payout.set('status', 'PENDING');
            payout.set('periodStart', new Date(periodStart));
            payout.set('periodEnd', new Date(periodEnd));

            await payout.save();

            res.json({ success: true, id: payout.id });
        } catch (error) {
            console.error('Error creating payout:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 6. Export Transactions (CSV)
    exportTransactions: async (req: Request, res: Response) => {
        try {
            const { machineId, status, startDate, endDate } = req.query;
            const Order = Parse.Object.extend('Order');
            const query = new Parse.Query(Order);

            if (machineId) query.equalTo('machine', machineId);
            if (status) query.equalTo('status', status);
            if (startDate && endDate) {
                query.greaterThanOrEqualTo('createdAt', new Date(startDate as string));
                query.lessThanOrEqualTo('createdAt', new Date(endDate as string));
            }
            query.descending('createdAt');
            query.limit(1000); // Limit export size for now

            const results = await query.find();

            // Check if results exist
            if (results.length === 0) {
                return res.status(404).send('No records found to export');
            }

            // CSV Header
            const fields = ['OrderID', 'Date', 'Machine', 'Amount', 'Status', 'TransactionID'];
            let csv = fields.join(',') + '\n';

            // CSV Rows
            results.forEach((order: any) => {
                const row = [
                    order.id,
                    order.createdAt.toISOString(),
                    order.get('machine') || '',
                    order.get('total') || 0,
                    order.get('status') || '',
                    order.get('transactionId') || ''
                ];
                csv += row.join(',') + '\n';
            });

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', 'attachment; filename="transactions.csv"');
            res.send(csv);

        } catch (error) {
            console.error('Error exporting transactions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 7. Add Expense
    addExpense: async (req: Request, res: Response) => {
        try {
            const { amount, description, category, type, date, machineId } = req.body;

            if (!amount || !description || !category) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const Expense = Parse.Object.extend('Expense');
            const expense = new Expense();

            expense.set('amount', Number(amount));
            expense.set('description', description);
            expense.set('category', category);
            expense.set('type', type || 'Variable'); // Default to Variable
            expense.set('date', new Date(date || new Date()));
            if (machineId) expense.set('machine', machineId);

            await expense.save();

            res.json({ success: true, id: expense.id });
        } catch (error) {
            console.error('Error adding expense:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 8. Update Expense
    updateExpense: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { amount, description, category, type, date } = req.body;

            const Expense = Parse.Object.extend('Expense');
            const query = new Parse.Query(Expense);
            const expense = await query.get(id);

            if (amount) expense.set('amount', Number(amount));
            if (description) expense.set('description', description);
            if (category) expense.set('category', category);
            if (type) expense.set('type', type);
            if (date) expense.set('date', new Date(date));

            await expense.save();
            res.json({ success: true });
        } catch (error) {
            console.error('Error updating expense:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 9. Delete Expense
    deleteExpense: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const Expense = Parse.Object.extend('Expense');
            const query = new Parse.Query(Expense);
            const expense = await query.get(id);
            await expense.destroy();
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting expense:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 10. Get Expenses
    getExpenses: async (req: Request, res: Response) => {
        try {
            const { startDate, endDate, limit = 50 } = req.query;

            const Expense = Parse.Object.extend('Expense');
            const query = new Parse.Query(Expense);

            if (startDate && endDate) {
                query.greaterThanOrEqualTo('date', new Date(startDate as string));
                query.lessThanOrEqualTo('date', new Date(endDate as string));
            }

            query.descending('date');
            query.limit(Number(limit));

            const results = await query.find();

            const expenses = results.map((e: any) => ({
                id: e.id,
                amount: e.get('amount'),
                description: e.get('description'),
                category: e.get('category'),
                type: e.get('type') || 'Variable',
                date: e.get('date'),
                machine: e.get('machine')
            }));

            res.json(expenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // 11. Refund Order
    refundOrder: async (req: Request, res: Response) => {
        try {
            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({ error: "Missing orderId" });
            }

            const Order = Parse.Object.extend('Order');
            const query = new Parse.Query(Order);
            // @ts-ignore
            const order = await query.get(orderId, { useMasterKey: true });

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            if (order.get('status') === 'refunded') {
                return res.status(400).json({ error: "Order already refunded" });
            }

            order.set('status', 'refunded');
            // @ts-ignore
            await order.save(null, { useMasterKey: true });

            console.log(`[Finance] Order ${orderId} marked as refunded.`);

            res.json({ success: true, message: "Order refunded successfully" });
        } catch (error) {
            console.error('Error processing refund:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
