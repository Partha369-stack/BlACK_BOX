import React, { useState } from 'react';
import { FinanceService } from '../../services/financeService';

interface Expense {
    id: string;
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
}

interface ExpenseListProps {
    expenses: Expense[];
    onRefresh: () => void;
    onEdit: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onRefresh, onEdit }) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        setLoadingId(id);
        try {
            await FinanceService.deleteExpense(id);
            onRefresh();
        } catch (error) {
            alert('Failed to delete expense');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-orbitron text-white">Expense History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Description</th>
                            <th className="p-4 font-medium">Category</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium text-right">Amount</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-gray-300">
                                    {new Date(expense.date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-white font-medium">{expense.description}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${expense.type === 'Fixed'
                                            ? 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                                            : 'bg-purple-900/30 text-purple-400 border-purple-500/30'
                                        }`}>
                                        {expense.type}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-red-400 font-mono font-bold">
                                    -₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-1 hover:text-blue-400 text-gray-400 transition-colors"
                                            title="Edit"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            disabled={loadingId === expense.id}
                                            className="p-1 hover:text-red-400 text-gray-400 transition-colors"
                                            title="Delete"
                                        >
                                            {loadingId === expense.id ? '...' : '🗑'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No expenses recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default ExpenseList;
