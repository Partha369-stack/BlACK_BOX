import React, { useEffect, useState } from 'react';
import { FinanceService } from '../../services/financeService';

interface PartnerStat {
    id: string;
    name: string;
    email: string;
    machineCount: number;
    totalRevenue: number;
    pendingPayout: number;
}

const PartnerFinance: React.FC = () => {
    const [partners, setPartners] = useState<PartnerStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const data = await FinanceService.getPartners();
                setPartners(data);
            } catch (error) {
                console.error('Error loading partners:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPartners();
    }, []);

    const handlePayout = async (partnerId: string) => {
        // Implement payout logic (modal etc)
        alert(`Initiate payout for partner ${partnerId}`);
    };

    if (loading) return <div className="text-gray-400">Loading partners...</div>;

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-orbitron text-white">Partner Revenue</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                            <th className="p-4 font-medium">Partner</th>
                            <th className="p-4 font-medium text-right">Machines</th>
                            <th className="p-4 font-medium text-right">Revenue</th>
                            <th className="p-4 font-medium text-right">Pending Payout</th>
                            <th className="p-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {partners.map(p => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-white">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.email}</div>
                                </td>
                                <td className="p-4 text-right text-gray-300">{p.machineCount}</td>
                                <td className="p-4 text-right text-green-400 font-mono">₹{p.totalRevenue.toLocaleString()}</td>
                                <td className="p-4 text-right text-yellow-500 font-mono">₹{p.pendingPayout.toLocaleString()}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handlePayout(p.id)}
                                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                    >
                                        Payout
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {partners.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No partners found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartnerFinance;
