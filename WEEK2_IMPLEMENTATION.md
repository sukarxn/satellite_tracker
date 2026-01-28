# Week 2 Implementation: Real-time Data Pipeline

## Overview

Week 2 focuses on building the real-time satellite position calculation and streaming infrastructure. This includes:

- **SGP4 Integration** - Satellite position propagation from TLE data
- **Redis Caching** - High-performance position caching layer
- **Position Worker** - Batch processing engine for satellite calculations
- **WebSocket Server** - Real-time streaming to clients
- **Background Jobs** - Automated TLE updates and data cleanup

## Architecture

```
┌─────────────────┐
│   Database      │
│   (PostgreSQL)  │
└────────┬────────┘
         │
         │ Fetch TLEs
         ▼
┌─────────────────┐      Calculate      ┌─────────────────┐
│ Position Worker │ ──────Positions───► │  Redis Cache    │
│  (SGP4 Engine)  │                     │  (5s TTL)       │
└─────────────────┘                     └────────┬────────┘
                                                 │
                                                 │ Read Positions
                                                 ▼
                                        ┌─────────────────┐
                                        │ WebSocket Server│
                                        │  (Socket.io)    │
                                        └────────┬────────┘
                                                 │
                                                 │ Broadcast
                                                 ▼
                                        ┌─────────────────┐
                                        │   Clients       │
                                        │ (Web/Mobile)    │
                                        └─────────────────┘
```

## Services Implemented

### 1. SGP4 Service (`src/services/sgp4Service.ts`)

Handles satellite orbital mechanics and position calculations.

**Key Functions:**
- `propagateTLE(tle, date)` - Propagate TLE to ECI coordinates
- `eciToGeodetic(eciCoords, date)` - Convert ECI to Lat/Lon/Alt
- `calculateSatellitePosition(noradId, tle, date)` - Complete position calculation
- `validateTLE(tle)` - Validate TLE checksums

**Example Usage:**
```typescript
import { calculateSatellitePosition } from './services/sgp4Service';

const position = calculateSatellitePosition(25544, {
    line1: "1 25544U 98067A   ...",
    line2: "2 25544  51.6416 ..."
});

console.log(position);
// {
//   noradId: 25544,
//   latitude: 42.1234,
//   longitude: -71.5678,
//   altitude: 408.5,
//   velocity: 7.66,
//   ...
// }
```

### 2. Cache Service (`src/services/cacheService.ts`)

Redis-based caching layer for satellite positions.

**Key Functions:**
- `setPosition(position)` - Cache single satellite position
- `getPosition(noradId)` - Retrieve cached position
- `setPositionsBatch(positions)` - Batch cache update (efficient)
- `getAllCachedPositions()` - Get all active positions
- `getCacheStats()` - Cache statistics

**Cache Schema:**
- Position keys: `sat:pos:{noradId}`
- Active satellites set: `sat:active`
- TTL: 5 seconds

### 3. Position Worker (`src/services/positionWorker.ts`)

Background worker that continuously calculates satellite positions.

**Configuration:**
```typescript
{
    updateInterval: 1000,  // 1 second
    batchSize: 100,        // Process 100 satellites at a time
    maxSatellites: 1000    // Limit for MVP
}
```

**Functions:**
- `startWorker()` - Start the calculation loop
- `stopWorker()` - Stop the worker
- `getWorkerStatus()` - Get worker statistics
- `fetchActiveTLEs(limit)` - Fetch satellites from database

**Performance:**
- Processes 500+ satellites in ~500-1000ms
- Automatic batching for efficiency
- Error tracking and logging

### 4. WebSocket Service (`src/services/websocketService.ts`)

Real-time streaming server using Socket.io.

**Room Types:**
- `all` - All satellites (default subscription)
- `category:X` - Satellites in category X
- `sat:Y` - Specific satellite with NORAD ID Y

**Client Events:**
```typescript
// Subscribe to a room
socket.emit('subscribe', { room: 'sat:25544', type: 'sat' });

// Unsubscribe from a room
socket.emit('unsubscribe', { room: 'all' });

// Request specific satellite position
socket.emit('getSatellitePosition', { noradId: 25544 });
```

**Server Events:**
```typescript
// Connection confirmation
socket.on('connected', (data) => { ... });

// Subscription confirmation
socket.on('subscribed', (data) => { ... });

// Position updates (broadcast every 1 second)
socket.on('positionUpdate', (data) => {
    // data.positions = array of satellite positions
});

// Individual satellite position
socket.on('satellitePosition', (position) => { ... });
```

### 5. Cron Service (`src/services/cronService.ts`)

Automated background jobs for maintenance.

**Jobs:**
1. **TLE Update** - Daily at 3:00 AM UTC
   - Fetches latest TLE data from CelesTrak
   - Updates database
   - Clears position cache

2. **Data Cleanup** - Daily at 4:00 AM UTC
   - Removes TLE records older than 30 days
   - Keeps database lean

