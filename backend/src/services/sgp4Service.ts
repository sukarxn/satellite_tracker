import * as satellite from 'satellite.js';

/**
 * Interface for TLE data
 */
export interface TLEData {
    line1: string;
    line2: string;
}

/**
 * Interface for ECI (Earth-Centered Inertial) coordinates
 */
export interface ECICoordinates {
    x: number;
    y: number;
    z: number;
}

/**
 * Interface for Geodetic coordinates (Lat/Lon/Alt)
 */
export interface GeodeticCoordinates {
    latitude: number;  // degrees
    longitude: number; // degrees
    altitude: number;  // kilometers
}

/**
 * Interface for velocity vector
 */
export interface VelocityVector {
    x: number; // km/s
    y: number; // km/s
    z: number; // km/s
    speed: number; // km/s (magnitude)
}

/**
 * Complete satellite position data
 */
export interface SatellitePosition {
    noradId: number;
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    velocityVector: VelocityVector;
}

/**
 * Propagate satellite position from TLE data at a given time
 * TLE + Time -> ECI Coordinates
 * 
 * @param tle - Two-line element set
 * @param date - Date/time for propagation (defaults to now)
 * @returns ECI position and velocity, or null if propagation fails
 */
export const propagateTLE = (
    tle: TLEData,
    date: Date = new Date()
): { position: ECICoordinates; velocity: VelocityVector } | null => {
    try {
        // Initialize satellite record from TLE
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        // Propagate to given time
        const positionAndVelocity = satellite.propagate(satrec, date);

        // Check for errors - propagate can return an error object
        if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || typeof positionAndVelocity.velocity === 'boolean') {
            console.error('SGP4 propagation error');
            return null;
        }

        const eciPos = positionAndVelocity.position;
        const eciVel = positionAndVelocity.velocity;

        // Calculate velocity magnitude (speed)
        const speed = Math.sqrt(
            eciVel.x * eciVel.x +
            eciVel.y * eciVel.y +
            eciVel.z * eciVel.z
        );

        return {
            position: {
                x: eciPos.x,
                y: eciPos.y,
                z: eciPos.z
            },
            velocity: {
                x: eciVel.x,
                y: eciVel.y,
                z: eciVel.z,
                speed
            }
        };
    } catch (error) {
        console.error('Error in propagateTLE:', error);
        return null;
    }
};

/**
 * Convert ECI coordinates to Geodetic (Lat/Lon/Alt)
 * ECI -> ECEF -> Geodetic
 * 
 * @param eciCoords - ECI coordinates
 * @param date - Date/time for GMST calculation
 * @returns Geodetic coordinates
 */
export const eciToGeodetic = (
    eciCoords: ECICoordinates,
    date: Date = new Date()
): GeodeticCoordinates => {
    // Convert ECI to ECEF using Greenwich Mean Sidereal Time (GMST)
    const gmst = satellite.gstime(date);

    const ecef = {
        x: eciCoords.x,
        y: eciCoords.y,
        z: eciCoords.z
    };

    // Convert ECEF to Geodetic (Lat/Lon/Alt)
    const geodetic = satellite.eciToGeodetic(ecef, gmst);

    return {
        latitude: satellite.degreesLat(geodetic.latitude),
        longitude: satellite.degreesLong(geodetic.longitude),
        altitude: geodetic.height // in kilometers
    };
};

/**
 * Calculate complete satellite position including geodetic coordinates and velocity
 * 
 * @param noradId - NORAD catalog ID
 * @param tle - Two-line element set
 * @param date - Date/time for calculation (defaults to now)
 * @returns Complete satellite position data or null if calculation fails
 */
export const calculateSatellitePosition = (
    noradId: number,
    tle: TLEData,
    date: Date = new Date()
): SatellitePosition | null => {
    try {
        // Propagate TLE to get ECI position and velocity
        const propagated = propagateTLE(tle, date);

        if (!propagated) {
            return null;
        }

        // Convert ECI to Geodetic coordinates
        const geodetic = eciToGeodetic(propagated.position, date);

        return {
            noradId,
            timestamp: date,
            latitude: geodetic.latitude,
            longitude: geodetic.longitude,
            altitude: geodetic.altitude,
            velocity: propagated.velocity.speed,
            velocityVector: propagated.velocity
        };
    } catch (error) {
        console.error(`Error calculating position for NORAD ${noradId}:`, error);
        return null;
    }
};

/**
 * Calculate satellite path for a given duration
 * 
 * @param noradId - NORAD catalog ID
 * @param tle - Two-line element set
 * @param startTime - Start time for calculation (defaults to now)
 * @param durationMinutes - Duration of the path in minutes (defaults to 90)
 * @param stepMinutes - Time step between points in minutes (defaults to 1)
 * @returns Array of satellite positions or empty array if calculation fails
 */
export const calculateSatellitePath = (
    noradId: number,
    tle: TLEData,
    startTime: Date = new Date(),
    durationMinutes: number = 90,
    stepMinutes: number = 1
): SatellitePosition[] => {
    const path: SatellitePosition[] = [];
    const totalSteps = Math.ceil(durationMinutes / stepMinutes);

    for (let i = 0; i <= totalSteps; i++) {
        const timeOffset = i * stepMinutes * 60 * 1000;
        const currentTime = new Date(startTime.getTime() + timeOffset);

        const position = calculateSatellitePosition(noradId, tle, currentTime);
        if (position) {
            path.push(position);
        }
    }

    return path;
};

/**
 * Validate TLE checksum
 * Each line of a TLE has a checksum as the last character
 * 
 * @param line - TLE line to validate
 * @returns true if checksum is valid
 */
export const validateTLEChecksum = (line: string): boolean => {
    if (line.length < 69) return false;

    let checksum = 0;
    for (let i = 0; i < 68; i++) {
        const char = line[i];
        if (char >= '0' && char <= '9') {
            checksum += parseInt(char, 10);
        } else if (char === '-') {
            checksum += 1;
        }
    }

    const expectedChecksum = parseInt(line[68], 10);
    return (checksum % 10) === expectedChecksum;
};

/**
 * Validate complete TLE set
 * 
 * @param tle - TLE data to validate
 * @returns true if both lines are valid
 */
export const validateTLE = (tle: TLEData): boolean => {
    return validateTLEChecksum(tle.line1) && validateTLEChecksum(tle.line2);
};
