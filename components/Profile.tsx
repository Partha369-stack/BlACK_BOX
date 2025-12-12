import React, { useState, useEffect, useRef } from 'react';
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
    const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadOrders();
    }, [user]);

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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                await ParseService.updateUserProfile({ profilePicture: base64String });
                window.location.reload();
            } catch (error) {
                console.error("Error uploading image", error);
                alert("Image upload failed. Try a smaller image.");
            }
        };
        reader.readAsDataURL(file);
    };

    if (!user) {
        return null;
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Info Section */}
            <div className="bg-black pt-6">
                <div className="max-w-2xl mx-auto px-4 space-y-4 pb-6">
                    {/* User Profile Card */}
                    <div className="bg-black rounded-3xl p-6 border border-white/10 hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        {/* Profile Picture */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                {user.get('profilePicture') ? (
                                    <img
                                        src={user.get('profilePicture')}
                                        alt="Profile"
                                        className="w-24 h-24 aspect-square rounded-full object-cover object-top border-2 border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-24 h-24 aspect-square rounded-full bg-black border-2 border-white/10 flex items-center justify-center group-hover:border-white/30 transition-all duration-300 group-hover:scale-105">
                                        <span className="text-3xl font-light text-white">
                                            {user.get('username')?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                                >
                                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* User Name */}
                        <h2 className="text-2xl font-light text-center mb-6 text-white">
                            {user.get('name') || user.get('username')}
                        </h2>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <div className="bg-black rounded-xl p-4 border border-white/10 hover:border-white/40 transition-all duration-300 hover:bg-white/5 cursor-default">
                                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm text-white font-light">{user.get('email')}</p>
                            </div>
                            <div className="bg-black rounded-xl p-4 border border-white/10">
                                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Phone</p>
                                <p className="text-sm text-white font-light">{user.get('phone') || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-black rounded-2xl py-4 border border-white/10 text-white font-light tracking-wider hover:bg-white/5 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Scrollable Orders Section */}
            <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-white/60">Loading orders...</p>
                    </div>
                ) : orders.length > 0 ? (
                    orders.map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const date = order.createdAt ? new Date(order.createdAt) : null;
                        return (
                            <div
                                key={order.id}
                                className="bg-black rounded-2xl border border-white/10 hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:scale-[1.01]"
                            >
                                <div
                                    onClick={() => toggleOrder(order.id!)}
                                    className="p-4 cursor-pointer active:scale-[0.99] transition-transform duration-150"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-white font-mono text-sm mb-1">
                                                {order.transactionId || `#${order.id?.slice(-6).toUpperCase()}`}
                                            </p>
                                            <p className="text-xs text-white/60">
                                                {date?.toLocaleDateString()} · {date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {order.items.length} items
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-light text-white mb-1">₹{order.total.toFixed(2)}</p>
                                            <span className={`text-[10px] uppercase px-2 py-1 rounded-full ${order.status === 'completed'
                                                ? 'bg-white/10 text-white border border-white/20'
                                                : 'bg-black text-white/60 border border-white/10'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-white/10 p-4 animate-fade-in">
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-black rounded-xl p-3 border border-white/10 hover:border-white/40 transition-all duration-300 hover:bg-white/5 cursor-default">
                                                    <div>
                                                        <p className="text-white text-sm font-light">{item.name}</p>
                                                        <p className="text-xs text-white/60 mt-0.5">
                                                            ₹{item.priceAtPurchase} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-white font-light">
                                                        ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-black rounded-3xl p-12 border border-white/10 text-center hover:border-white/40 transition-all duration-300">
                        <div className="w-16 h-16 rounded-full bg-black border border-white/10 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <p className="text-white font-light mb-1">No orders yet</p>
                        <p className="text-sm text-white/60 mb-6">Start your journey with Black Box</p>
                        <Link
                            to="/"
                            className="inline-block bg-white/5 px-8 py-3 rounded-full text-white text-sm font-light tracking-wider hover:bg-white/10 border border-white/10 hover:border-white/40 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
