import React, { useState } from 'react';
import { LayoutGridIcon, ServerIcon, UserIcon, ShoppingBagIcon } from '../Shared/Icons';
import FinanceDashboard from './FinanceDashboard';
import MachineFinance from './MachineFinance';
import PartnerFinance from './PartnerFinance';
import TransactionList from './TransactionList';

const FinanceLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MACHINES' | 'PARTNERS' | 'TRANSACTIONS'>('OVERVIEW');

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'bg-brand-pink text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <LayoutGridIcon className="w-4 h-4" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('MACHINES')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'MACHINES' ? 'bg-brand-pink text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <ServerIcon className="w-4 h-4" />
                    Machines
                </button>
                <button
                    onClick={() => setActiveTab('PARTNERS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'PARTNERS' ? 'bg-brand-pink text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <UserIcon className="w-4 h-4" />
                    Partners
                </button>
                <button
                    onClick={() => setActiveTab('TRANSACTIONS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'TRANSACTIONS' ? 'bg-brand-pink text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <ShoppingBagIcon className="w-4 h-4" />
                    Transactions
                </button>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'OVERVIEW' && <FinanceDashboard />}
                {activeTab === 'MACHINES' && <MachineFinance />}
                {activeTab === 'PARTNERS' && <PartnerFinance />}
                {activeTab === 'TRANSACTIONS' && <TransactionList />}
            </div>
        </div>
    );
};

export default FinanceLayout;
