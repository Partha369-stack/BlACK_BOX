import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

/**
 * Global error handler middleware
 * Catches and logs all unhandled errors from routes and middleware
 */
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const { method, url } = req;

    // Log the error with full details
    logger.error(`Unhandled error in ${method} ${url}: ${err.message}`, {
        source: 'api',
        service: 'backend',
        metadata: {
            method,
            url,
            errorName: err.name,
            errorMessage: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }
    });

    // Send error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
