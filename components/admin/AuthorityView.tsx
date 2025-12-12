import React, { useState } from 'react';
import {
    ShieldIcon,
    UsersIcon,
    BriefcaseIcon,
    LockIcon,
    FileTextIcon,
    ActivityIcon,
    PlusIcon,
    SearchIcon,
    FilterIcon,
    MoreVerticalIcon,
    EyeIcon,
    EditIcon,
    TrashIcon,
    CheckIcon
} from '../Icons';

const AuthorityView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PARTNERS' | 'ROLES' | 'ASSIGNMENTS' | 'LOGS'>('EMPLOYEES');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'EMPLOYEES', label: 'Employees', icon: UsersIcon },
        { id: 'PARTNERS', label: 'Partners', icon: BriefcaseIcon },
        { id: 'ROLES', label: 'Roles & Permissions', icon: LockIcon },
        { id: 'ASSIGNMENTS', label: 'Assignments', icon: FileTextIcon },
        { id: 'LOGS', label: 'Activity Logs', icon: ActivityIcon },
    ];

    // Mock Data for Prototype
    const mockEmployees = [
        { id: 1, name: 'Alex Johnson', role: 'Super Admin', email: 'alex@blackbox.com', status: 'Active', department: 'Executive' },
        { id: 2, name: 'Sarah Connor', role: 'Operations Manager', email: 'sarah@blackbox.com', status: 'Active', department: 'Operations' },
        { id: 3, name: 'Mike Ross', role: 'Technician', email: 'mike@blackbox.com', status: 'On Leave', department: 'Maintenance' },
    ];

    const mockPartners = [
        { id: 1, name: 'SnackCo Ltd', type: 'Supplier', contact: 'John Doe', email: 'orders@snackco.com', status: 'Active' },
        { id: 2, name: 'VendingSolutions', type: 'Maintenance', contact: 'Jane Smith', email: 'support@vendingsolutions.com', status: 'Active' },
    ];

    const mockRoles = [
        { id: 1, name: 'Super Admin', userCount: 2, permissions: ['ALL_ACCESS'] },
        { id: 2, name: 'Manager', userCount: 5, permissions: ['VIEW_DASHBOARD', 'MANAGE_INVENTORY', 'MANAGE_ORDERS'] },
        { id: 3, name: 'Technician', userCount: 12, permissions: ['VIEW_MACHINES', 'UPDATE_STATUS', 'VIEW_LOGS'] },
    ];

    const mockAssignments = [
        { id: 1, assignee: 'Mike Ross', asset: 'Machine #102', location: 'Tech Park Lobby', type: 'Maintenance', status: 'Pending' },
        { id: 2, assignee: 'Sarah Connor', asset: 'Region North', location: 'Bangalore North', type: 'Supervision', status: 'Active' },
    ];

    const mockLogs = [
        { id: 1, user: 'Alex Johnson', action: 'Changed system settings', target: 'Global Config', time: '10 mins ago', type: 'System' },
        { id: 2, user: 'Sarah Connor', action: 'Approved order #1234', target: 'Order #1234', time: '2 hours ago', type: 'Operation' },
        { id: 3, user: 'Mike Ross', action: 'Refilled inventory', target: 'Machine #102', time: 'Yesterday', type: 'Maintenance' },
        { id: 4, user: 'System', action: 'Automated backup completed', target: 'Database', time: 'Yesterday', type: 'System' },
    ];

    const renderEmployeesConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white font-orbitron">Employee Directory</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage internal staff and their access levels.</p>
                </div>
                <button className="flex items-center gap-2 bg-brand-pink hover:bg-brand-pink/80 text-white px-4 py-2 rounded-xl transition-colors text-sm font-bold">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Employee</span>
                </button>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {mockEmployees.map((emp) => (
                            <tr key={emp.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{emp.name}</div>
                                            <div className="text-xs text-zinc-500">{emp.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-300">{emp.role}</td>
                                <td className="px-6 py-4 text-sm text-zinc-300">{emp.department}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors"><EditIcon className="w-4 h-4" /></button>
                                        <button className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPartnersConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white font-orbitron">Partner Management</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage external vendors, suppliers, and service providers.</p>
                </div>
                <button className="flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan/80 text-black px-4 py-2 rounded-xl transition-colors text-sm font-bold">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Partner</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPartners.map(partner => (
                    <div key={partner.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 hover:border-brand-cyan/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 bg-brand-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-cyan/10 transition-all"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-brand-cyan transition-colors">
                                    <BriefcaseIcon className="w-5 h-5" />
                                </div>
                                <span className="bg-white/5 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">{partner.type}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-cyan transition-colors">{partner.name}</h3>
                            <p className="text-zinc-500 text-sm mb-4">{partner.contact}</p>

                            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-black/20 p-2 rounded-lg border border-white/5">
                                <span className="truncate">{partner.email}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRolesConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white font-orbitron">Roles & Permissions</h2>
                    <p className="text-zinc-500 text-sm mt-1">Define access levels and security policies.</p>
                </div>
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors text-sm font-bold">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Role</span>
                </button>
            </div>

            <div className="space-y-4">
                {mockRoles.map(role => (
                    <div key={role.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <LockIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{role.name}</h3>
                                <p className="text-sm text-zinc-500">
                                    {role.userCount} usersassigned
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {role.permissions.map((perm, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5 font-mono">
                                    {perm}
                                </span>
                            ))}
                        </div>

                        <button className="text-sm font-bold text-brand-pink hover:underline">Edit Permissions</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAssignmentsConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white font-orbitron">Assignments</h2>
                    <p className="text-zinc-500 text-sm mt-1">Track asset and regional responsibilities.</p>
                </div>
                <button className="flex items-center gap-2 bg-brand-pink hover:bg-brand-pink/80 text-white px-4 py-2 rounded-xl transition-colors text-sm font-bold">
                    <PlusIcon className="w-4 h-4" />
                    <span>Assign Task</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAssignments.map(assign => (
                    <div key={assign.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <FileTextIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{assign.assignee}</h4>
                                <div className="text-sm text-zinc-400">{assign.asset} <span className="text-zinc-600">•</span> {assign.location}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{assign.type}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${assign.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {assign.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLogsConfig = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white font-orbitron">Activity Logs</h2>
                    <p className="text-zinc-500 text-sm mt-1">Audit trail of system events and user actions.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors"><FilterIcon className="w-4 h-4" /></button>
                    <button className="p-2 bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors"><SearchIcon className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="relative border-l border-white/10 ml-3 space-y-8">
                {mockLogs.map((log, idx) => (
                    <div key={log.id} className="relative pl-6">
                        <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full -translate-x-[5px] ring-4 ring-[#050505] ${log.type === 'System' ? 'bg-blue-500' :
                                log.type === 'Operation' ? 'bg-emerald-500' :
                                    'bg-amber-500'
                            }`}></div>
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{log.user}</span>
                                    <span className="text-zinc-600 text-xs">•</span>
                                    <span className="text-zinc-400 text-sm">{log.action}</span>
                                </div>
                                <span className="text-xs text-zinc-500 font-mono">{log.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-white/5 text-zinc-400 px-2 py-0.5 rounded border border-white/5 font-mono">{log.target}</span>
                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{log.type}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header / Tabs */}
            <div className="flex overflow-x-auto space-x-1 bg-[#0A0A0A] p-2 rounded-2xl border border-white/5 no-scrollbar shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : ''}`} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'EMPLOYEES' && renderEmployeesConfig()}
                {activeTab === 'PARTNERS' && renderPartnersConfig()}
                {activeTab === 'ROLES' && renderRolesConfig()}
                {activeTab === 'ASSIGNMENTS' && renderAssignmentsConfig()}
                {activeTab === 'LOGS' && renderLogsConfig()}
            </div>
        </div>
    );
};

export default AuthorityView;
