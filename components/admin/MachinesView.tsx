import React, { useState, useEffect } from 'react';
import { ParseService } from '../../services/parseService';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocketService';
import LoadingSpinner from '../LoadingSpinner';
import { config } from '../../config';
import { generateESPSketch } from '../../utils/ESPSketchGenerator';
import {
    SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    EditIcon,
    MapPinIcon,
    UserIcon,
    GlobeIcon,
    CodeIcon,
    PlayIcon,
    TempIcon,
    WifiIcon,
    AlertTriangleIcon,
    XIcon,
    ServerIcon,
    ShoppingBagIcon,
    PackageIcon
} from '../Icons';

const SyncIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
    </svg>
);

interface MachineStatistics {
    totalInventory: number;
    totalRevenue: number;
    orderCount: number;
    productCount: number;
}

interface Machine {
    id: string;
    machineId: string;
    location: string;
    name?: string;
    status: 'online' | 'offline' | 'maintenance';
    lastPing?: Date | string;
    temp?: number;
    inventory?: number;
    config?: {
        wifiSsid?: string;
        wifiPass?: string;
        apiEndpoint?: string;
        machineId?: string;
        updateInterval?: string;
    };
    token?: string;
    ip?: string;
    owner?: string;
    statistics?: MachineStatistics;
}

