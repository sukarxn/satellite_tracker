import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { prisma, redis, connectRedis, disconnectServices } from './config/database';
import satelliteRoutes from './routes/satelliteRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initializeWebSocket, shutdownWebSocket, getWebSocketStats } from './services/websocketService';
import { startWorker, stopWorker, getWorkerStatus } from './services/positionWorker';
import { startBackgroundJobs, stopBackgroundJobs, getJobStats } from './services/cronService';

// Load environment variables
dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket integration
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Services
(async () => {
    try {
        await connectRedis();
        console.log('✓ Redis connected');

        // Initialize WebSocket server
        initializeWebSocket(httpServer);
        console.log('✓ WebSocket server initialized');

        // Start position calculation worker
        startWorker();
        console.log('✓ Position worker started');

        // Start background jobs (TLE updates, cleanup)
        startBackgroundJobs();
        console.log('✓ Background jobs scheduled');

        console.log('\n🚀 All services initialized successfully!\n');
    } catch (error) {
        console.error('Failed to initialize services:', error);
    }
})();

// Routes
app.use('/api/v1/satellites', satelliteRoutes);

// Health Check Route
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected', redis: redis.isOpen ? 'connected' : 'disconnected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// System Status Route
app.get('/api/v1/status', async (req, res) => {
    try {
        const workerStatus = getWorkerStatus();
        const wsStats = getWebSocketStats();
        const jobStats = getJobStats();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: redis.isOpen ? 'connected' : 'disconnected',
                websocket: wsStats,
                worker: workerStatus,
                jobs: jobStats
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get system status' });
    }
});

// Error Handling Middleware
app.use(errorHandler);

// Start Server unless in test mode
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`\n🌍 Server is running on port ${PORT}`);
        console.log(`📡 WebSocket server ready for connections`);
        console.log(`🛰️  Position worker calculating satellite positions`);
        console.log(`⏰ Background jobs scheduled\n`);
    });
}

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');

    stopWorker();
    stopBackgroundJobs();
    shutdownWebSocket();
    await disconnectServices();

    console.log('✓ All services stopped');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
