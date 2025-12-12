import React, { useEffect, useState } from 'react';
import { FinanceService, MachineFinanceStat } from '../../services/financeService';

const MachineFinance: React.FC = () => {
    const [stats, setStats] = useState<MachineFinanceStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Default to last 30 days or 'month'
                const data = await FinanceService.getMachineStats('month');
                setStats(data);
            } catch (error) {
                console.error('Error fetching machine finance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-gray-400 animate-pulse">Loading machine stats...</div>;

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden mb-6">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-orbitron text-white">Machine Performance</h3>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Last 30 Days</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                            <th className="p-4 font-medium">Machine ID</th>
                            <th className="p-4 font-medium text-right">Revenue</th>
                            <th className="p-4 font-medium text-right">Orders</th>
                            <th className="p-4 font-medium text-right">Avg Order</th>
                            <th className="p-4 font-medium">Last Transaction</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {stats.map((stat) => (
                            <tr key={stat.machineId} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium text-blue-400">{stat.machineId}</td>
                                <td className="p-4 text-right text-green-400 font-mono">
                                    ₹{stat.revenue.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-white font-mono">{stat.orders}</td>
                                <td className="p-4 text-right text-gray-300 font-mono">
                                    ₹{stat.avgOrderValue.toFixed(2)}
                                </td>
                                <td className="p-4 text-sm text-gray-400">
                                    {stat.lastTransaction ? new Date(stat.lastTransaction).toLocaleDateString() : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MachineFinance;
