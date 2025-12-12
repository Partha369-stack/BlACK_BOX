import { config } from '../config';

export interface FinanceSummary {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    paymentMethods: Record<string, number>;
    period: {
        start: string;
        end: string;
    };
}

export interface MachineFinanceStat {
    machineId: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
    lastTransaction: string | null;
}

export interface Transaction {
    id: string;
    orderId: string;
    machine: string;
    amount: number;
    status: string;
    created: string;
    transactionId?: string;
    paymentMethod?: string;
    items?: any[];
    customer?: {
        name: string;
        email: string;
        image?: string;
    } | null;
}

export const FinanceService = {
    getSummary: async (range: 'today' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string): Promise<FinanceSummary> => {
        const params = new URLSearchParams({ range });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${config.apiUrl}/finance/summary?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch finance summary');
        return response.json();
    },

    getMachineStats: async (range: 'today' | 'week' | 'month' | 'custom', startDate?: string, endDate?: string): Promise<MachineFinanceStat[]> => {
        const params = new URLSearchParams({ range });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${config.apiUrl}/finance/machines?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch machine stats');
        return response.json();
    },

    getTransactions: async (page = 1, limit = 20, filters?: { machineId?: string; status?: string; search?: string }): Promise<{ data: Transaction[], pagination: any }> => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        if (filters?.machineId) params.append('machineId', filters.machineId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);

        const response = await fetch(`${config.apiUrl}/finance/transactions?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    getPartners: async (): Promise<any[]> => {
        const response = await fetch(`${config.apiUrl}/finance/partners`);
        if (!response.ok) throw new Error('Failed to fetch partners');
        return response.json();
    },

    createPayout: async (partnerId: string, amount: number, periodStart: string, periodEnd: string) => {
        const response = await fetch(`${config.apiUrl}/finance/payouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partnerId, amount, periodStart, periodEnd })
        });
        if (!response.ok) throw new Error('Failed to create payout');
        return response.json();
    },

    getExpenses: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await fetch(`${config.apiUrl}/finance/expenses?${params.toString()}`);
        return response.json();
    },

    addExpense: async (data: { amount: number; description: string; category: string; type: string; date: string; machineId?: string }) => {
        const response = await fetch(`${config.apiUrl}/finance/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    updateExpense: async (id: string, data: Partial<{ amount: number; description: string; category: string; type: string; date: string }>) => {
        const response = await fetch(`${config.apiUrl}/finance/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    deleteExpense: async (id: string) => {
        const response = await fetch(`${config.apiUrl}/finance/expenses/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    refundOrder: async (orderId: string) => {
        const response = await fetch(`${config.apiUrl}/finance/refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to refund order');
        }
        return response.json();
    }
};
