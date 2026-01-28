import { prisma } from '../config/database';
import { calculateSatellitePosition } from './sgp4Service';
import { setPositionsBatch } from './cacheService';
import { SatelliteService } from './positionService';
import type { SatellitePosition } from './sgp4Service';

/**
 * Worker configuration
 */
const WORKER_CONFIG = {
    updateInterval: 5000, // 5 seconds between updates (reduced frequency for performance)
    batchSize: 100, // Process satellites in batches
    maxSatellites: 1000, // Limit for MVP
};

/**
 * Worker state
 */
let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;
let lastUpdateTime: Date | null = null;
let processedCount = 0;
let errorCount = 0;

const satelliteService = SatelliteService.getInstance();

/**
 * Fetch active TLEs from database
 */
export const fetchActiveTLEs = async (limit: number = WORKER_CONFIG.maxSatellites) => {
    try {
        const satellites = await prisma.satellite.findMany({
            take: limit,
            include: {
                tles: {
                    orderBy: {
                        fetchedAt: 'desc'
                    },
                    take: 1
                }
            },
            where: {
                tles: {
                    some: {}
                }
            }
        });

        return satellites
            .filter(sat => sat.tles.length > 0)
            .map(sat => ({
                noradId: sat.noradId,
                name: sat.name,
                tle: {
                    line1: sat.tles[0].line1,
                    line2: sat.tles[0].line2
                }
            }));
    } catch (error) {
        console.error('Error fetching active TLEs:', error);
        return [];
    }
};

/**
 * Process a batch of satellites
 */
const processBatch = async (
    satellites: Array<{ noradId: number; name: string; tle: { line1: string; line2: string } }>
): Promise<number> => {
    const positions: SatellitePosition[] = [];
    const now = new Date();

    for (const sat of satellites) {
        try {
            const position = calculateSatellitePosition(sat.noradId, sat.tle, now);

            if (position) {
                // Update in-memory service for real-time WebSocket and paths
                const tleString = `${sat.tle.line1}\n${sat.tle.line2}`;
                satelliteService.updatePosition(sat.noradId, sat.name, position, tleString);
                positions.push(position);
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error(`Error processing satellite ${sat.noradId} (${sat.name}):`, error);
            errorCount++;
        }
    }

    // Write all positions to cache in a batch
    if (positions.length > 0) {
        const cached = await setPositionsBatch(positions);
        return cached;
    }

    return 0;
};

/**
 * Main worker loop
 */
const workerLoop = async () => {
    if (!isRunning) return;

    try {
        const startTime = Date.now();
        const satellites = await fetchActiveTLEs();

        if (satellites.length === 0) {
            console.log('No satellites found in database');
            return;
        }

        // Process in batches
        let totalProcessed = 0;
        for (let i = 0; i < satellites.length; i += WORKER_CONFIG.batchSize) {
            const batch = satellites.slice(i, i + WORKER_CONFIG.batchSize);
            const processed = await processBatch(batch);
            totalProcessed += processed;
        }

        const duration = Date.now() - startTime;
        processedCount = totalProcessed;
        lastUpdateTime = new Date();

        console.log(
            `Worker cycle complete: ${totalProcessed}/${satellites.length} satellites processed in ${duration}ms`
        );
    } catch (error) {
        console.error('Error in worker loop:', error);
        errorCount++;
    }
};

/**
 * Start the position calculation worker
 */
export const startWorker = () => {
    if (isRunning) {
        console.log('Worker is already running');
        return;
    }

    isRunning = true;
    console.log('Starting Position Calculation Worker...');

    // Run immediately
    workerLoop();

    // Then run at interval
    workerInterval = setInterval(workerLoop, WORKER_CONFIG.updateInterval);
};

/**
 * Stop the position calculation worker
 */
export const stopWorker = () => {
    isRunning = false;
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
    }
    console.log('Worker stopped');
};

export const getWorkerStatus = () => ({
    isRunning,
    lastUpdateTime,
    processedCount,
    errorCount,
    config: WORKER_CONFIG
});
