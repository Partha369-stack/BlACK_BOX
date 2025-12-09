// Load environment variables FIRST before any other imports
require('dotenv').config();

const express = require('express');
const path = require('path');
const { createServer } = require('http');

console.log('='.repeat(50));
console.log('🚀 Starting Production Server');
console.log('='.repeat(50));

// Import compiled backend app
let backendApp, initializeHealthMonitor;

try {
    console.log('📦 Loading backend module...');
    const backendModule = require('./backend/dist/server');
    backendApp = backendModule.default || backendModule;
    initializeHealthMonitor = backendModule.initializeHealthMonitor;
    console.log('✓ Backend module loaded successfully');
} catch (error) {
    console.error('❌ Failed to load backend module:', error.message);
    console.error('Full error:', error);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());

// Mount backend API at /api
app.use('/api', backendApp);
console.log('✓ Backend API mounted at /api');

// Serve static frontend files from /dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
console.log('✓ Static files serving from /dist');

// SPA fallback: all non-API routes return index.html for client-side routing
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    res.sendFile(path.join(distPath, 'index.html'));
});

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket health monitor
if (initializeHealthMonitor) {
    try {
        initializeHealthMonitor(server);
        console.log('✓ WebSocket health monitor initialized');
    } catch (error) {
        console.warn('⚠ Failed to initialize health monitor:', error.message);
    }
}

server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('✅ Production Server Running');
    console.log('='.repeat(50));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📦 Frontend: Serving from /dist`);
    console.log(`🔌 Backend API: /api/*`);
    console.log(`🏥 Health Monitor: WebSocket enabled`);
    console.log('='.repeat(50));
});
