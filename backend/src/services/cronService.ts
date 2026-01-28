import * as cron from 'node-cron';
import { updateSatellites } from './tleService';
import { prisma } from '../config/database';
import { clearAllPositions } from './cacheService';

/**
 * Cron job instances
 */
let tleUpdateJob: cron.ScheduledTask | null = null;
let dataCleanupJob: cron.ScheduledTask | null = null;

/**
 * Job execution statistics
 */
const jobStats = {
    tleUpdate: {
        lastRun: null as Date | null,
        lastStatus: 'never' as 'success' | 'error' | 'never',
        runCount: 0,
        errorCount: 0
    },
    dataCleanup: {
        lastRun: null as Date | null,
        lastStatus: 'never' as 'success' | 'error' | 'never',
        runCount: 0,
        errorCount: 0
    }
};

/**
 * Daily TLE Update Job
 * Runs at 3:00 AM UTC every day
 * Fetches latest TLE data from CelesTrak and updates database
 */
const runTLEUpdate = async () => {
    console.log('Starting scheduled TLE update...');
    const startTime = Date.now();

    try {
        await updateSatellites();

        const duration = Date.now() - startTime;
        jobStats.tleUpdate.lastRun = new Date();
        jobStats.tleUpdate.lastStatus = 'success';
        jobStats.tleUpdate.runCount++;

        console.log(`TLE update completed successfully in ${duration}ms`);

        // Clear position cache after TLE update to force recalculation
        await clearAllPositions();
        console.log('Position cache cleared after TLE update');
    } catch (error) {
        console.error('Error in scheduled TLE update:', error);
        jobStats.tleUpdate.lastStatus = 'error';
        jobStats.tleUpdate.errorCount++;
    }
};

/**
 * Data Cleanup Job
 * Runs daily at 4:00 AM UTC
 * Removes old TLE data (keep last 30 days)
 */
const runDataCleanup = async () => {
    console.log('Starting scheduled data cleanup...');
    const startTime = Date.now();

    try {
        // Delete TLE records older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.tLE.deleteMany({
            where: {
                fetchedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        const duration = Date.now() - startTime;
        jobStats.dataCleanup.lastRun = new Date();
        jobStats.dataCleanup.lastStatus = 'success';
        jobStats.dataCleanup.runCount++;

        console.log(`Data cleanup completed: ${result.count} old TLE records deleted in ${duration}ms`);
    } catch (error) {
        console.error('Error in scheduled data cleanup:', error);
        jobStats.dataCleanup.lastStatus = 'error';
        jobStats.dataCleanup.errorCount++;
    }
};

/**
 * Initialize and start all background jobs
 */
export const startBackgroundJobs = () => {
    console.log('Initializing background jobs...');

    // TLE Update Job - Daily at 3:00 AM UTC
    // Cron format: second minute hour day month weekday
    tleUpdateJob = cron.schedule('0 0 3 * * *', runTLEUpdate, {
        timezone: 'UTC'
    });

    console.log('✓ TLE Update job scheduled: Daily at 3:00 AM UTC');

    // Data Cleanup Job - Daily at 4:00 AM UTC
    dataCleanupJob = cron.schedule('0 0 4 * * *', runDataCleanup, {
        timezone: 'UTC'
    });

    console.log('✓ Data Cleanup job scheduled: Daily at 4:00 AM UTC');

    console.log('All background jobs started successfully');
};

/**
 * Stop all background jobs
 */
export const stopBackgroundJobs = () => {
    console.log('Stopping background jobs...');

    if (tleUpdateJob) {
        tleUpdateJob.stop();
        tleUpdateJob = null;
        console.log('✓ TLE Update job stopped');
    }

    if (dataCleanupJob) {
        dataCleanupJob.stop();
        dataCleanupJob = null;
        console.log('✓ Data Cleanup job stopped');
    }

    console.log('All background jobs stopped');
};

/**
 * Manually trigger TLE update (for testing or immediate updates)
 */
export const triggerTLEUpdate = async (): Promise<void> => {
    console.log('Manually triggering TLE update...');
    await runTLEUpdate();
};

/**
 * Manually trigger data cleanup (for testing)
 */
export const triggerDataCleanup = async (): Promise<void> => {
    console.log('Manually triggering data cleanup...');
    await runDataCleanup();
};

/**
 * Get job statistics
 */
export const getJobStats = () => {
    return {
        ...jobStats,
        jobs: {
            tleUpdate: {
                isRunning: tleUpdateJob !== null,
                schedule: 'Daily at 3:00 AM UTC'
            },
            dataCleanup: {
                isRunning: dataCleanupJob !== null,
                schedule: 'Daily at 4:00 AM UTC'
            }
        }
    };
};

/**
 * Check if jobs are running
 */
export const areJobsRunning = (): boolean => {
    return tleUpdateJob !== null && dataCleanupJob !== null;
};

// Graceful shutdown
process.on('SIGTERM', stopBackgroundJobs);
process.on('SIGINT', stopBackgroundJobs);
