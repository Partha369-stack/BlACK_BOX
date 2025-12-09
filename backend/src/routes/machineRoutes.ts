import { Router } from 'express';
import {
    downloadSketch,
    startMachine,
    dispenseProduct,
    getMachineHealth,
    getAllMachinesHealth,
    getMachineStatistics,
    updateMachineConfig,
    updateMachineStatusController
} from '../controllers/machineController';

const router = Router();

// Route to generate and download ESP32 sketch
router.post('/:id/sketch', downloadSketch);

// Route to start/ping the machine
router.post('/:id/start', startMachine);

// Route to dispense products
router.post('/:id/dispense', dispenseProduct);

// Route to get machine health status
router.get('/:id/health', getMachineHealth);

// Route to get all machines health status
router.get('/health/status', getAllMachinesHealth);

// Route to get machine statistics
router.get('/:id/stats', getMachineStatistics);

// Route to update machine configuration
router.put('/:id/config', updateMachineConfig);

// Route to update machine status
router.put('/:id/status', updateMachineStatusController);

export default router;

