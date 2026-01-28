import { redis } from '../config/database';
import { SatellitePosition } from './sgp4Service';

/**
 * Cache key schema for satellite positions
 * Format: sat:pos:{noradId}
 */
const POSITION_KEY_PREFIX = 'sat:pos:';
const POSITION_TTL = 5; // 5 seconds TTL for position cache

/**
 * Cache key for all active satellite IDs
 */
const ACTIVE_SATELLITES_KEY = 'sat:active';

/**
 * Generate cache key for satellite position
 */
export const getPositionKey = (noradId: number): string => {
    return `${POSITION_KEY_PREFIX}${noradId}`;
};

/**
 * Store satellite position in Redis cache
 * 
 * @param position - Satellite position data
 * @returns true if successful
 */
export const setPosition = async (position: SatellitePosition): Promise<boolean> => {
    try {
        const key = getPositionKey(position.noradId);
        const value = JSON.stringify({
            noradId: position.noradId,
            timestamp: position.timestamp.toISOString(),
            latitude: position.latitude,
            longitude: position.longitude,
            altitude: position.altitude,
            velocity: position.velocity,
            velocityVector: position.velocityVector
        });

        // Set with expiration
        await redis.setEx(key, POSITION_TTL, value);

        // Add to active satellites set
        await redis.sAdd(ACTIVE_SATELLITES_KEY, position.noradId.toString());

        return true;
    } catch (error) {
        console.error(`Error setting position for NORAD ${position.noradId}:`, error);
        return false;
    }
};

/**
 * Get satellite position from Redis cache
 * 
 * @param noradId - NORAD catalog ID
 * @returns Satellite position or null if not found/expired
 */
export const getPosition = async (noradId: number): Promise<SatellitePosition | null> => {
    try {
        const key = getPositionKey(noradId);
        const value = await redis.get(key);

        if (!value) {
            return null;
        }

        const parsed = JSON.parse(value);
        return {
            ...parsed,
            timestamp: new Date(parsed.timestamp)
        };
    } catch (error) {
        console.error(`Error getting position for NORAD ${noradId}:`, error);
        return null;
    }
};

/**
 * Store multiple satellite positions in a batch
 * Uses Redis pipeline for efficiency
 * 
 * @param positions - Array of satellite positions
 * @returns Number of successfully cached positions
 */
export const setPositionsBatch = async (positions: SatellitePosition[]): Promise<number> => {
    try {
        if (positions.length === 0) return 0;

        const pipeline = redis.multi();

        for (const position of positions) {
            const key = getPositionKey(position.noradId);
            const value = JSON.stringify({
                noradId: position.noradId,
                timestamp: position.timestamp.toISOString(),
                latitude: position.latitude,
                longitude: position.longitude,
                altitude: position.altitude,
                velocity: position.velocity,
                velocityVector: position.velocityVector
            });

            pipeline.setEx(key, POSITION_TTL, value);
            pipeline.sAdd(ACTIVE_SATELLITES_KEY, position.noradId.toString());
        }

        await pipeline.exec();
        return positions.length;
    } catch (error) {
        console.error('Error in batch position update:', error);
        return 0;
    }
};

/**
 * Get multiple satellite positions in a batch
 * 
 * @param noradIds - Array of NORAD IDs
 * @returns Map of NORAD ID to position (only includes found positions)
 */
export const getPositionsBatch = async (
    noradIds: number[]
): Promise<Map<number, SatellitePosition>> => {
    const result = new Map<number, SatellitePosition>();

    try {
        if (noradIds.length === 0) return result;

        const keys = noradIds.map(id => getPositionKey(id));
        const values = await redis.mGet(keys);

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (value) {
                const parsed = JSON.parse(value);
                result.set(noradIds[i], {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp)
                });
            }
        }

        return result;
    } catch (error) {
        console.error('Error in batch position retrieval:', error);
        return result;
    }
};

/**
 * Get all active satellite IDs from cache
 * 
 * @returns Array of NORAD IDs
 */
export const getActiveSatelliteIds = async (): Promise<number[]> => {
    try {
        const ids = await redis.sMembers(ACTIVE_SATELLITES_KEY);
        return ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    } catch (error) {
        console.error('Error getting active satellite IDs:', error);
        return [];
    }
};

/**
 * Get all cached positions for active satellites
 * 
 * @returns Array of satellite positions
 */
export const getAllCachedPositions = async (): Promise<SatellitePosition[]> => {
    try {
        const ids = await getActiveSatelliteIds();
        if (ids.length === 0) return [];

        const positionsMap = await getPositionsBatch(ids);
        return Array.from(positionsMap.values());
    } catch (error) {
        console.error('Error getting all cached positions:', error);
        return [];
    }
};

/**
 * Clear position cache for a specific satellite
 * 
 * @param noradId - NORAD catalog ID
 */
export const clearPosition = async (noradId: number): Promise<void> => {
    try {
        const key = getPositionKey(noradId);
        await redis.del(key);
        await redis.sRem(ACTIVE_SATELLITES_KEY, noradId.toString());
    } catch (error) {
        console.error(`Error clearing position for NORAD ${noradId}:`, error);
    }
};

/**
 * Clear all position caches
 */
export const clearAllPositions = async (): Promise<void> => {
    try {
        const ids = await getActiveSatelliteIds();
        if (ids.length === 0) return;

        const pipeline = redis.multi();

        for (const id of ids) {
            pipeline.del(getPositionKey(id));
        }

        pipeline.del(ACTIVE_SATELLITES_KEY);
        await pipeline.exec();

        console.log(`Cleared ${ids.length} position caches`);
    } catch (error) {
        console.error('Error clearing all positions:', error);
    }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
    activeSatellites: number;
    cachedPositions: number;
}> => {
    try {
        const ids = await getActiveSatelliteIds();
        const positions = await getAllCachedPositions();

        return {
            activeSatellites: ids.length,
            cachedPositions: positions.length
        };
    } catch (error) {
        console.error('Error getting cache stats:', error);
        return {
            activeSatellites: 0,
            cachedPositions: 0
        };
    }
};
