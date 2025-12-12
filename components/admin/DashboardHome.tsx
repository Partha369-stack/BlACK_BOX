import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ParseService } from '../../services/parseService';
import LoadingSpinner from '../LoadingSpinner';
import {
    CartIcon,
    TrendingUpIcon,
    BoxIcon,
    AlertTriangleIcon,
    ServerIcon
} from '../Icons';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

interface DashboardProps {
    onNavigate?: (view: string) => void;
}

const DashboardHome: React.FC<DashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Chart State
    const [chartRange, setChartRange] = useState<'today' | 'week' | 'month'>('today');
    const [chartData, setChartData] = useState<any[]>([]);
    const [activeDataPoint, setActiveDataPoint] = useState<number | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    // Initial Data Load
    useEffect(() => {
        loadData();
        // Poll every 10 seconds for "What's happening right now"
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Load Chart Data when range changes
    useEffect(() => {
        const loadChart = async () => {
            const data = await ParseService.getSalesChartData(chartRange);
            setChartData(data);
        };
        loadChart();
    }, [chartRange]);

    const loadData = async () => {
        try {
            const data = await ParseService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const maxY = useMemo(() => {
        if (!chartData.length) return 100;
        const max = Math.max(...chartData.map(d => d.value));
        return max === 0 ? 100 : max * 1.2; // Add 20% buffer
    }, [chartData]);

    const getCoordinates = (index: number, value: number) => {
        if (!chartData.length) return { x: 0, y: 100 };
        const x = (index / (chartData.length - 1)) * 100;
        const y = 100 - (value / maxY) * 100;
        return { x, y };
    };

    const pathData = useMemo(() => {
        if (chartData.length < 2) return '';
        return chartData.map((d, i) => {
            const { x, y } = getCoordinates(i, d.value);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [chartData, maxY]);

    const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chartRef.current || chartData.length === 0) return;
        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const rawIndex = (x / width) * (chartData.length - 1);
        const index = Math.round(rawIndex);
        if (index >= 0 && index < chartData.length) {
            setActiveDataPoint(index);
        }
    };

    if (loading && !stats) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-white animate-pulse font-mono tracking-widest uppercase text-xs">Initializing System...</p>
            </div>
        );
    }

    const machineOnlineCount = stats?.machines?.filter((m: any) => m.connected).length || 0;
    const totalMachines = stats?.machines?.length || 0;

    // Status text only (no colors for strict B&W)
    const systemStatusText = machineOnlineCount === totalMachines && totalMachines > 0
        ? 'OPTIMAL'
        : machineOnlineCount > 0
            ? 'DEGRADED'
            : 'OFFLINE';

    const activePointCoords = activeDataPoint !== null && chartData[activeDataPoint]
        ? getCoordinates(activeDataPoint, chartData[activeDataPoint].value)
        : null;

    return (
        <div className="space-y-8 animate-fade-in pb-10 font-sans text-white">
            {/* Header / Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-orbitron tracking-widest mb-1 text-white uppercase">
                        Black Box<span className="text-[10px] align-top relative top-1 opacity-50">TM</span>
                    </h1>
                    <p className="text-white/60 text-xs font-mono uppercase tracking-widest">
                        System Overview • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white text-black border border-white rounded-none text-xs font-bold flex items-center gap-2 font-mono uppercase">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>
                        LIVE
                    </span>
                </div>
            </div>

            {/* KPI Cards (Strict B&W) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-black border border-white/20 p-6 relative overflow-hidden group hover:border-white transition-all duration-300">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-white font-orbitron">
                                    {formatCurrency(stats?.revenue || 0)}
                                </h3>
                            </div>
                            <div className="p-2 border border-white/20 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                                <TrendingUpIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-white font-bold border-b border-white pb-0.5">
                                +12%
                            </span>
                            <span className="text-white/40 uppercase">vs yesterday</span>
                        </div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="bg-black border border-white/20 p-6 relative overflow-hidden group hover:border-white transition-all duration-300">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Today's Orders</p>
                                <h3 className="text-2xl font-bold text-white font-orbitron">
                                    {stats?.orders || 0}
                                </h3>
                            </div>
                            <div className="p-2 border border-white/20 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                                <CartIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-white/40 uppercase">Avg. Val:</span>
                            <span className="text-white font-bold">{formatCurrency(stats?.avgOrder || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Machines Card */}
                <div className="bg-black border border-white/20 p-6 relative overflow-hidden group hover:border-white transition-all duration-300">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Active Machines</p>
                                <h3 className="text-2xl font-bold text-white font-orbitron flex items-center gap-3">
                                    {machineOnlineCount}/{totalMachines}
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 border border-white/20 uppercase tracking-wider text-white">
                                        {systemStatusText}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-2 border border-white/20 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                                <ServerIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full bg-white/10 h-1 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-1000"
                                style={{ width: `${totalMachines > 0 ? (machineOnlineCount / totalMachines) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Inventory Card */}
                <div className="bg-black border border-white/20 p-6 relative overflow-hidden group hover:border-white transition-all duration-300">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Low Stock</p>
                                <h3 className="text-2xl font-bold text-white font-orbitron">
                                    {stats?.lowStockCount || 0}
                                </h3>
                            </div>
                            <div className="p-2 border border-white/20 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                                <AlertTriangleIcon className="w-5 h-5" />
                            </div>
                        </div>
                        {stats?.lowStockCount > 0 ? (
                            <p className="text-white text-[10px] font-bold font-mono uppercase tracking-wider border-b border-white inline-block pb-0.5">
                                Restock Needed
                            </p>
                        ) : (
                            <p className="text-white/40 text-[10px] font-bold font-mono uppercase tracking-wider">
                                Inventory OK
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Split View: Chart & Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart Section */}
                <div className="lg:col-span-2 bg-black border border-white/20 p-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white font-orbitron uppercase tracking-wider">
                            Sales Activity
                        </h3>
                        <div className="flex border border-white/20">
                            {['Today', 'Week', 'Month'].map(t => {
                                const val = t.toLowerCase();
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setChartRange(val as any)}
                                        className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${chartRange === val ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Responsive SVG Chart */}
                    <div
                        className="relative flex-1 w-full cursor-crosshair group"
                        ref={chartRef}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={() => setActiveDataPoint(null)}
                    >
                        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            {/* Grid Lines */}
                            {[0, 25, 50, 75, 100].map(y => (
                                <line
                                    key={y}
                                    x1="0"
                                    y1={y}
                                    x2="100"
                                    y2={y}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}

                            {/* Area Fill */}
                            <path
                                d={`${pathData} L 100 100 L 0 100 Z`}
                                fill="rgba(255,255,255,0.05)"
                                className="transition-all duration-300"
                                vectorEffect="non-scaling-stroke"
                            />

                            {/* Line */}
                            <path
                                d={pathData}
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-300"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Active Point */}
                            {activeDataPoint !== null && activePointCoords && (
                                <g>
                                    <line
                                        x1={activePointCoords.x}
                                        y1="0"
                                        x2={activePointCoords.x}
                                        y2="100"
                                        stroke="rgba(255,255,255,0.5)"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <circle
                                        cx={activePointCoords.x}
                                        cy={activePointCoords.y}
                                        r="4"
                                        fill="black"
                                        stroke="white"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </g>
                            )}
                        </svg>

                        {/* Tooltip */}
                        {activeDataPoint !== null && activePointCoords && chartData[activeDataPoint] && (
                            <div
                                className="absolute bg-black border border-white p-3 shadow-2xl z-20 pointer-events-none transform -translate-x-1/2 -translate-y-[130%]"
                                style={{ left: `${activePointCoords.x}%`, top: `${activePointCoords.y}%` }}
                            >
                                <p className="text-[10px] text-white/60 mb-1 font-mono uppercase">{chartData[activeDataPoint].label}</p>
                                <p className="text-lg font-bold text-white font-orbitron">
                                    {chartData[activeDataPoint].value} Sales
                                </p>
                            </div>
                        )}

                        {chartData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/40 font-mono text-xs uppercase">No Data Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Feed Section */}
                <div className="bg-black border border-white/20 p-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white font-orbitron uppercase tracking-wider">Live Feed</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">Real-time</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {stats?.recentTransactions?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-50">
                                <BoxIcon className="w-8 h-8 text-white mb-2" />
                                <p className="text-white/60 text-xs font-mono uppercase">No recent activity</p>
                            </div>
                        ) : (
                            stats?.recentTransactions?.map((tx: any, i: number) => (
                                <div key={i} className="border border-white/10 p-4 hover:border-white transition-all cursor-pointer group bg-black">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white text-black flex items-center justify-center text-xs font-bold font-mono">
                                                {tx.customer?.name?.[0] || 'G'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:underline decoration-white/50 underline-offset-4">
                                                    {tx.customer?.name || 'Guest'}
                                                </p>
                                                <p className="text-[10px] text-white/50 font-mono">
                                                    {new Date(tx.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white font-orbitron">{formatCurrency(tx.amount)}</p>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider border-l border-white/20 pl-2 ml-1">
                                        {tx.items?.map((item: any) => item.name).join(', ') || 'Item'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => onNavigate && onNavigate('ORDERS')}
                        className="w-full mt-4 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-[0.99]"
                    >
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
