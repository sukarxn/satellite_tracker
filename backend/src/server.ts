import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { prisma, redis, connectRedis, disconnectServices } from './config/database';
import satelliteRoutes from './routes/satelliteRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Services
(async () => {
    try {
        await connectRedis();
    } catch (error) {
        console.error('Failed to connect to Redis', error);
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

// Error Handling Middleware
app.use(errorHandler);

// Start Server unless in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

process.on('SIGTERM', async () => {
    await disconnectServices();
    process.exit(0);
});
