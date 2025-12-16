import React, { useState, useEffect } from 'react';
import { ParseService } from '../../services/parseService';
import LoadingSpinner from '../Shared/LoadingSpinner';
import {
    SearchIcon,
    DownloadIcon,
    FilterIcon,
    ChevronDownIcon,
    CalendarIcon,
    RefreshIcon,
    MoreHorizontalIcon
} from '../Shared/Icons';

const OrdersView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [machineFilter, setMachineFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('7 Days');

    useEffect(() => {
        fetchOrders();
        // Set up real-time refresh every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await ParseService.getOrders();
            // Transform data for display
            const formattedOrders = data.map(order => ({
                id: order.transactionId || order.id || 'Unknown',
                parseId: order.id, // Keep the real objectId for updates
                machine: order.machine || 'Unknown',
                date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
                customer: order.userEmail || order.userName || 'Guest',
                items: order.items.length,
                total: order.total,
                status: order.status
            }));
            setOrders(formattedOrders);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await ParseService.updateOrderStatus(orderId, newStatus as any);
            // Optimistic update
            setOrders(prev => prev.map(o =>
                o.parseId === orderId ? { ...o, status: newStatus } : o
            ));
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.id && order.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.customer && order.customer.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter.toLowerCase();
        const matchesMachine = machineFilter === 'All' || order.machine === machineFilter;
        return matchesSearch && matchesStatus && matchesMachine;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-white/10 text-white border-white/20';
            case 'cancelled': return 'bg-white/5 text-brand-gray border-white/10';
            case 'processing': return 'bg-white/10 text-white border-white/20';
            case 'refunded': return 'bg-white/5 text-brand-gray border-white/10';
            default: return 'bg-white/10 text-white';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2 bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl w-full md:w-96 focus-within:border-white/50 transition-colors shadow-sm">
                    <SearchIcon className="w-5 h-5 text-brand-gray" />
                    <input
                        type="text"
                        placeholder="Search orders, customers..."
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-brand-gray/50 font-sans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] text-sm font-bold">
                        <DownloadIcon className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Machine Filter */}
                <div className="relative group">
                    <select
                        className="w-full appearance-none bg-[#050505] border border-white/10 text-white text-sm rounded-xl px-4 py-3 pr-10 hover:border-white/30 focus:border-white transition-colors outline-none cursor-pointer"
                        value={machineFilter}
                        onChange={(e) => setMachineFilter(e.target.value)}
                    >
                        <option value="All">All Machines</option>
                        <option value="VM-001">VM-001 (Lobby)</option>
                        <option value="VM-002">VM-002 (2nd Floor)</option>
                        <option value="VM-003">VM-003 (Gym)</option>
                    </select>
                    <FilterIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative group">
                    <select
                        className="w-full appearance-none bg-[#050505] border border-white/10 text-white text-sm rounded-xl px-4 py-3 pr-10 hover:border-white/30 focus:border-white transition-colors outline-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="Processing">Processing</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Refunded">Refunded</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                </div>

                {/* Date Filter */}
                <div className="relative group">
                    <select
                        className="w-full appearance-none bg-[#050505] border border-white/10 text-white text-sm rounded-xl px-4 py-3 pr-10 hover:border-white/30 focus:border-white transition-colors outline-none cursor-pointer"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="Today">Today</option>
                        <option value="7 Days">Last 7 Days</option>
                        <option value="30 Days">Last 30 Days</option>
                        <option value="All Time">All Time</option>
                    </select>
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                </div>

                {/* Refresh/Clear */}
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                        setMachineFilter('All');
                        fetchOrders();
                    }}
                    className="flex items-center justify-center gap-2 bg-[#050505] border border-white/10 text-brand-gray hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                    {isLoading ? <LoadingSpinner size="sm" /> : <RefreshIcon className="w-4 h-4" />}
                    <span className="text-sm">Refresh</span>
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs text-brand-gray font-medium uppercase tracking-wider border-b border-white/10">
                                <th className="px-6 py-4 font-orbitron">Order ID</th>
                                <th className="px-6 py-4 font-orbitron">Machine</th>
                                <th className="px-6 py-4 font-orbitron">Date</th>
                                <th className="px-6 py-4 font-orbitron">Customer</th>
                                <th className="px-6 py-4 font-orbitron">Total</th>
                                <th className="px-6 py-4 font-orbitron">Status</th>
                                <th className="px-6 py-4 font-orbitron text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <LoadingSpinner size="lg" />
                                            <p className="mt-4 text-brand-gray text-sm animate-pulse">Loading orders...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                                <span className="text-sm text-brand-gray/80">{order.machine}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-brand-gray">{order.date}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                                                    {order.customer.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-white">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-white">₹{order.total.toFixed(2)}</span>
                                            <span className="text-xs text-brand-gray ml-1">({order.items} items)</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group/status">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusUpdate(order.parseId, e.target.value)}
                                                    className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer bg-transparent outline-none ${getStatusStyle(order.status)}`}
                                                >
                                                    <option value="completed" className="bg-[#121212] text-white">Completed</option>
                                                    <option value="processing" className="bg-[#121212] text-white">Processing</option>
                                                    <option value="cancelled" className="bg-[#121212] text-brand-gray">Cancelled</option>
                                                    <option value="refunded" className="bg-[#121212] text-brand-gray">Refunded</option>
                                                </select>
                                                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-brand-gray hover:text-white rounded-lg hover:bg-white/10 transition-colors" title="View Details">
                                                <MoreHorizontalIcon className="w-5 h-5" />
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <SearchIcon className="w-12 h-12 mb-3 text-brand-gray" />
                                            <p className="text-white text-lg font-medium">No orders found</p>
                                            <p className="text-brand-gray text-sm">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Visual Only) */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-brand-gray">Showing <span className="text-white font-bold">{filteredOrders.length}</span> results</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs text-brand-gray hover:text-white border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 text-xs text-white border border-white/10 rounded-lg hover:bg-white/5 bg-white/5">1</button>
                        <button className="px-3 py-1 text-xs text-brand-gray hover:text-white border border-white/10 rounded-lg hover:bg-white/5">2</button>
                        <button className="px-3 py-1 text-xs text-brand-gray hover:text-white border border-white/10 rounded-lg hover:bg-white/5">Next</button>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default OrdersView;