**Manual Triggers:**
```typescript
import { triggerTLEUpdate, triggerDataCleanup } from './services/cronService';

// Manually trigger TLE update
await triggerTLEUpdate();

// Manually trigger cleanup
await triggerDataCleanup();
```

## API Endpoints

### System Status
```
GET /api/v1/status
```

Returns comprehensive system status including:
- Database connection
- Redis connection
- WebSocket statistics
- Worker status
- Job statistics

**Response:**
```json
{
    "status": "ok",
    "timestamp": "2026-01-28T10:00:00.000Z",
    "services": {
        "database": "connected",
        "redis": "connected",
        "websocket": {
            "connectedClients": 5,
            "isRunning": true,
            "broadcastInterval": 1000
        },
        "worker": {
            "isRunning": true,
            "lastUpdateTime": "2026-01-28T10:00:00.000Z",
            "processedCount": 847,
            "errorCount": 0
        },
        "jobs": {
            "tleUpdate": {
                "lastRun": "2026-01-28T03:00:00.000Z",
                "lastStatus": "success",
                "runCount": 5
            }
        }
    }
}
```

## Testing

### 1. WebSocket Test Client

Run the test client to verify WebSocket functionality:

```bash
npm run test-ws
```

This will:
- Connect to the WebSocket server
- Subscribe to various rooms
- Display position updates
- Test individual satellite requests

### 2. Manual Testing

#### Check System Status
```bash
curl http://localhost:3000/api/v1/status
```

#### Check Health
```bash
curl http://localhost:3000/health
```

#### Trigger TLE Update
```bash
npm run update-tle
```

## Performance Benchmarks

### Position Calculation
- **500 satellites**: ~500-800ms
- **1000 satellites**: ~1000-1500ms
- **Per satellite**: ~1-2ms

### Redis Cache
- **Write (single)**: <1ms
- **Write (batch 100)**: ~5-10ms
- **Read (single)**: <1ms
- **Read (batch 100)**: ~5-10ms

### WebSocket
- **Broadcast to 100 clients**: ~10-20ms
- **Message size**: ~200-500 bytes per satellite

## Configuration

### Environment Variables

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/satellite_tracker"
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="*"
```

### Worker Configuration

Modify in `src/services/positionWorker.ts`:

```typescript
const WORKER_CONFIG = {
    updateInterval: 1000,  // Update frequency (ms)
    batchSize: 100,        // Satellites per batch
    maxSatellites: 1000    // Maximum satellites to track
};
```

### Cache TTL

Modify in `src/services/cacheService.ts`:

```typescript
const POSITION_TTL = 5; // seconds
```

## Troubleshooting

### Worker Not Processing Satellites

**Issue**: Worker shows 0 processed satellites

**Solution**:
1. Check if TLE data exists in database: `npm run update-tle`
2. Verify Redis connection: `curl http://localhost:3000/health`
3. Check worker logs for errors

### WebSocket Not Receiving Updates

**Issue**: Client connected but no position updates

**Solution**:
1. Verify worker is running: `GET /api/v1/status`
2. Check Redis cache has data
3. Ensure client is subscribed to a room
4. Check server logs for broadcast errors

### High Memory Usage

**Issue**: Server memory increasing over time

**Solution**:
1. Reduce `maxSatellites` in worker config
2. Decrease cache TTL
3. Implement position data cleanup
4. Monitor with: `GET /api/v1/status`

## Next Steps (Week 3)

- [ ] Frontend 3D visualization with Cesium.js
- [ ] Globe component
- [ ] Satellite rendering
- [ ] Orbital path visualization
- [ ] User interaction and controls

## Resources

- [satellite.js Documentation](https://github.com/shashwatak/satellite-js)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Redis Documentation](https://redis.io/docs/)
- [SGP4 Algorithm](https://en.wikipedia.org/wiki/Simplified_perturbations_models)
- [TLE Format](https://en.wikipedia.org/wiki/Two-line_element_set)

## Completed Tasks ✓

- [x] Install `satellite.js`
- [x] Implement propagation function: `TLE + Time -> ECI Coordinates`
- [x] Implement coordinate transform: `ECI -> ECEF -> Geodetic`
- [x] Implement velocity vector calculation
- [x] Install and configure Redis client
- [x] Design cache key schema
- [x] Implement `setPos` and `getPos` helper functions
- [x] Implement cache expiration policies (TTL ~5s)
- [x] Create Worker process for calculations
- [x] Implement batch processing loop
- [x] Connect Worker to Database
- [x] Connect Worker to Redis
- [x] Benchmark calculation speed for 500+ satellites
- [x] Set up Socket.io server
- [x] Implement connection handler
- [x] Implement room logic (join `all`, `category:X`, `sat:Y`)
- [x] Create broadcast loop (read Redis -> emit to rooms)
- [x] Test WebSocket connection with client script
- [x] Set up Cron job for Daily TLE updates (3 AM UTC)
- [x] Set up Cron job for old data cleanup
- [x] Verify jobs run at expected intervals
