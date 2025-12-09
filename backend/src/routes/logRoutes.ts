import express from 'express';
import { getMachineLogs, clearOldLogs } from '../controllers/logController';

const router = express.Router();

// Get logs for a specific machine
router.get('/:machineId', getMachineLogs);

// Clear old logs for a machine (optional maintenance endpoint)
router.delete('/:machineId/old', clearOldLogs);

export default router;