const MachinesView: React.FC = () => {
    const { user } = useAuth();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);
    const [wsStatus, setWsStatus] = useState<string>('Connecting...');

    // Machine logs state
    const [machineLogs, setMachineLogs] = useState<Record<string, any[]>>({});
    const [logFilters, setLogFilters] = useState<Record<string, string>>({});
    const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

    const [machineFilter, setMachineFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
    const [newMachine, setNewMachine] = useState({
        machineId: '',
        location: '',
        owner: '',
        ip: '',
    });
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editConfig, setEditConfig] = useState({
        name: '',
        location: '',
        owner: '',
        ip: '',
    });

    useEffect(() => {
        loadMachines();

        // WebSocket setup
        websocketService.connect();

        const updateStatus = () => {
            const state = websocketService.getConnectionState();
            setWsStatus(state === 'connected' ? 'Connected' : state === 'connecting' ? 'Connecting...' : 'Disconnected');
        };

        // Initial status
        updateStatus();

        const handleConnected = () => {
            updateStatus();
            // WebSocket Connected
        };

        const handleDisconnected = () => {
            updateStatus();
            // WebSocket Disconnected
        };

        const handleMachineUpdate = (data: any) => {
            console.log(`Received update for ${data.machineId}`, data);
            setMachines(prev => prev.map(m => {
                if (m.machineId === data.machineId) {
                    return {
                        ...m,
                        status: 'online',
                        lastPing: new Date(),
                        temp: data.temp || m.temp,
                        inventory: data.inventory || m.inventory
                    };
                }
                return m;
            }));
        };

        const handleMachineLog = (data: any) => {
            console.log(`Received log for ${data.machineId}`, data);
            setMachineLogs(prev => {
                const logs = prev[data.machineId] || [];
                const newLog = {
                    id: `live-${Date.now()}`,
                    machineId: data.machineId,
                    logType: data.logType || 'device_log',
                    message: data.message,
                    severity: data.severity || 'info',
                    timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
                };
                return { ...prev, [data.machineId]: [newLog, ...logs] };
            });
        };

        websocketService.on('connected', handleConnected);
        websocketService.on('disconnected', handleDisconnected);
        websocketService.on('machine_update', handleMachineUpdate);
        websocketService.on('machine_log', handleMachineLog);

        return () => {
            websocketService.off('connected', handleConnected);
            websocketService.off('disconnected', handleDisconnected);
            websocketService.off('machine_update', handleMachineUpdate);
            websocketService.off('machine_log', handleMachineLog);
            websocketService.disconnect();
        };
    }, []);

    const loadMachines = async () => {
        try {
            const data = await ParseService.getMachines();

            // Fetch statistics for each machine
            const machinesWithStats = await Promise.all(
                data.map(async (m: any) => {
                    try {
                        const stats = await ParseService.getMachineStatistics(m.machineId);
                        return {
                            ...m,
                            status: m.status || 'offline',
                            lastPing: m.lastPingTime ? new Date(m.lastPingTime.iso || m.lastPingTime) : undefined,
                            statistics: stats
                        };
                    } catch (error) {
                        console.error(`Failed to load stats for ${m.machineId}`, error);
                        return {
                            ...m,
                            status: m.status || 'offline',
                            lastPing: m.lastPingTime ? new Date(m.lastPingTime.iso || m.lastPingTime) : undefined,
                            statistics: {
                                totalInventory: 0,
                                totalRevenue: 0,
                                orderCount: 0,
                                productCount: 0
                            }
                        };
                    }
                })
            );

            setMachines(machinesWithStats);

            // Load logs for each machine
            machinesWithStats.forEach(m => {
                loadMachineLogs(m.machineId);
            });
        } catch (error) {
            console.error("Failed to load machines", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMachineLogs = async (machineId: string) => {
        try {
            const currentFilter = logFilters[machineId] || 'All';
            const filters: any = { limit: 50 };
            if (currentFilter !== 'All') {
                filters.logType = currentFilter.toLowerCase().replace(' ', '_');
            }

            const logs = await ParseService.getMachineLogs(machineId, filters);
            setMachineLogs(prev => ({ ...prev, [machineId]: logs }));
        } catch (error) {
            console.error(`Failed to load logs for ${machineId}:`, error);
        }
    };

    const toggleLogs = (machineId: string) => {
        setExpandedLogs(prev => ({ ...prev, [machineId]: !prev[machineId] }));
    };

    const handleAddMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ParseService.addMachine({ ...newMachine, status: 'offline' });
            setIsAddMachineModalOpen(false);
            setNewMachine({ machineId: '', location: '', owner: '', ip: '' });
            loadMachines();
        } catch (error) {
            console.error("Failed to add machine", error);
            alert("Failed to add machine");
        }
    };

    const handleGenerateSketch = async (machine: Machine) => {
        if (!machine) return;
        setIsGeneratingSketch(true);
        try {
            const machineDetails = await ParseService.getMachineDetails(machine.id);
            const products = await ParseService.getProducts();

            const sketchConfig = {
                machineId: machine.machineId,
                name: machineDetails.name || machine.machineId,
                wifiSsid: machineDetails.config?.wifiSsid || "WIFI_NAME",
                wifiPassword: machineDetails.config?.wifiPass || "WIFI_PASS",
                ip: machineDetails.ip,
                ...machineDetails.config
            };

            const sketch = generateESPSketch(sketchConfig, products);

            const blob = new Blob([sketch], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vm_sketch_${machine.machineId}.ino`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate sketch", error);
            alert("Failed to generate sketch");
        } finally {
            setIsGeneratingSketch(false);
        }
    };

    const handleEditMachine = (machine: Machine) => {
        setSelectedMachine(machine);
        setEditConfig({
            name: machine.name || '',
            location: machine.location,
            owner: machine.owner || '',
            ip: machine.ip || '',
        });
        setIsEditModalOpen(true);
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMachine) return;

        try {
            await ParseService.updateMachineConfig(selectedMachine.id, editConfig);
            setIsEditModalOpen(false);
            setSelectedMachine(null);
            loadMachines();
        } catch (error) {
            console.error("Failed to update config", error);
            alert("Failed to update configuration");
        }
    };

    const handleStatusChange = async (machine: Machine, newStatus: string) => {
        try {
            await ParseService.updateMachineStatus(machine.id, newStatus as any);
            loadMachines();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update machine status");
        }
    };

    const filteredMachines = machines.filter(m => {
        const matchesSearch = m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || m.status === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2 bg-[#050505] border border-white/10 px-4 py-2.5 rounded-xl w-full md:w-96 focus-within:border-white/50 transition-colors shadow-sm">
                    <SearchIcon className="w-5 h-5 text-brand-gray" />
                    <input
                        type="text"
                        placeholder="Search machines..."
                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-brand-gray/50 font-sans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-brand-pink transition-colors"
                    >
                        <option value="All">All Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="maintenance">Maintenance</option>
                    </select>



                    <button
                        onClick={() => setIsAddMachineModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] text-sm font-bold whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Machine
                    </button>
                </div>
            </div>

            {/* Machines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredMachines.length > 0 ? (
                    filteredMachines.map(machine => (
                        <div key={machine.id} className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden hover:border-brand-pink/30 transition-all group relative">
                            <div className="absolute top-0 right-0 p-4 z-10">
                                <div className="relative">
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${machine.status === 'online'
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : machine.status === 'maintenance'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}
                                        onClick={() => {
                                            const newStatus = machine.status === 'online' ? 'maintenance' : machine.status === 'maintenance' ? 'offline' : 'online';
                                            if (confirm(`Change ${machine.machineId} status to ${newStatus}?`)) {
                                                handleStatusChange(machine, newStatus);
                                            }
                                        }}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${machine.status === 'online' ? 'bg-green-500 animate-pulse' : machine.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                        {machine.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-colors">
                                        <ServerIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-white font-orbitron truncate" title={machine.name || machine.machineId}>{machine.name || machine.machineId}</h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-1.5 text-brand-gray text-xs">
                                                <MapPinIcon className="w-3 h-3 text-brand-gray/70 shrink-0" />
                                                <span className="truncate" title={machine.location}>{machine.location}</span>
                                            </div>
                                            {machine.owner && (
                                                <div className="flex items-center gap-1.5 text-brand-gray text-xs">
                                                    <UserIcon className="w-3 h-3 text-brand-gray/70 shrink-0" />
                                                    <span className="truncate" title={machine.owner}>{machine.owner}</span>
                                                </div>
                                            )}
                                            {machine.ip && (
                                                <div className="flex items-center gap-1.5 text-brand-gray text-xs font-mono">
                                                    <GlobeIcon className="w-3 h-3 text-brand-gray/70 shrink-0" />
                                                    <span className="truncate" title={machine.ip}>{machine.ip}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Machine Logs Section - Terminal Style */}
                                {/* Machine Logs Section - Terminal Style */}
                                <div className="mt-4 border-t border-white/10 pt-4">
                                    <div
                                        className="flex justify-between items-center mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => toggleLogs(machine.machineId)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500 transition-colors cursor-pointer"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50 hover:bg-green-500 transition-colors cursor-pointer"></div>
                                            <span className="text-[10px] uppercase text-brand-gray/70 font-bold ml-2 tracking-wider font-mono">Machine Logs</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {expandedLogs[machine.machineId] && (
                                                <select
                                                    value={logFilters[machine.machineId] || 'All'}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        setLogFilters(prev => ({ ...prev, [machine.machineId]: e.target.value }));
                                                        setTimeout(() => loadMachineLogs(machine.machineId), 100);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-2 py-1 bg-black border border-white/10 rounded text-[10px] text-brand-gray font-mono outline-none focus:border-brand-pink/50 focus:text-brand-pink transition-colors cursor-pointer uppercase tracking-tight mr-2"
                                                >
                                                    <option value="All">All Output</option>
                                                    <option value="websocket_connect">System</option>
                                                    <option value="dispense">Dispense</option>
                                                    <option value="error">Errors</option>
                                                </select>
                                            )}
                                            <ChevronDownIcon className={`w-4 h-4 text-brand-gray transition-transform duration-300 ${expandedLogs[machine.machineId] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {expandedLogs[machine.machineId] && (
                                        <div className="bg-[#050505] rounded-md p-3 h-48 overflow-y-auto custom-scrollbar border border-white/10 font-mono text-[11px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative font-medium group/terminal animate-enter-up">
                                            <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 opacity-20 bg-[length:100%_4px,6px_100%]"></div>
                                            <div className="relative z-10 space-y-0.5 min-h-full pb-4">
                                                {machineLogs[machine.machineId]?.length > 0 ? (
                                                    <>
                                                        {machineLogs[machine.machineId].map((log, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`break-all leading-tight flex gap-2 ${log.severity === 'error' ? 'text-red-500' :
                                                                    log.severity === 'warning' ? 'text-yellow-500' :
                                                                        log.logType === 'dispense' ? 'text-green-400' :
                                                                            log.logType === 'websocket_connect' || log.logType === 'websocket_disconnect' ? 'text-blue-400' :
                                                                                'text-brand-gray/60'
                                                                    }`}
                                                            >
                                                                <span className="opacity-30 whitespace-nowrap select-none">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                                                                <span className="opacity-50 select-none">{'>'}</span>
                                                                <span>{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <div className="text-brand-gray/30 italic flex gap-2">
                                                        <span className="opacity-30 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                                        <span className="opacity-50 select-none">{'>'}</span>
                                                        <span>Initializing terminal... No logs found.</span>
                                                    </div>
                                                )}

                                                {/* Active prompt line */}
                                                <div className="flex items-center text-brand-gray/50 mt-1">
                                                    <span className="mr-2 opacity-30 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                                    <span className="mr-2 opacity-50 select-none">{'>'}</span>
                                                    <span className="w-2 h-4 bg-brand-pink/50 animate-pulse block"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons - Moved to Bottom (Compact) */}
                                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => handleGenerateSketch(machine)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-brand-pink/10 hover:border-brand-pink/30 hover:text-brand-pink text-brand-gray text-xs font-bold rounded-lg border border-white/5 transition-all group-hover:border-white/10"
                                    >
                                        <CodeIcon className="w-3 h-3" />
                                        {isGeneratingSketch ? 'Generating...' : 'Sketch'}
                                    </button>
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-brand-pink/10 hover:border-brand-pink/30 hover:text-brand-pink text-brand-gray text-xs font-bold rounded-lg border border-white/5 transition-all group-hover:border-white/10"
                                        onClick={() => handleEditMachine(machine)}
                                    >
                                        <EditIcon className="w-3 h-3" />
                                        Config
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center opacity-50">
                        <ServerIcon className="w-12 h-12 mx-auto mb-3 text-brand-gray" />
                        <p className="text-white">No machines found</p>
                    </div>
                )}
            </div>

            {/* Add Machine Modal */}
            {isAddMachineModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddMachineModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Add New Machine</h3>
                            <button onClick={() => setIsAddMachineModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddMachine} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Machine Name / ID</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={newMachine.machineId}
                                    onChange={e => setNewMachine({ ...newMachine, machineId: e.target.value })}
                                    placeholder="e.g. VM-001"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Location (Google Maps Coordinates)</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={newMachine.location}
                                    onChange={e => setNewMachine({ ...newMachine, location: e.target.value })}
                                    placeholder="e.g. 40.7128, -74.0060"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Owner Name</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={newMachine.owner}
                                    onChange={e => setNewMachine({ ...newMachine, owner: e.target.value })}
                                    placeholder="e.g. Black Box Team"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">IP Address</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={newMachine.ip}
                                    onChange={e => setNewMachine({ ...newMachine, ip: e.target.value })}
                                    placeholder="e.g. 111.22.33.44"
                                />
                            </div>
                            <p className="text-[10px] text-brand-gray mt-2">
                                Note: Adding a machine will automatically generate a secure token for it. You can retrieve this token later to flash the ESP32.
                            </p>
                            <button type="submit" className="w-full bg-brand-pink text-white font-bold py-3 rounded-xl mt-4 hover:bg-brand-pink/90 transition-all shadow-[0_0_15px_rgba(255,42,109,0.3)]">
                                Register Machine
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Machine Modal */}
            {isEditModalOpen && selectedMachine && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-enter-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white font-orbitron">Edit Machine: {selectedMachine.machineId}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-brand-gray hover:text-white">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveConfig} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={editConfig.name}
                                    onChange={e => setEditConfig({ ...editConfig, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Location (Google Maps Coordinates)</label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={editConfig.location}
                                    onChange={e => setEditConfig({ ...editConfig, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">Owner Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={editConfig.owner}
                                    onChange={e => setEditConfig({ ...editConfig, owner: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-gray uppercase mb-1">IP Address</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 192.168.1.100"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-pink outline-none transition-colors"
                                    value={editConfig.ip}
                                    onChange={e => setEditConfig({ ...editConfig, ip: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-pink text-white font-bold py-3 rounded-xl mt-4 hover:bg-brand-pink/90 transition-all shadow-[0_0_15px_rgba(255,42,109,0.3)]">
                                Save Configuration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachinesView;
