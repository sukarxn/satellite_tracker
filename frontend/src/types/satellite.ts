// Satellite position data from WebSocket
export interface SatellitePosition {
    noradId: number;
    name: string;
    latitude: number;
    longitude: number;
    altitude: number; // km
    velocity: number; // km/s
    timestamp: string;
}

// Satellite metadata from API
export interface Satellite {
    id: number;
    noradId: number;
    name: string;
    intlDesignator: string | null;
    category: string;
    launchYear: number | null;
    country: string | null;
    owner: string | null;
    createdAt: string;
    updatedAt: string;
}

// TLE data
export interface TLEData {
    id: number;
    satelliteId: number;
    line1: string;
    line2: string;
    epoch: string;
    createdAt: string;
}

// Satellite with position
export interface SatelliteWithPosition extends Satellite {
    position?: SatellitePosition;
}

// WebSocket events
export type WebSocketEvent =
    | { type: 'position'; data: SatellitePosition }
    | { type: 'positions'; data: SatellitePosition[] }
    | { type: 'error'; message: string };

// API Response types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Search parameters
export interface SearchParams {
    query?: string;
    category?: string;
    page?: number;
    limit?: number;
}

// Category
export interface Category {
    name: string;
    count: number;
}
