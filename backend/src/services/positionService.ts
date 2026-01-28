import { SatellitePosition, calculateSatellitePosition, TLEData } from './sgp4Service';

export class SatelliteService {
    private static instance: SatelliteService;
    private positions: Map<number, SatellitePosition & { name: string }> = new Map();
    private history: Map<number, SatellitePosition[]> = new Map();
    private tles: Map<number, string> = new Map();
    private maxHistory = 100;

    private constructor() { }

    static getInstance(): SatelliteService {
        if (!SatelliteService.instance) {
            SatelliteService.instance = new SatelliteService();
        }
        return SatelliteService.instance;
    }

    updatePosition(noradId: number, name: string, position: SatellitePosition, tle?: string) {
        this.positions.set(noradId, { ...position, name });
        if (tle) {
            this.tles.set(noradId, tle);
        }

        const history = this.history.get(noradId) || [];
        history.push(position);
        if (history.length > this.maxHistory) {
            history.shift();
        }
        this.history.set(noradId, history);
    }

    getAllPositions() {
        return Array.from(this.positions.values());
    }

    getSatellitePath(noradId: number): SatellitePosition[] {
        const tle = this.tles.get(noradId);
        if (tle) {
            return this.getPredictedPath(noradId, tle);
        }
        return this.history.get(noradId) || [];
    }

    getPredictedPath(noradId: number, tle: string, minutesForward: number = 95): SatellitePosition[] {
        const path: SatellitePosition[] = [];
        const now = new Date();
        const lines = tle.split('\n');
        if (lines.length < 2) return [];

        const tleData: TLEData = {
            line1: lines[0].trim(),
            line2: lines[1].trim()
        };

        // Calculate position every 2 minutes for a full orbit
        for (let i = 0; i <= minutesForward; i += 2) {
            const date = new Date(now.getTime() + i * 60000);
            try {
                const pos = calculateSatellitePosition(noradId, tleData, date);
                if (pos) {
                    path.push(pos);
                }
            } catch (err) {
                // Skip
            }
        }
        return path;
    }
}
