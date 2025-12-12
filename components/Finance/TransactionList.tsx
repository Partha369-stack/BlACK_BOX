import React, { useEffect, useState } from 'react';
import { FinanceService, Transaction } from '../../services/financeService';
import { config } from '../../config';

const TransactionList: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchTransactions = async (pageNum: number, search: string) => {
        setLoading(true);
        try {
            const result = await FinanceService.getTransactions(pageNum, 20, { search });
            setTransactions(result.data);
            setTotalPages(result.pagination.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset to page 1 on search change
        fetchTransactions(1, debouncedSearch);
    }, [debouncedSearch]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchTransactions(newPage, debouncedSearch);
        }
    };

    const handleExport = () => {
        // Build query string based on current filters (mocking filters for now or adding state)
        // For simplicity, just export all for now
        window.open(`${config.apiUrl}/finance/export`, '_blank');
    };

    const handleRefund = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to refund this order? This action feels... persistent.')) return;

        try {
            await FinanceService.refundOrder(orderId);
            alert('Order refunded successfully.');

            // Update local state
            setTransactions(prev => prev.map(t =>
                t.orderId === orderId ? { ...t, status: 'refunded' } : t
            ));

            // Update selected transaction if open
            if (selectedTransaction && selectedTransaction.orderId === orderId) {
                setSelectedTransaction({ ...selectedTransaction, status: 'refunded' });
            }
        } catch (error: any) {
            alert(error.message || 'Failed to refund order');
        }
    };

    if (loading && transactions.length === 0) {
        return <div className="p-4 text-center text-gray-400">Loading transactions...</div>;
    }

    return (
        <>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-orbitron text-white">Recent Transactions</h3>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Search ID, Machine..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-brand-gray hover:text-white rounded-lg transition-colors border border-white/5 text-sm whitespace-nowrap"
                        >
                            <span className="font-bold">↓</span> Export CSV
                        </button>
                    </div>
                </div>

                <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                                <th className="p-4 border-b border-white/10 font-medium">Date</th>
                                <th className="p-4 border-b border-white/10 font-medium">Order ID</th>
                                <th className="p-4 border-b border-white/10 font-medium">Machine</th>
                                <th className="p-4 border-b border-white/10 font-medium">Amount</th>
                                <th className="p-4 border-b border-white/10 font-medium">Status</th>
                                <th className="p-4 border-b border-white/10 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="text-gray-300 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        {new Date(tx.created).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-xs text-blue-400">
                                        {tx.orderId.substring(0, 8)}...
                                    </td>
                                    <td className="p-4 text-sm">{tx.machine}</td>
                                    <td className="p-4 text-sm font-medium text-white">
                                        ₹{tx.amount.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'completed'
                                            ? 'bg-green-500/20 text-green-400'
                                            : tx.status === 'processing'
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : tx.status === 'refunded'
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {tx.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedTransaction(tx)}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-white/10">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="px-3 py-1 bg-white/5 rounded text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                        >
                            {loading && page > 1 ? 'Loading...' : 'Previous'}
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="px-3 py-1 bg-white/5 rounded text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                        >
                            {loading && page < totalPages ? 'Loading...' : 'Next'}
                        </button>
                    </div>
                )}
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl p-6 relative">
                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            {/* Customer Profile Image */}
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/10">
                                {selectedTransaction.customer?.image ? (
                                    <img
                                        src={selectedTransaction.customer.image}
                                        alt="Customer"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-gray-400">
                                        {selectedTransaction.customer?.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-orbitron text-white">
                                    {selectedTransaction.customer?.name || 'Guest User'}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {selectedTransaction.customer?.email || 'No email provided'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Transaction ID</p>
                                    <p className="text-white font-mono">{selectedTransaction.transactionId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Order ID</p>
                                    <p className="text-white font-mono">{selectedTransaction.orderId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Date</p>
                                    <p className="text-white">{new Date(selectedTransaction.created).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Machine</p>
                                    <p className="text-white">{selectedTransaction.machine}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className="text-white capitalize">{selectedTransaction.status}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Total Amount</p>
                                    <p className="text-green-400 font-bold text-lg">₹{selectedTransaction.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-white/10 pt-4">
                                <h4 className="text-white font-medium mb-3">Items</h4>
                                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedTransaction.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-sm text-gray-300">
                                                <span>{item.quantity}x {item.name || 'Product'}</span>
                                                <span>₹{((item.priceAtPurchase || item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No items details available</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            {selectedTransaction.status !== 'refunded' && selectedTransaction.status !== 'failed' ? (
                                <button
                                    onClick={() => handleRefund(selectedTransaction.orderId)}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 text-sm font-medium"
                                >
                                    Refund Order
                                </button>
                            ) : (
                                <div></div> // Spacer
                            )}

                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TransactionList;
