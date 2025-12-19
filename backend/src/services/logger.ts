import winston from 'winston';
import Transport from 'winston-transport';
// Redis temporarily disabled
// import { redisClient } from './redisClient';

// Sensitive keys to mask
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'payment_id', 'card_number', 'pan', 'cvv', 'raw_response'];

// Recursively sanitize object
const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(sanitize);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            sanitized[key] = '***MASKED***';
        } else if (typeof value === 'object') {
            sanitized[key] = sanitize(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

// Custom Redis Transport - DISABLED
// class RedisTransport extends Transport {
//     constructor(opts?: any) {
//         super(opts);
//     }

//     log(info: any, callback: () => void) {
//         setImmediate(() => {
//             this.emit('logged', info);
//         });

//         // 1. Sanitize
//         const sanitizedInfo = sanitize(info);

//         // 2. Format as Canonical JSON
//         const logEntry = JSON.stringify({
//             timestamp: sanitizedInfo.timestamp || new Date().toISOString(),
//             level: sanitizedInfo.level,
//             message: sanitizedInfo.message,
//             service: sanitizedInfo.service || 'backend',
//             source: sanitizedInfo.source || 'backend',
//             machineId: sanitizedInfo.machineId || null,
//             metadata: sanitizedInfo.metadata || {},
//             correlation_id: sanitizedInfo.correlation_id,
//             event: sanitizedInfo.event
//         });

//         // 3. Publish & Push to Redis
//         // We don't await here to not block the main loop, but we catch errors in redisClient
//         redisClient.publishLog(logEntry);
//         redisClient.pushLog(logEntry);

//         callback();
//     }
// }

// Create Logger
export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'backend' },
    transports: [
        // Console Transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
        // Redis Transport - DISABLED
        // new RedisTransport()
    ]
});
