import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParseService } from '../services/parseService';
import LoadingSpinner from './LoadingSpinner';

// Sub-components
import DashboardHome from './admin/DashboardHome';
import OrdersView from './admin/OrdersView';
import InventoryView from './admin/InventoryView';
import MachinesView from './admin/MachinesView';
import UsersView from './admin/UsersView';

import {
    LayoutDashboardIcon,
    ShoppingBagIcon,
    PackageIcon,
    SettingsIcon,
    LogOutIcon,
    MenuIcon,
    BellIcon,
    UserIcon,
    ServerIcon
} from './Icons';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState('DASHBOARD');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Redirect if not admin
    useEffect(() => {
        if (user && user.get('role') !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to logout", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD': return <DashboardHome />;
            case 'ORDERS': return <OrdersView />;
            case 'INVENTORY': return <InventoryView />;
            case 'MACHINES': return <MachinesView />;
            case 'USERS': return <UsersView />;
            case 'SETTINGS': return <div className="text-white">Settings View (Coming Soon)</div>;
            default: return <DashboardHome />;
        }
    };

    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboardIcon },
        { id: 'ORDERS', label: 'Orders', icon: ShoppingBagIcon },
        { id: 'INVENTORY', label: 'Inventory', icon: PackageIcon },
        { id: 'MACHINES', label: 'Machines', icon: ServerIcon }, // Added Machines
        { id: 'USERS', label: 'Users', icon: UserIcon },
        { id: 'SETTINGS', label: 'Settings', icon: SettingsIcon },
    ];

    if (!user) return null; // Or loading spinner

    return (
        <div className="min-h-screen bg-black flex font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-[#050505] border-r border-white/10 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-gray font-orbitron tracking-wider">
                        VEND<span className="text-brand-pink">OS</span>
                    </span>
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-brand-gray bg-white/5 px-2 py-0.5 rounded border border-white/5">Admin</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setCurrentView(item.id);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
                                ? 'bg-brand-pink text-white shadow-[0_0_20px_rgba(255,42,109,0.3)]'
                                : 'text-brand-gray hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'animate-pulse-slow' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                            {currentView === item.id && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-pink to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                            {user.get('username')?.substring(0, 1).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.get('username')}</p>
                            <p className="text-[10px] text-brand-gray truncate">{user.get('email')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-brand-gray hover:text-red-500 rounded-lg transition-colors border border-white/5 hover:border-red-500/20 group"
                    >
                        {isLoggingOut ? <LoadingSpinner size="sm" /> : <LogOutIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
                        <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-8 z-40 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 text-brand-gray hover:text-white"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-bold text-white font-orbitron tracking-wide hidden md:block">
                            {navItems.find(i => i.id === currentView)?.label}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-brand-gray hover:text-white transition-colors group">
                            <BellIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full border-2 border-[#050505]"></span>
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                        <span className="text-xs text-brand-gray bg-white/5 px-3 py-1 rounded-full border border-white/5 hidden md:block">
                            v2.1.0-beta
                        </span>
                    </div>
                </header>

                {/* Scrollable View Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                    {/* Background Ambient Glow */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-brand-pink/5 blur-[100px] pointer-events-none -z-10"></div>
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-enter-up">
                            {renderView()}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default AdminDashboard;