import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();

export const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err: any) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
    if (!redis.isOpen) {
        await redis.connect();
        console.log('Connected to Redis');
    }
};

export const disconnectServices = async () => {
    await prisma.$disconnect();
    if (redis.isOpen) {
        await redis.disconnect();
    }
};
