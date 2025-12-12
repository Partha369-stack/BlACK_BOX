import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeParse } from './services/parseServer';
import { healthMonitor } from './services/healthMonitor';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import machineRoutes from './routes/machineRoutes';
import logRoutes from './routes/logRoutes';
import financeRoutes from './routes/financeRoutes';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import path from 'path';

// Force load from root directory (parent of backend)
// If running from 'backend' dir, root is '../'
const rootEnvPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: rootEnvPath });

console.log('Current working directory:', process.cwd());
console.log('Attempted to load .env from:', rootEnvPath);
console.log('Check Master Keys:', {
    PARSE_MASTER_KEY: !!process.env.PARSE_MASTER_KEY,
    VITE_PARSE_MASTER_KEY: !!process.env.VITE_PARSE_MASTER_KEY
});

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

// Logging middleware (before routes)
app.use(loggingMiddleware);

// Routes
app.use('/machines', machineRoutes);
app.use('/logs', logRoutes);
app.use('/finance', financeRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Black Box Backend API is running');
});

// Export health monitor initializer for production server
export const initializeHealthMonitor = (server: any) => healthMonitor.initialize(server);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
