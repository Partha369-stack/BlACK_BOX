import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

/**
 * Logging middleware to capture all HTTP requests and responses
 * Automatically feeds logs into Winston -> Redis pipeline
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, url, ip } = req;

    // Log incoming request
    logger.info(`${method} ${url}`, {
        source: 'api',
        service: 'backend',
        metadata: {
            method,
            url,
            ip: ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        }
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
        const duration = Date.now() - startTime;
        const { statusCode } = res;

        // Determine log level based on status code
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

        logger.log({
            level,
            message: `${method} ${url} ${statusCode} - ${duration}ms`,
            source: 'api',
            service: 'backend',
            metadata: {
                method,
                url,
                statusCode,
                duration,
                contentLength: res.get('content-length')
            }
        });

        return originalSend.call(this, data);
    };

    next();
};
