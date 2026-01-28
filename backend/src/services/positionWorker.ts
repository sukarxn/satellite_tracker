import { prisma } from '../config/database';
import { calculateSatellitePosition } from './sgp4Service';
import { setPositionsBatch } from './cacheService';
import type { SatellitePosition } from './sgp4Service';

/**
 * Worker configuration
 */
const WORKER_CONFIG = {
    updateInterval: 1000, // 1 second between updates
    batchSize: 100, // Process satellites in batches
    maxSatellites: 1000, // Limit for MVP (can be increased)
};

/**
 * Worker state
 */
let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;
let lastUpdateTime: Date | null = null;
let processedCount = 0;
let errorCount = 0;

/**
 * Fetch active TLEs from database
 * Gets the most recent TLE for each satellite
 * 
 * @param limit - Maximum number of satellites to fetch
 * @returns Array of satellites with their latest TLE
 */
export const fetchActiveTLEs = async (limit: number = WORKER_CONFIG.maxSatellites) => {
    try {
        // Get satellites with their most recent TLE
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
 * Calculates positions and writes to Redis cache
 * 
 * @param satellites - Array of satellites to process
 * @returns Number of successfully processed satellites
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
 * Fetches all active satellites and processes them in batches
 */
const workerLoop = async () => {
    try {
        const startTime = Date.now();

        // Fetch all active satellites with TLEs
        const satellites = await fetchActiveTLEs();

        if (satellites.length === 0) {
            console.log('No satellites found in database');
            return;
        }

        console.log(`Processing ${satellites.length} satellites...`);

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
            `Worker cycle complete: ${totalProcessed}/${satellites.length} satellites processed in ${duration}ms ` +
            `(${(duration / satellites.length).toFixed(2)}ms per satellite)`
        );

        // Benchmark info
        if (satellites.length >= 500) {
            console.log(`Benchmark: Processing ${satellites.length} satellites took ${duration}ms`);
        }
    } catch (error) {
        console.error('Error in worker loop:', error);
        errorCount++;
    }
};

/**
 * Start the position calculation worker
 * Runs continuously at configured interval
 */
export const startWorker = () => {
    if (isRunning) {
        console.log('Worker is already running');
        return;
    }

    console.log('Starting Position Calculation Worker...');
    console.log(`Update interval: ${WORKER_CONFIG.updateInterval}ms`);
    console.log(`Batch size: ${WORKER_CONFIG.batchSize}`);
    console.log(`Max satellites: ${WORKER_CONFIG.maxSatellites}`);

    isRunning = true;
    processedCount = 0;
    errorCount = 0;

    // Run immediately
    workerLoop();

    // Then run at interval
    workerInterval = setInterval(workerLoop, WORKER_CONFIG.updateInterval);
};

/**
 * Stop the position calculation worker
 */
export const stopWorker = () => {
    if (!isRunning) {
        console.log('Worker is not running');
        return;
    }

    console.log('Stopping Position Calculation Worker...');

    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
    }

    isRunning = false;
    console.log('Worker stopped');
};

/**
 * Get worker status and statistics
 */
export const getWorkerStatus = () => {
    return {
        isRunning,
        lastUpdateTime,
        processedCount,
        errorCount,
        config: WORKER_CONFIG
    };
};

/**
 * Update worker configuration
 * Worker must be restarted for changes to take effect
 */
export const updateWorkerConfig = (config: Partial<typeof WORKER_CONFIG>) => {
    Object.assign(WORKER_CONFIG, config);
    console.log('Worker configuration updated:', WORKER_CONFIG);
};

// Graceful shutdown
process.on('SIGTERM', () => {
    stopWorker();
});

process.on('SIGINT', () => {
    stopWorker();
});
