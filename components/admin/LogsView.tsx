import React, { useState, useEffect, useRef } from 'react';
import { TerminalIcon as Terminal, DownloadIcon as Download, TrashIcon as Trash2, FilterIcon as Filter, Pause, Play } from '../Shared/Icons';

interface LogEntry {
    timestamp: string;
    level: string;
    service: string;
    source: string;
    message: string;
    machineId?: string;
    metadata?: any;
}

export const LogsView: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [filter, setFilter] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Connect to WebSocket
    useEffect(() => {
        // 1. Fetch recent logs from API
        fetch('http://localhost:3001/logs/recent?limit=100')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Redis returns latest first (LPUSH). We want them in the array same order as they come in?
                    // Terminal view appends new logs.
                    // So we want [Oldest ... Newest].
                    // Redis returns [Newest ... Oldest].
                    // So we reverse it.
                    setLogs(data.reverse());
                }
            })
            .catch(err => console.error('Failed to fetch recent logs:', err));

        const connect = () => {
            // Connect to Health Monitor endpoint which broadcasts logs
            const wsUrl = `ws://localhost:3001/ws`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                // Subscribe as monitor
                ws.send(JSON.stringify({ type: 'subscribe' }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Handle both direct log messages and wrapped broadcast messages
                    let logEntry: LogEntry | null = null;

                    if (data.type === 'custom-transport' || data.source) {
                        // It's a direct log entry from our new logger
                        logEntry = data;
                    } else if (data.type === 'machine_log') {
                        // Legacy or wrapped wrapper
                        logEntry = {
                            timestamp: data.timestamp,
                            level: data.severity || 'info',
                            service: 'device',
                            source: 'device',
                            message: data.message,
                            machineId: data.machineId
                        };
                    }

                    if (logEntry && !isPaused) {
                        setLogs(prev => {
                            const newLogs = [...prev, logEntry!].slice(-500); // Keep last 500
                            return newLogs;
                        });
                    }
                } catch (err) {
                    console.error('Failed to parse log:', err);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Reconnect after 3s
                setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                console.error('WS Error:', err);
                ws.close();
            };
        };

        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [isPaused]);

    // Auto-scroll
    useEffect(() => {
        if (!isPaused && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isPaused]);

    const filteredLogs = logs.filter(log =>
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        log.service?.toLowerCase().includes(filter.toLowerCase()) ||
        log.source?.toLowerCase().includes(filter.toLowerCase())
    );

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'error': return 'text-red-500';
            case 'warn':
            case 'warning': return 'text-yellow-500';
            case 'info': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    const clearLogs = () => setLogs([]);

    const downloadLogs = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = `system-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        System Logs
                    </h2>
                    <p className="text-gray-400 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        {isConnected ? 'Live Stream Active' : 'Connecting...'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`p-2 rounded-lg transition-colors ${isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        title={isPaused ? "Resume Auto-scroll" : "Pause Auto-scroll"}
                    >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={clearLogs}
                        className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Clear Buffer"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={downloadLogs}
                        className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
                        title="Download Logs"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex gap-4">
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
                    <input
                        type="text"
                        placeholder="Filter logs..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Terminal View */}
            <div className="bg-black rounded-xl border border-gray-800 p-4 h-[600px] overflow-y-auto font-mono text-sm relative custom-scrollbar">
                <div className="absolute top-2 right-4 text-xs text-gray-600">
                    Buffer: {logs.length} / 500
                </div>

                <div className="space-y-1">
                    {filteredLogs.map((log, i) => (
                        <div key={i} className="hover:bg-gray-900/50 p-1 rounded flex gap-3 text-gray-300 break-all group">
                            <span className="text-gray-500 whitespace-nowrap select-none">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`font-bold w-16 uppercase ${getLevelColor(log.level)}`}>
                                {log.level}
                            </span>
                            <span className="text-purple-400 w-24 truncate" title={log.service || log.source}>
                                [{log.service || log.source}]
                            </span>
                            <span className="flex-1">
                                {log.message}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <span className="ml-2 text-gray-600 group-hover:block hidden">
                                        {JSON.stringify(log.metadata)}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>

                {filteredLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <Terminal className="mb-4 opacity-50 w-12 h-12" />
                        <p>No logs to display</p>
                    </div>
                )}
            </div>
        </div>
    );
};
