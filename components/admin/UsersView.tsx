import React, { useState, useEffect, useMemo } from 'react';
import { ParseService, OrderData } from '../../services/parseService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import {
    UserIcon,
    SettingsIcon,
    TrendingUpIcon,
    SearchIcon,
    ChevronDownIcon,
    RefreshIcon,
    FilterIcon,
    MoreVerticalIcon,
    BanIcon,
    EyeIcon
} from '../Icons';

// Extended User Interface for UI
interface Customer {
    id: string;
    username: string;
    email: string;
    name?: string;
    profilePicture?: string;
    role: string;
    createdAt: Date;
    updatedAt: Date; // Keep tracking of this from user object or calculate from activity

    // Computed Stats
    totalSpend: number;
    totalOrders: number;
    lastOrderDate?: Date;
    orders?: OrderData[]; // Store orders for details view
    status: 'Active' | 'Inactive' | 'New'; // Logic based
}

const UsersView: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'All' | 'Customer' | 'Admin'>('All'); // Default to All to ensure visibility
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [viewingOrders, setViewingOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null); // For deep dive into single order

    useEffect(() => {
        if (!selectedCustomer) {
            setViewingOrders(false);
            setSelectedOrder(null);
        }
    }, [selectedCustomer]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        console.log("Fetching users and orders...");
        try {
            // Fetch Users First - Independent of Orders
            let usersData: any[] = [];
            try {
                usersData = await ParseService.getAllUsers();
                console.log("Fetched Users:", usersData.length, usersData);
            } catch (err) {
                console.error("Error fetching users:", err);
                // If users fetch fails, we can't show anything really
            }

            // Fetch Orders Separately - Don't block users if this fails
            let ordersData: any[] = [];
            try {
                ordersData = await ParseService.getOrders();
                console.log("Fetched Orders:", ordersData.length);
            } catch (err) {
                console.error("Error fetching orders (possibly restricted):", err);
                // Continue without orders...
            }

            // Process Data
            const customerOrders = ordersData.reduce((acc, order) => {
                if (order.userId || (order as any).user) {
                    const uid = order.userId || (order as any).user.id;
                    acc[uid] = acc[uid] || [];
                    acc[uid].push(order);
                }
                return acc;
            }, {} as Record<string, any[]>);

            const processedCustomers: Customer[] = usersData.map(user => {
                const userOrders = customerOrders[user.id] || [];
                const totalSpend = userOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
                const lastOrder = userOrders.length > 0 ? userOrders[0].createdAt : undefined; // Assumes orders are desc

                // Determine Status
                const daysSinceJoin = (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 3600 * 24);
                let status: Customer['status'] = 'Inactive';
                if (daysSinceJoin < 7) status = 'New';
                else if (lastOrder && (new Date().getTime() - new Date(lastOrder).getTime()) / (1000 * 3600 * 24) < 30) status = 'Active';

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profilePicture: user.profilePicture,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    totalSpend,
                    totalOrders: userOrders.length,
                    lastOrderDate: lastOrder,
                    orders: userOrders, // Attach orders
                    status
                };
            });

            setCustomers(processedCustomers);
        } catch (error) {
            console.error("Failed to fetch customer data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            // Role Filter
            if (filterRole === 'Customer' && customer.role === 'admin') return false;
            if (filterRole === 'Admin' && customer.role !== 'admin') return false;

            // Search Filter
            const lowerQuery = searchQuery.toLowerCase();
            return (
                customer.username?.toLowerCase().includes(lowerQuery) ||
                customer.email?.toLowerCase().includes(lowerQuery)
            );
        });
    }, [customers, searchQuery, filterRole]);

    // Stats for Top Cards
    const stats = useMemo(() => {
        const totalCustomers = customers.filter(c => c.role !== 'admin').length;
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);
        const activeToday = customers.filter(c => c.lastOrderDate && new Date(c.lastOrderDate).toDateString() === new Date().toDateString()).length;
        return { totalCustomers, totalRevenue, activeToday };
    }, [customers]);

    const handleBanUser = (id: string) => {
        alert("Ban functionality coming soon (Requires backend update)");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Customers"
                    value={stats.totalCustomers.toString()}
                    icon={<UserIcon className="w-5 h-5" />}
                />
                <StatCard
                    label="Lifetime Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon={<TrendingUpIcon className="w-5 h-5" />}
                    isCurrency
                />
                <StatCard
                    label="Active Today"
                    value={stats.activeToday.toString()}
                    icon={<SettingsIcon className="w-5 h-5" />}
                />
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-96 group">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand-cyan transition-colors" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-cyan/50 transition-all font-sans"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <select
                                className="appearance-none bg-black/40 border border-white/10 text-zinc-300 text-xs font-medium rounded-xl pl-4 pr-10 py-3 hover:border-white/20 focus:border-brand-cyan/50 transition-colors outline-none cursor-pointer uppercase tracking-wider"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as any)}
                            >
                                <option value="Customer">Customers Only</option>
                                <option value="Admin">Admins Only</option>
                                <option value="All">All Users</option>
                            </select>
                            <FilterIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>

                        <button
                            onClick={fetchData}
                            className="p-3 bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 rounded-xl text-brand-cyan transition-all duration-300 active:scale-95"
                        >
                            <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm relative min-h-[400px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-sm">
                            <LoadingSpinner size="lg" />
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron">Customer</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron">Spent</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron">Orders</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron">Last Active</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-orbitron text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(customer => (
                                        <tr key={customer.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {customer.profilePicture ? (
                                                        <img
                                                            src={customer.profilePicture}
                                                            alt={customer.username}
                                                            className={`w-10 h-10 rounded-xl object-cover shadow-lg ${customer.role === 'admin' ? 'ring-1 ring-purple-500/30' : 'ring-1 ring-white/10'}`}
                                                        />
                                                    ) : (
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${customer.role === 'admin'
                                                            ? 'bg-gradient-to-br from-purple-900 to-indigo-900 text-purple-200 ring-1 ring-purple-500/30'
                                                            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-300 ring-1 ring-white/10'
                                                            }`}>
                                                            {(customer.name || customer.username || customer.email || 'U').substring(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-white text-sm group-hover:text-brand-cyan transition-colors">
                                                            {customer.name || (customer.username && !customer.username.includes(' ') && customer.username.length < 25 ? customer.username : customer.email)}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{customer.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={customer.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-white font-mono">${customer.totalSpend.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                    {customer.totalOrders} orders
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-300">
                                                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                                                    </span>
                                                    {customer.lastOrderDate && (
                                                        <span className="text-[10px] text-zinc-600">
                                                            {new Date(customer.lastOrderDate).toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        className="p-2 hover:bg-brand-cyan/10 text-zinc-400 hover:text-brand-cyan rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleBanUser(customer.id)}
                                                        className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Ban User"
                                                    >
                                                        <BanIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-white/5 rounded-full text-zinc-600">
                                                    <UserIcon className="w-8 h-8" />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No customers found</p>
                                                <p className="text-xs text-zinc-700 max-w-[200px]">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Simple Details Modal Placeholder */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCustomer(null)}>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="flex items-center gap-4">
                            {selectedCustomer.profilePicture ? (
                                <img src={selectedCustomer.profilePicture} className="w-16 h-16 rounded-2xl object-cover ring-1 ring-brand-cyan/30" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-blue-500/20 ring-1 ring-brand-cyan/30 flex items-center justify-center text-2xl font-bold text-brand-cyan">
                                    {(selectedCustomer.name || selectedCustomer.username || 'U').substring(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-white font-orbitron">
                                    {selectedCustomer.name || selectedCustomer.username || 'User'}
                                </h3>
                                <p className="text-sm text-zinc-500">{selectedCustomer.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Spent</span>
                                <div className="text-2xl font-bold text-white mt-1">${selectedCustomer.totalSpend.toFixed(2)}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Orders</span>
                                <div className="text-2xl font-bold text-white mt-1">{selectedCustomer.totalOrders}</div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <h4 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">Customer Data</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Member Since</span>
                                    <span className="text-zinc-300">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Last Active</span>
                                    <span className="text-zinc-300">
                                        {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>

                            </div>
                        </div>

                        {!viewingOrders ? (
                            <>
                                <button
                                    onClick={() => setViewingOrders(true)}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors text-sm"
                                >
                                    View Full Order History
                                </button>
                            </>
                        ) : !selectedOrder ? (
                            <div className="border-t border-white/10 pt-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Order History</h4>
                                    <button onClick={() => setViewingOrders(false)} className="text-xs text-brand-cyan hover:underline">Back to Overview</button>
                                </div>
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                        selectedCustomer.orders.map((order, idx) => (
                                            <button
                                                key={order.id || idx}
                                                onClick={() => setSelectedOrder(order)}
                                                className="w-full text-left bg-white/5 p-4 rounded-xl border border-white/5 hover:border-brand-cyan/20 hover:bg-white/10 transition-all group"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-bold text-white max-w-[200px] truncate">
                                                                {order.machine ? `Machine: ${order.machine}` : 'Vending Machine'}
                                                            </span>
                                                            <StatusBadge status={order.status as any} />
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                                                            <span className="group-hover:text-brand-cyan transition-colors">ID: {order.id ? order.id.substring(0, 8) : '...'}</span>
                                                            <span>•</span>
                                                            <span>{order.createdAt && new Date(order.createdAt).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-brand-cyan font-mono">${order.total?.toFixed(2)}</div>
                                                        <div className="text-xs text-zinc-500 mt-1">{Array.isArray(order.items) ? order.items.length : 0} items</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-zinc-500 text-sm">No orders found</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-white/10 pt-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                        <span onClick={() => setSelectedOrder(null)} className="cursor-pointer hover:text-white transition-colors">HISTORY</span>
                                        <span>/</span>
                                        <span className="text-white">ORDER DETAILS</span>
                                    </h4>
                                    <button onClick={() => setSelectedOrder(null)} className="text-xs text-brand-cyan hover:underline">Back to List</button>
                                </div>

                                <div className="bg-black/20 rounded-xl p-6 border border-white/5 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    {/* Header Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-white/5 pb-6">
                                        <div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Order ID</div>
                                            <div className="text-sm font-mono text-white">{selectedOrder.id}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Machine</div>
                                            <div className="text-sm font-bold text-brand-cyan">{selectedOrder.machine || 'Unknown Machine'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Date & Time</div>
                                            <div className="text-sm text-white">
                                                {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Status</div>
                                            <StatusBadge status={selectedOrder.status as any} />
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-4">Items Purchased</div>
                                        <div className="border border-white/5 rounded-xl overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/5 text-[10px] uppercase text-zinc-500 font-bold">
                                                    <tr>
                                                        <th className="px-4 py-3">Item Name</th>
                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                        <th className="px-4 py-3 text-right">Price</th>
                                                        <th className="px-4 py-3 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, idx) => (
                                                        <tr key={idx} className="bg-black/20 hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-bold text-white">{item.name}</div>
                                                                <div className="text-[10px] text-zinc-500 font-mono">{item.productId}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-zinc-300 font-mono text-sm">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-zinc-400 font-mono text-sm">
                                                                ${item.priceAtPurchase?.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-white font-bold font-mono text-sm">
                                                                ${((item.priceAtPurchase || 0) * item.quantity).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 text-xs italic">
                                                                No items recorded for this order
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Total Footer */}
                                    <div className="flex justify-end pt-4 border-t border-white/10">
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Amount</div>
                                            <div className="text-3xl font-bold text-brand-cyan font-mono">${selectedOrder.total?.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components
const StatCard = ({ label, value, icon, isCurrency = false }: { label: string, value: string, icon: React.ReactNode, isCurrency?: boolean }) => (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-brand-cyan/30 transition-all duration-500">
        <div className="absolute top-0 right-0 p-32 bg-brand-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-cyan/10 transition-all duration-500"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{label}</span>
                <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-brand-cyan group-hover:bg-brand-cyan/10 transition-colors">
                    {icon}
                </div>
            </div>
            <div className={`text-3xl font-bold text-white tracking-tight ${isCurrency ? 'font-mono' : ''}`}>
                {value}
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: Customer['status'] }) => {
    const styles = {
        Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        Inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        New: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
            {status}
        </span>
    );
};

export default UsersView;
