/**
 * Environment-aware configuration
 * Automatically uses the correct API and WebSocket URLs based on environment
 */

const isDevelopment = import.meta.env.DEV;

export const config = {
    /**
     * Base API URL
     * Development: http://localhost:3001/api (proxied through Vite)
     * Production: /api (served from same origin)
     */
    apiUrl: isDevelopment ? 'http://localhost:3001' : '/api',

    /**
     * WebSocket URL for health monitoring
     * Development: ws://localhost:3001/health
     * Production: ws(s)://[current-host]/health
     */
    wsUrl: isDevelopment
        ? 'ws://localhost:3001/health'
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/health`,

    /**
     * Backend base URL (for non-API requests)
     * Development: http://localhost:3001
     * Production: empty string (same origin)
     */
    backendUrl: isDevelopment ? 'http://localhost:3001' : '',
};
