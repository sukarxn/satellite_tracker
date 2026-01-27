import axios from 'axios';
import { prisma } from '../config/database';

const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';

export const fetchTLEs = async () => {
    try {
        const response = await axios.get(CELESTRAK_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching TLEs:', error);
        throw error;
    }
};

export const parseTLEData = (rawData: string) => {
    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const satellites = [];

    // Actually standard TLE files from CelesTrak have:
    // NAME
    // LINE 1
    // LINE 2

    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 >= lines.length) break;

        const name = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];

        satellites.push({ name, line1, line2 });
    }

    return satellites;
};

export const updateSatellites = async () => {
    console.log('Fetching TLE data...');
    const rawData = await fetchTLEs();
    const parsedData = parseTLEData(rawData as string);

    console.log(`Parsed ${parsedData.length} satellites.`);

    // Batch upsert functionality
    // This can be heavy, so we might want to process in chunks
    // For MVP, we'll try to process all or a subset

    let count = 0;
    for (const sat of parsedData) {
        // Parse NORAD ID from Line 2 (Columns 3-7, 0-indexed: 2..7)
        // Standard TLE: 1 NNNNNU ... / 2 NNNNN ...
        // So line2[2..7] (inclusive start, exclusive end)
        const noradIdStr = sat.line2.substring(2, 7).trim();
        const noradId = parseInt(noradIdStr, 10);

        if (isNaN(noradId)) {
            console.warn(`Skipping invalid NORAD ID: ${noradIdStr} for ${sat.name}`);
            continue;
        }

        // Extract launch year and other metadata if needed, but for now just ID

        try {
            // Upsert Satellite
            await prisma.satellite.upsert({
                where: { noradId },
                update: {
                    name: sat.name,
                    tles: {
                        create: {
                            line1: sat.line1,
                            line2: sat.line2
                        }
                    }
                },
                create: {
                    noradId,
                    name: sat.name,
                    tles: {
                        create: {
                            line1: sat.line1,
                            line2: sat.line2
                        }
                    }
                }
            });
            count++;
        } catch (err) {
            console.error(`Failed to update satellite ${noradId}:`, err);
        }
    }

    console.log(`Updated ${count} satellites.`);
};
