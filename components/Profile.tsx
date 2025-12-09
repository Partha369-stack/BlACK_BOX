import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParseService } from '../services/parseService';
import { OrderData } from '../services/parseService';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            if (user && user.id) {
                const userOrders = await ParseService.getUserOrders(user.id);
                setOrders(userOrders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleOrder = (orderId: string) => {
        setExpandedOrderId(prev => prev === orderId ? null : orderId);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-brand-black px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-pink to-purple-400 bg-clip-text text-transparent">
                        My Profile
                    </h1>
                    <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>

                {/* Profile Info Card */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl mb-6">
                    <div className="flex items-center space-x-6 mb-6">
                        {user.get('profilePicture') ? (
                            <img
                                src={user.get('profilePicture')}
                                alt="Profile"
                                className="w-20 h-20 rounded-full border-2 border-brand-pink"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-pink to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                {user.get('username')?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {user.get('name') || user.get('username')}
                            </h2>
                            <p className="text-gray-400">{user.get('email')}</p>
                            <p className="text-sm text-gray-500">@{user.get('username')}</p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-lg transition-all duration-300"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Order History */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Order History</h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading orders...</div>
                    ) : orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((order) => {
                                const isExpanded = expandedOrderId === order.id;
                                const date = order.createdAt ? new Date(order.createdAt) : null;

                                return (
                                    <div
                                        key={order.id}
                                        className={`bg-white/5 rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${isExpanded ? 'border-brand-pink/50 bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                                        onClick={() => toggleOrder(order.id)}
                                    >
                                        {/* Order Summary Header */}
                                        <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="text-white font-semibold text-lg">
                                                        #{order.transactionId || order.id?.slice(-6).toUpperCase()}
                                                    </p>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${order.status === 'completed'
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                            : order.status === 'processing'
                                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                                : order.status === 'cancelled'
                                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                            }`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                                    <span>📅 {date ? date.toLocaleDateString() : 'N/A'}</span>
                                                    <span>⏰ {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 flex-1 text-right">
                                                <div className='flex flex-col items-end'>
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Total</p>
                                                    <p className="text-brand-pink font-bold text-xl">₹{order.total.toFixed(2)}</p>
                                                </div>
                                                <div className={`transform transition-transform duration-300 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    ▼
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible Details */}
                                        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                            <div className="p-4 bg-black/20">
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-xs text-gray-500 font-mono">ORDER DETAILS</p>
                                                    <p className="text-xs text-gray-500">Machine: <span className='text-brand-cyan'>{order.machine}</span></p>
                                                </div>

                                                <div className="space-y-2">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded hover:bg-white/10 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                {/* Placeholder for item image if available later */}
                                                                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs text-brand-pink/70 font-bold">
                                                                    x{item.quantity}
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-200 text-sm font-medium">
                                                                        {item.name} <span className="text-gray-500 text-xs ml-1">x {item.quantity}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-400 text-sm font-mono">₹{item.priceAtPurchase}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Optional: Add re-order or receipt buttons here later */}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/20">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🛍️</span>
                            </div>
                            <p className="text-white font-bold text-lg mb-1">No orders yet</p>
                            <p className="text-gray-400 mb-6 text-sm">Looks like you haven't made any purchases yet.</p>
                            <Link
                                to="/scanner"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-brand-pink to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
