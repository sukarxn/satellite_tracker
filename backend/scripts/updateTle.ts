import { updateSatellites } from '../src/services/tleService';
import { prisma, redis, disconnectServices } from '../src/config/database';

// Note: importing from src/server initiates the server side effects (DB/Redis connection)
// In a production script we might want to isolate the update logic or manually connect/disconnect.
// Since 'updateSatellites' imports 'prisma' from server, we need to ensure connection is ready.
// Actually, 'updateSatellites' uses the exported 'prisma' instance.

const main = async () => {
    try {
        console.log('Starting TLE update...');
        await updateSatellites();
        console.log('TLE update completed successfully.');
    } catch (error) {
        console.error('TLE update failed:', error);
        process.exit(1);
    } finally {
        await disconnectServices();
        process.exit(0);
    }
};

main();
