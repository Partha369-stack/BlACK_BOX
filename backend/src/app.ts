import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeParse } from './services/parseServer';
import { healthMonitor } from './services/healthMonitor';
import machineRoutes from './routes/machineRoutes';
import logRoutes from './routes/logRoutes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Parse
try {
    initializeParse();
} catch (error: any) {
    console.error('Failed to initialize Parse:', error);
    process.exit(1);
}

// Routes
app.use('/api/machines', machineRoutes);
app.use('/api/logs', logRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Black Box Backend API is running');
});

// Export health monitor initializer for production server
export const initializeHealthMonitor = (server: any) => healthMonitor.initialize(server);

export default app;
