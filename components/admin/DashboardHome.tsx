import React, { useState, useRef, useMemo } from 'react';
import {
    CartIcon,
    TrendingUpIcon,
    BoxIcon,
    AlertTriangleIcon
} from '../Icons';

const DashboardHome: React.FC = () => {
    // Chart State
    const [activeDataPoint, setActiveDataPoint] = useState<number | null>(4);
    const chartRef = useRef<HTMLDivElement>(null);

    const salesData = useMemo(() => [
        { day: 'Sun', sales: 0, date: '7/1' },
        { day: 'Mon', sales: 0, date: '7/2' },
        { day: 'Tue', sales: 0, date: '7/3' },
        { day: 'Wed', sales: 0, date: '7/4' },
        { day: 'Thu', sales: 0, date: '7/5' },
        { day: 'Fri', sales: 0.5, date: '7/6' },
        { day: 'Sat', sales: 2.2, date: '7/7' },
    ], []);

    const maxY = 2.5;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (salesData.length - 1)) * 100;
        const y = 100 - (value / maxY) * 100;
        return { x, y };
    };

    const pathData = useMemo(() => {
        return salesData.map((d, i) => {
            const { x, y } = getCoordinates(i, d.sales);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }, [salesData]);

    const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const rawIndex = (x / width) * (salesData.length - 1);
        const index = Math.round(rawIndex);
        if (index >= 0 && index < salesData.length) {
            setActiveDataPoint(index);
        }
    };

    const activePointCoords = activeDataPoint !== null
        ? getCoordinates(activeDataPoint, salesData[activeDataPoint].sales)
        : null;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-brand-gray text-sm font-medium">Total Orders</span>
                        <div className="p-2 bg-white rounded-xl text-black">
                            <CartIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">16</div>
                    <p className="text-xs text-brand-gray">13 orders today</p>
                </div>
                <div className="bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-brand-gray text-sm font-medium">Total Sales</span>
                        <div className="p-2 bg-white rounded-xl text-black">
                            <TrendingUpIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">₹2</div>
                    <p className="text-xs text-brand-gray">₹2 today</p>
                </div>
                <div className="bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-brand-gray text-sm font-medium">Inventory Items</span>
                        <div className="p-2 bg-white rounded-xl text-black">
                            <BoxIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">6</div>
                    <p className="text-xs text-brand-gray">2 items low stock</p>
                </div>
                <div className="bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-brand-gray text-sm font-medium">Machine Status</span>
                        <div className="p-2 bg-white rounded-xl text-black">
                            <AlertTriangleIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">Online</div>
                    <p className="text-xs text-brand-gray">All systems operational</p>
                </div>
            </div>

            {/* Content Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#050505] border border-white/10 rounded-xl px-4 py-2 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-white">Sales Trend</h3>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button className="px-2 py-0.5 text-xs text-brand-gray hover:text-white rounded">Daily</button>
                            <button className="px-2 py-0.5 text-xs bg-white text-black font-bold rounded shadow-sm">Weekly</button>
                            <button className="px-2 py-0.5 text-xs text-brand-gray hover:text-white rounded">Monthly</button>
                        </div>
                    </div>

                    <div
                        className="relative h-20 w-full cursor-crosshair"
                        ref={chartRef}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={() => setActiveDataPoint(null)}
                    >
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-brand-gray pr-2 w-6 pb-4 pointer-events-none z-10">
                            <span>2.5</span>
                            <span>2.0</span>
                            <span>1.5</span>
                            <span>1.0</span>
                            <span>0.5</span>
                            <span>0</span>
                        </div>
                        <div className="ml-8 h-full relative border-l border-b border-white/10">
                            {[0, 0.2, 0.4, 0.6, 0.8].map(ratio => (
                                <div key={ratio} className="absolute left-0 w-full h-px bg-white/5 pointer-events-none" style={{ bottom: `${ratio * 100}%` }}></div>
                            ))}
                            <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] text-brand-gray pointer-events-none px-[2px]">
                                {salesData.map(d => (
                                    <span key={d.day}>{d.day}</span>
                                ))}
                            </div>
                            <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d={pathData} fill="none" stroke="white" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                                {activePointCoords && (
                                    <circle cx={`${activePointCoords.x}%`} cy={`${activePointCoords.y}%`} r="4" fill="white" className="animate-pulse shadow-[0_0_10px_white] transition-all duration-75 ease-linear" vectorEffect="non-scaling-stroke" />
                                )}
                            </svg>
                            {activeDataPoint !== null && activePointCoords && (
                                <div className="absolute top-0 bg-[#121212] border border-white/20 p-2 rounded-lg shadow-xl pointer-events-none z-20 transition-all duration-75 ease-linear" style={{ left: `${activePointCoords.x}%`, top: `${activePointCoords.y}%`, transform: 'translate(-50%, -120%)' }}>
                                    <p className="text-[10px] text-brand-gray font-bold mb-0.5 whitespace-nowrap">{salesData[activeDataPoint].day} • {salesData[activeDataPoint].date}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-sm"></div>
                                        <span className="text-xs text-brand-gray whitespace-nowrap">Sales (₹)</span>
                                        <span className="text-xs font-bold text-white">{salesData[activeDataPoint].sales}</span>
                                    </div>
                                    <div className="absolute left-1/2 bottom-[-4px] w-2 h-2 bg-[#121212] border-r border-b border-white/20 transform -translate-x-1/2 rotate-45"></div>
                                </div>
                            )}
                            {activePointCoords && (
                                <div className="absolute top-0 bottom-0 w-px bg-white/10 pointer-events-none transition-all duration-75 ease-linear" style={{ left: `${activePointCoords.x}%` }}></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#050505] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-1">Recent Orders</h3>
                    <p className="text-xs text-brand-gray mb-6">Latest transactions from your vending machine</p>
                    <div className="space-y-4">
                        {[
                            { id: 'BB1751656824134', items: 'Chocolate Bar, Pretzels...', price: 360, date: '7/5, 12:50 AM' },
                            { id: 'BB1751656259106', items: 'Energy Drink, Cookies...', price: 95, date: '7/5, 12:40 AM' },
                            { id: 'BB1751656225396', items: 'Energy Drink, Cookies...', price: 95, date: '7/5, 12:40 AM' },
                            { id: 'BB1751656199262', items: 'Chocolate Bar, Energy...', price: 290, date: '7/5, 12:39 AM' },
                        ].map((order, i) => (
                            <div key={i} className="bg-[#121212] rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono font-bold text-white">{order.id}</span>
                                    <span className="text-sm font-bold text-white">₹{order.price}</span>
                                </div>
                                <p className="text-[10px] text-brand-gray mb-2 line-clamp-1">{order.items}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-brand-gray/60">{order.date}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-bold">cancelled</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border border-brand-black bg-[#050505] rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-white">
                <AlertTriangleIcon className="w-5 h-5 text-white" />
                <span className="font-bold text-white">Low Stock Alert</span>
            </div>
        </div>
    );
};

export default DashboardHome;
