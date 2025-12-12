import React, { useEffect, useState } from 'react';
import { FinanceService, FinanceSummary } from '../../services/financeService';
import MachineFinance from './MachineFinance';
import TransactionList from './TransactionList';
import ExpenseList from './ExpenseList';

const FinanceDashboard: React.FC = () => {
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddExpense, setShowAddExpense] = useState(false);

    // Edit State
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        description: '',
        category: 'Maintenance',
        type: 'Variable',
        date: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
    });

    const loadData = async () => {
        setLoading(true);
        try {
            // Should pass custom range only if range is 'custom' and dates are valid
            let start = undefined;
            let end = undefined;
            if (range === 'custom' && customStart && customEnd) {
                start = customStart;
                end = customEnd;
            }

            const sumData = await FinanceService.getSummary(range, start, end);
            setSummary(sumData);

            // Expenses might also need date filtering if the backend supports it (it does now)
            const expData = await FinanceService.getExpenses(start, end);
            setExpenses(expData);
        } catch (error) {
            console.error('Error loading finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (range === 'custom' && (!customStart || !customEnd)) return; // Don't load if custom dates are missing
        loadData();
    }, [range, customStart, customEnd]);

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingExpenseId) {
                // Update
                await FinanceService.updateExpense(editingExpenseId, {
                    amount: Number(newExpense.amount),
                    description: newExpense.description,
                    category: newExpense.category,
                    type: newExpense.type,
                    date: new Date(newExpense.date).toISOString()
                });
            } else {
                // Create
                await FinanceService.addExpense({
                    amount: Number(newExpense.amount),
                    description: newExpense.description,
                    category: newExpense.category,
                    type: newExpense.type,
                    date: new Date(newExpense.date).toISOString()
                });
            }
            setShowAddExpense(false);
            setEditingExpenseId(null);
            setNewExpense({ amount: '', description: '', category: 'Maintenance', type: 'Variable', date: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (error) {
            alert('Failed to save expense');
        }
    };

    const openAddModal = () => {
        setEditingExpenseId(null);
        setNewExpense({ amount: '', description: '', category: 'Maintenance', type: 'Variable', date: new Date().toISOString().split('T')[0] });
        setShowAddExpense(true);
    };

    const openEditModal = (expense: any) => {
        setEditingExpenseId(expense.id);
        setNewExpense({
            amount: expense.amount,
            description: expense.description,
            category: expense.category,
            type: expense.type || 'Variable',
            date: new Date(expense.date).toISOString().split('T')[0]
        });
        setShowAddExpense(true);
    };

    const totalRevenue = summary?.totalRevenue || 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0); // Simplified: assumes all fetched expenses match range
    const netProfit = totalRevenue - totalExpenses;

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-orbitron text-white mb-2">Finance Overview</h2>
                    <p className="text-gray-400 text-sm">Track revenue, expenses, and net profit.</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                        <button
                            onClick={openAddModal}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            + Add Expense
                        </button>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            {(['today', 'week', 'month', 'custom'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${range === r
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {range === 'custom' && (
                        <div className="flex gap-2 items-center bg-zinc-900 border border-white/10 p-2 rounded-lg">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Revenue */}
                <div className="bg-gradient-to-br from-green-500/20 to-green-900/10 border border-green-500/30 rounded-xl p-6 relative overflow-hidden group hover:border-green-400/50 transition-colors">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Revenue</h3>
                    <div className="text-3xl font-mono font-bold text-green-400 truncate" title={`₹${totalRevenue.toLocaleString()}`}>
                        {loading ? '...' : `₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                </div>

                {/* Expenses */}
                <div className="bg-gradient-to-br from-red-500/20 to-red-900/10 border border-red-500/30 rounded-xl p-6 relative overflow-hidden group hover:border-red-400/50 transition-colors">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Expenses</h3>
                    <div className="text-3xl font-mono font-bold text-red-400 truncate" title={`₹${totalExpenses.toLocaleString()}`}>
                        {loading ? '...' : `₹${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                </div>

                {/* Net Profit */}
                <div className={`backdrop-blur-md border rounded-xl p-6 ${netProfit >= 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Net Profit</h3>
                    <div className={`text-3xl font-mono font-bold truncate ${netProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`} title={`₹${netProfit.toLocaleString()}`}>
                        {loading ? '...' : `₹${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                </div>

                {/* Volume */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Orders</h3>
                    <div className="text-3xl font-mono font-bold text-white">
                        {loading ? '...' : summary?.totalOrders || '0'}
                    </div>
                </div>
            </div>

            {/* Expense List */}
            <ExpenseList expenses={expenses} onRefresh={loadData} onEdit={openEditModal} />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <MachineFinance />
                </div>
                <div className="lg:col-span-2">
                    <TransactionList />
                </div>
            </div>

            {/* Add/Edit Expense Modal */}
            {showAddExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl p-6 relative">
                        <button onClick={() => setShowAddExpense(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                        <h3 className="text-xl font-orbitron text-white mb-6">{editingExpenseId ? 'Edit Expense' : 'Record Expense'}</h3>
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        value={newExpense.type}
                                        onChange={e => setNewExpense({ ...newExpense, type: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Variable" className="bg-zinc-900 text-white">Variable</option>
                                        <option value="Fixed" className="bg-zinc-900 text-white">Fixed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Restocking Soda"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Maintenance" className="bg-zinc-900 text-white">Maintenance</option>
                                    <option value="Restocking" className="bg-zinc-900 text-white">Restocking</option>
                                    <option value="Rent" className="bg-zinc-900 text-white">Rent</option>
                                    <option value="Utilities" className="bg-zinc-900 text-white">Utilities</option>
                                    <option value="Other" className="bg-zinc-900 text-white">Other</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded transition-colors">
                                {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceDashboard;
