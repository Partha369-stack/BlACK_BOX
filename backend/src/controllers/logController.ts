import { Request, Response } from 'express';
import Parse from '../services/parseServer';
import { logger } from '../services/logger';
// Redis temporarily disabled
// import { redisClient } from './redisClient';

// Log a machine event
export const logMachineEvent = async (
    machineId: string,
    logType: 'websocket_ping' | 'websocket_connect' | 'websocket_disconnect' | 'dispense' | 'error' | 'status_change' | 'device_log',
    message: string,
    metadata?: any,
    severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> => {
    logger.log({
        level: severity,
        message: message,
        machineId: machineId,
        source: 'device',
        event: logType,
        metadata: metadata
    });
};

// Get recent system logs (Redis) - DISABLED, returns empty array
export const getRecentSystemLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        // Redis temporarily disabled - returning empty logs
        res.json([]);

        // const { limit = 100 } = req.query;
        // const logs = await redisClient.getRecentLogs(Number(limit));

        // // Parse logs as they are stored as JSON strings in Redis
        // const parsedLogs = logs.map(log => {
        //     try {
        //         return JSON.parse(log);
        //     } catch (e) {
        //         return { message: log };
        //     }
        // });

        // res.json(parsedLogs);
    } catch (error) {
        console.error('Error fetching recent system logs:', error);
        res.status(500).json({ error: 'Failed to fetch recent logs' });
    }
};

// Get machine logs
export const getMachineLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { machineId } = req.params;
        const { logType, limit = 100 } = req.query;

        const MachineLog = Parse.Object.extend('MachineLog');
        const query = new Parse.Query(MachineLog);

        query.equalTo('machineId', machineId);

        if (logType) {
            query.equalTo('logType', logType);
        }

        query.descending('timestamp');
        query.limit(Number(limit));

        const logs = await query.find();

        const formattedLogs = logs.map((log: Parse.Object) => ({
            id: log.id,
            machineId: log.get('machineId'),
            logType: log.get('logType'),
            message: log.get('message'),
            metadata: log.get('metadata'),
            severity: log.get('severity'),
            timestamp: log.get('timestamp')
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Error fetching machine logs:', error);
        res.status(500).json({ error: 'Failed to fetch machine logs' });
    }
};

// Clear old logs (maintenance endpoint)
export const clearOldLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { machineId } = req.params;
        const { daysToKeep = 30 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        const MachineLog = Parse.Object.extend('MachineLog');
        const query = new Parse.Query(MachineLog);

        query.equalTo('machineId', machineId);
        query.lessThan('timestamp', cutoffDate);

        const oldLogs = await query.find();
        await Parse.Object.destroyAll(oldLogs);

        res.json({
            message: `Cleared ${oldLogs.length} logs older than ${daysToKeep} days`,
            deletedCount: oldLogs.length
        });
    } catch (error) {
        console.error('Error clearing old logs:', error);
        res.status(500).json({ error: 'Failed to clear old logs' });
    }
};
