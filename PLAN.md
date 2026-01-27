# Real-Time Satellite Tracking Software - Development Plan

**Project:** Full-Stack Live Satellite Tracker  
**Version:** 1.0  
**Date:** January 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features & Components](#core-features--components)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Database Design](#database-design)
7. [Performance Considerations](#performance-considerations)
8. [Data Sources & APIs](#data-sources--apis)
9. [Deployment Architecture](#deployment-architecture)
10. [Development Timeline](#development-timeline)
11. [Key Challenges & Solutions](#key-challenges--solutions)
12. [Success Metrics](#success-metrics)
13. [Risk Assessment](#risk-assessment)
14. [Team Structure](#team-structure)

---

## Executive Summary

### Project Overview

Development of a real-time satellite tracking web application featuring:
- Interactive 3D Earth globe visualization
- Live tracking of 500+ satellites with sub-second updates
- Orbital path visualization and predictions
- WebSocket-based real-time data streaming
- Responsive design for desktop and mobile devices

### Business Objectives

- Provide accessible, accurate satellite tracking for education and research
- Deliver real-time performance with minimal latency
- Support scalability for thousands of concurrent users
- Establish foundation for future commercial features

### Technical Goals

- **Performance**: <100ms position update latency
- **Scalability**: Support 1000+ concurrent users
- **Accuracy**: Position accuracy within 1km using SGP4 propagation
- **Availability**: 99.9% uptime
- **Responsiveness**: 30+ FPS rendering on modern devices

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │          │
│  │   Browser    │  │   Browser    │  │   Browser    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    HTTPS/WSS over TLS
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                   CDN / Load Balancer                            │
│                        (Nginx/CloudFlare)                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────┐  ┌────────▼────────┐  ┌────▼──────────┐
│  Static Assets │  │   API Server    │  │  WebSocket    │
│   (React App)  │  │  (Express/Fast  │  │    Server     │
│                │  │      API)       │  │  (Socket.io)  │
└────────────────┘  └────────┬────────┘  └────┬──────────┘
                             │                │
          ┌──────────────────┼────────────────┘
          │                  │
┌─────────▼──────┐  ┌────────▼────────┐
│ Redis Cache    │  │   PostgreSQL    │
│ (Sub-second    │  │   + PostGIS     │
│  position      │  │ (TLE & Metadata)│
│   caching)     │  │                 │
└────────────────┘  └─────────────────┘
          │
┌─────────▼──────────────────┐
│   Background Services      │
│  ┌──────────────────────┐  │
│  │  TLE Update Service  │  │
│  │  (Scheduled Tasks)   │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Position Calculation │  │
│  │      Service         │  │
│  └──────────────────────┘  │
└────────────────────────────┘
          │
┌─────────▼──────────────────┐
│   External Data Sources    │
│  - CelesTrak (TLE Data)    │
│  - Space-Track.org         │
│  - N2YO API (Backup)       │
└────────────────────────────┘
```

### Component Architecture

#### Frontend Components

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Search
│   │   └── UserMenu
│   ├── Sidebar
│   │   ├── SatelliteList
│   │   │   ├── CategoryFilter
│   │   │   ├── SearchBox
│   │   │   └── SatelliteItem[]
│   │   └── SatelliteInfo
│   │       ├── OrbitalParameters
│   │       ├── PositionData
│   │       └── Metadata
│   └── MainView
│       ├── Globe3D
│       │   ├── EarthSphere
│       │   ├── SatelliteMarkers
│       │   ├── OrbitalPaths
│       │   └── Controls
│       └── ControlPanel
│           ├── TimeControls
│           ├── ViewControls
│           └── DisplayOptions
└── Services
    ├── WebSocketService
    ├── APIService
    ├── StateManager
    └── CalculationWorker
```

#### Backend Services

```
Backend Application
├── API Layer
│   ├── REST Controllers
│   │   ├── SatelliteController
│   │   ├── CategoryController
│   │   ├── ObserverController
│   │   └── HealthController
│   └── Middleware
│       ├── Authentication
│       ├── RateLimiting
│       ├── CORS
│       └── ErrorHandler
├── WebSocket Layer
│   ├── Connection Manager
│   ├── Room Manager (by satellite)
│   ├── Broadcast Service
│   └── Event Handlers
├── Business Logic
│   ├── Propagation Service
│   │   └── SGP4 Calculator
│   ├── TLE Service
│   │   ├── Fetcher
│   │   ├── Parser
│   │   └── Validator
│   ├── Position Service
│   │   ├── Batch Calculator
│   │   └── Cache Manager
│   └── Prediction Service
│       ├── Pass Predictor
│       └── Visibility Calculator
├── Data Layer
│   ├── Repositories
│   │   ├── SatelliteRepository
│   │   ├── TLERepository
│   │   └── ObservationRepository
│   └── Cache Layer (Redis)
└── Background Jobs
    ├── TLE Update Job (Daily)
    ├── Position Update Job (1-5s)
    └── Cleanup Job (Weekly)
```

---

## Technology Stack

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | React | 18+ | UI framework |
| **Language** | TypeScript | 5+ | Type safety |
| **3D Engine** | Cesium.js | 1.110+ | Primary choice for geospatial viz |
| **3D Engine Alt** | Three.js | r160+ | Alternative for custom globe |
| **State Management** | Zustand | 4+ | Lightweight state management |
| **WebSocket Client** | Socket.io-client | 4+ | Real-time communication |
| **HTTP Client** | Axios | 1.6+ | API requests |
| **UI Components** | shadcn/ui | Latest | Component library |
| **Styling** | TailwindCSS | 3+ | Utility-first CSS |
| **Build Tool** | Vite | 5+ | Fast build tool |
| **Testing** | Vitest + RTL | Latest | Unit & component testing |

**Key Frontend Libraries:**
- `satellite.js` - Client-side orbital calculations
- `date-fns` - Date manipulation
- `react-query` - Server state management
- `zod` - Schema validation

### Backend Technologies

#### Option A: Node.js Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | Server runtime |
| **Framework** | Express.js | 4+ | Web framework |
| **Language** | TypeScript | 5+ | Type safety |
| **WebSocket** | Socket.io | 4+ | Real-time communication |
| **ORM** | Prisma | 5+ | Database ORM |
| **Validation** | Zod | 3+ | Schema validation |
| **Job Queue** | Bull | 4+ | Background jobs |
| **Testing** | Jest | 29+ | Unit testing |

**Key Libraries:**
- `satellite.js` - SGP4 propagation
- `node-cron` - Scheduled tasks
- `ioredis` - Redis client
- `winston` - Logging

#### Option B: Python Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | FastAPI | 0.109+ | Web framework |
| **Language** | Python | 3.11+ | Server language |
| **WebSocket** | python-socketio | 5+ | Real-time communication |
| **ORM** | SQLAlchemy | 2+ | Database ORM |
| **Validation** | Pydantic | 2+ | Data validation |
| **Job Queue** | Celery | 5+ | Background jobs |
| **Testing** | pytest | 7+ | Unit testing |

**Key Libraries:**
- `skyfield` or `pyorbital` - Orbital calculations
- `APScheduler` - Scheduled tasks
- `redis-py` - Redis client
- `loguru` - Logging

### Database & Infrastructure

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Database** | PostgreSQL | 14+ | Primary database |
| **Extension** | PostGIS | 3+ | Geospatial queries |
| **Cache** | Redis | 7+ | Position caching |
| **Message Queue** | Redis | 7+ | Job queue backend |
| **Reverse Proxy** | Nginx | 1.24+ | Load balancing, SSL |
| **Container** | Docker | 24+ | Containerization |
| **Orchestration** | Docker Compose | 2.23+ | Local development |
| **Orchestration** | Kubernetes | 1.28+ | Production (optional) |

### DevOps & Monitoring

| Component | Technology | Purpose |
|-----------|------------|---------|
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Monitoring** | Prometheus | Metrics collection |
| **Visualization** | Grafana | Metrics dashboard |
| **Logging** | Loki + Promtail | Log aggregation |
| **Tracing** | Jaeger | Distributed tracing |
| **Error Tracking** | Sentry | Error monitoring |
| **Uptime** | UptimeRobot | Availability monitoring |

### Recommended Stack Decision

**For Rapid Development & JavaScript Consistency:**
- Frontend: React + TypeScript + Cesium.js
- Backend: Node.js + Express + TypeScript
- Shared: `satellite.js` library for consistency

**For Performance & Scientific Accuracy:**
- Frontend: React + TypeScript + Cesium.js
- Backend: Python + FastAPI
- Use `skyfield` for high-precision calculations

---

## Core Features & Components

### Phase 1: MVP (Weeks 1-6)

#### Week 1-2: Backend Foundation

**Deliverables:**
- Project repository setup with monorepo structure
- Database schema design and migrations
- TLE data fetching service from CelesTrak
- Basic REST API endpoints
- Docker development environment

**Tasks:**
1. Initialize Git repository with proper `.gitignore`
2. Set up monorepo structure (Nx, Turborepo, or manual)
3. Configure PostgreSQL with PostGIS extension
4. Design database schema (satellites, TLE data, observations)
5. Create migration scripts
6. Implement TLE fetcher service
   - HTTP client for CelesTrak API
   - TLE parser (line 1 & 2 format)
   - Data validation
   - Database insertion logic
7. Build REST API endpoints:
   ```
   GET  /api/v1/satellites
   GET  /api/v1/satellites/:noradId
   GET  /api/v1/satellites/:noradId/position
   GET  /api/v1/categories
   POST /api/v1/satellites/search
   ```
8. Implement error handling and logging
9. Write unit tests for core functions
10. Create Docker Compose for local development

**Technical Details:**

TLE Data Model:
```typescript
interface TLEData {
  satelliteId: number;
  line1: string;
  line2: string;
  epoch: Date;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raOfAscNode: number;
  argOfPerigee: number;
  meanAnomaly: number;
  fetchedAt: Date;
}
```

API Response Format:
```json
{
  "success": true,
  "data": {
    "satellites": [
      {
        "noradId": "25544",
        "name": "ISS (ZARYA)",
        "intlDesignator": "1998-067A",
        "category": "Space Stations",
        "launchDate": "1998-11-20",
        "country": "ISS",
        "active": true
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  },
  "timestamp": "2026-01-27T12:00:00Z"
}
```

#### Week 2-3: Real-time Data Pipeline

**Deliverables:**
- SGP4 propagation engine
- WebSocket server implementation
- Redis caching layer
- Position calculation service
- Scheduled TLE update jobs

**Tasks:**
1. Integrate SGP4 library (satellite.js or skyfield)
2. Implement orbital propagation functions
   - Convert TLE to orbital elements
   - Calculate satellite position (ECI coordinates)
   - Transform ECI to ECEF to Lat/Lon/Alt
   - Calculate velocity vector
3. Set up Redis for caching
   - Design cache key structure
   - Implement cache invalidation strategy
4. Build WebSocket server with Socket.io
   - Connection handling
   - Room/namespace management
   - Authentication (optional for MVP)
5. Create position calculation service
   - Batch processing for multiple satellites
   - Configurable update interval (1-5 seconds)
   - Error handling for invalid TLE data
6. Implement background job scheduler
   - Daily TLE update job
   - Position recalculation job
   - Old data cleanup job
7. Design WebSocket event protocol
8. Performance testing and optimization
9. Integration testing

**Position Calculation Flow:**
```
1. Scheduled Job Triggers (every 1-5 seconds)
   ↓
2. Fetch Active Satellites from Database
   ↓
3. Retrieve Latest TLE Data from Cache/DB
   ↓
4. Calculate Current Time (UTC)
   ↓
5. For Each Satellite:
   a. Run SGP4 Propagation
   b. Convert Coordinates (ECI → ECEF → Geodetic)
   c. Calculate Additional Parameters (velocity, azimuth, etc.)
   ↓
6. Cache Results in Redis (5-second TTL)
   ↓
7. Broadcast to WebSocket Clients
   ↓
8. Log Metrics (calculation time, errors)
```

**WebSocket Event Protocol:**

Client Events:
```typescript
// Subscribe to all satellites
socket.emit('subscribe:all');

// Subscribe to specific satellites
socket.emit('subscribe:satellites', {
  noradIds: ['25544', '43947']
});

// Subscribe to category
socket.emit('subscribe:category', {
  category: 'Space Stations'
});

// Unsubscribe
socket.emit('unsubscribe');

// Track specific satellite (highlight)
socket.emit('track:satellite', {
  noradId: '25544'
});
```

Server Events:
```typescript
// Position update
socket.on('position:update', (data) => {
  // data: { satellites: SatellitePosition[] }
});

// TLE updated
socket.on('tle:updated', (data) => {
  // data: { noradIds: string[] }
});

// Error
socket.on('error', (error) => {
  // error: { code: string, message: string }
});

// Connection acknowledged
socket.on('connected', (data) => {
  // data: { clientId: string, timestamp: string }
});
```

Position Update Format:
```typescript
interface SatellitePosition {
  noradId: string;
  name: string;
  timestamp: number; // Unix timestamp
  latitude: number;  // degrees
  longitude: number; // degrees
  altitude: number;  // kilometers
  velocity: number;  // km/s
  azimuth: number;   // degrees
  elevation: number; // degrees (from observer)
  eclipsed: boolean; // in Earth's shadow
}
```

#### Week 3-4: Frontend - 3D Visualization

**Deliverables:**
- React application with TypeScript
- Interactive 3D Earth globe
- Camera controls and interaction
- Satellite rendering system
- Orbital path visualization

**Tasks:**
1. Initialize React + Vite project
2. Configure TypeScript and ESLint
3. Set up TailwindCSS
4. Integrate Cesium.js or Three.js
5. Create Globe component
   - Earth sphere with texture
   - Atmosphere effect
   - Star background
   - Coordinate system setup
6. Implement camera controls
   - Orbit/pan/zoom
   - Mouse/touch interaction
   - Smooth transitions
7. Build satellite rendering
   - Point markers or 3D models
   - LOD (Level of Detail) system
   - Billboard sprites with labels
8. Create orbital path visualization
   - Calculate future positions
   - Draw orbital curves
   - Color coding by satellite type
9. Implement picking/selection
   - Raycast for satellite selection
   - Highlight selected satellite
   - Camera focus on satellite
10. Performance optimization
    - Frustum culling
    - Instance rendering
    - Texture atlases

**Globe Implementation (Cesium.js):**
```typescript
import { Viewer, Cartesian3, Color } from 'cesium';

const viewer = new Viewer('cesiumContainer', {
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  timeline: false,
  navigationHelpButton: false,
  animation: false,
  imageryProvider: new IonImageryProvider({ assetId: 3845 })
});

// Configure camera
viewer.camera.setView({
  destination: Cartesian3.fromDegrees(0, 0, 20000000),
  orientation: {
    heading: 0,
    pitch: -Math.PI / 2,
    roll: 0
  }
});
```

**Satellite Rendering:**
```typescript
interface SatelliteMarker {
  id: string;
  entity: Entity;
  position: Cartesian3;
  label: string;
  color: Color;
}

function addSatellite(satellite: SatellitePosition): SatelliteMarker {
  const position = Cartesian3.fromDegrees(
    satellite.longitude,
    satellite.latitude,
    satellite.altitude * 1000
  );
  
  const entity = viewer.entities.add({
    position: position,
    point: {
      pixelSize: 8,
      color: Color.CYAN,
      outlineColor: Color.WHITE,
      outlineWidth: 2
    },
    label: {
      text: satellite.name,
      font: '12px sans-serif',
      fillColor: Color.WHITE,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cartesian2(0, -15),
      show: false // Show on hover
    }
  });
  
  return { id: satellite.noradId, entity, position, ... };
}
```

#### Week 4-5: Frontend - UI & Integration

**Deliverables:**
- Satellite list sidebar
- Search and filter functionality
- Satellite information panel
- WebSocket integration
- State management
- Responsive design

**Tasks:**
1. Design UI/UX layout
2. Create component library
   - Header
   - Sidebar
   - SatelliteList
   - SatelliteCard
   - InfoPanel
   - ControlPanel
3. Implement search functionality
   - Debounced search input
   - Filter by name, NORAD ID
   - Category filtering
4. Build satellite information panel
   - Real-time position data
   - Orbital parameters
   - Launch information
   - Next pass predictions (basic)
5. Integrate WebSocket client
   - Connection management
   - Automatic reconnection
   - Event handling
   - Error handling
6. Implement state management (Zustand)
   - Satellite data store
   - UI state store
   - WebSocket connection store
7. Connect frontend to backend
   - REST API integration
   - WebSocket subscription
   - Data synchronization
8. Handle real-time updates
   - Update satellite positions
   - Smooth interpolation
   - Performance throttling
9. Responsive design
   - Mobile layout
   - Tablet layout
   - Desktop layout
10. Loading states and error handling

**State Management Structure:**
```typescript
// stores/satelliteStore.ts
interface SatelliteStore {
  satellites: Map<string, SatellitePosition>;
  selectedSatellite: string | null;
  trackedSatellite: string | null;
  categories: string[];
  filters: {
    search: string;
    category: string | null;
    active: boolean;
  };
  
  // Actions
  updatePosition: (position: SatellitePosition) => void;
  updatePositions: (positions: SatellitePosition[]) => void;
  selectSatellite: (noradId: string) => void;
  trackSatellite: (noradId: string) => void;
  setFilter: (key: string, value: any) => void;
}

// stores/wsStore.ts
interface WebSocketStore {
  connected: boolean;
  reconnecting: boolean;
  subscriptions: Set<string>;
  lastUpdate: number;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribe: (noradIds: string[]) => void;
  unsubscribe: () => void;
}
```

#### Week 5-6: Testing & Refinement

**Deliverables:**
- Unit tests for critical functions
- Integration tests
- Performance benchmarks
- Bug fixes and optimizations
- Documentation
- Deployment configuration

**Tasks:**
1. Write backend unit tests
   - TLE parsing
   - SGP4 calculations
   - API endpoints
   - WebSocket handlers
2. Write frontend unit tests
   - Components
   - Hooks
   - Utilities
   - State management
3. Integration testing
   - End-to-end user flows
   - WebSocket communication
   - Database operations
4. Performance testing
   - Load testing (Artillery, k6)
   - Frontend rendering benchmarks
   - Database query optimization
5. Security testing
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - CORS configuration
6. Bug fixes and refinements
7. Code review and refactoring
8. Documentation
   - API documentation
   - Code comments
   - Setup guides
   - Architecture diagrams
9. Deployment setup
   - Production Docker images
   - CI/CD pipelines
   - Environment configurations
10. MVP release preparation

### Phase 2: Enhanced Features (Weeks 7-16)

#### Advanced Visualization (Weeks 7-10)

**Features:**
1. **Satellite Footprint Visualization**
   - Calculate and display visibility cone
   - Ground coverage area
   - Signal strength visualization

2. **Ground Track Projection**
   - Historical ground track (past orbits)
   - Future ground track prediction
   - Color-coded by time

3. **Sun Position and Lighting**
   - Calculate sun position
   - Day/night terminator line
   - Dynamic Earth lighting
   - Satellite eclipse detection

4. **Enhanced Visual Effects**
   - Atmospheric glow
   - Lens flare for sun
   - Starfield background with constellations
   - Aurora visualization (bonus)

5. **Multiple View Modes**
   - 3D perspective view
   - 2D map projection
   - Split screen comparison
   - First-person satellite view

#### User Features (Weeks 11-14)

**Features:**
1. **Observer Location Input**
   - Geolocation API integration
   - Manual location entry
   - Save multiple locations
   - Calculate observer-relative data

2. **Pass Predictions**
   - Calculate visible passes
   - Filter by minimum elevation
   - Show pass trajectory
   - Pass alerts and notifications

3. **Satellite Comparison**
   - Compare multiple satellites side-by-side
   - Relative position visualization
   - Collision detection

4. **Constellation Grouping**
   - Group satellites by mission
   - Starlink constellation view
   - GPS constellation
   - Custom groups

5. **Historical Playback**
   - Time slider control
   - Playback speed control
   - Record and replay
   - Export animations

#### Performance Enhancements (Weeks 15-16)

**Optimizations:**
1. **Rendering Optimization**
   - Level-of-detail (LOD) system
   - Instanced rendering
   - Occlusion culling
   - Texture optimization

2. **Calculation Optimization**
   - WebWorkers for heavy computations
   - Calculation result caching
   - Predictive calculation
   - Batch processing

3. **Network Optimization**
   - Delta compression for updates
   - Binary protocol (MessagePack)
   - Selective subscription
   - Bandwidth monitoring

4. **Data Management**
   - Lazy loading
   - Progressive data loading
   - Index optimization
   - Query caching

### Phase 3: Advanced Features (Weeks 17+)

**Major Features:**
- User authentication and accounts
- Saved preferences and favorites
- Custom alerts and notifications
- Mobile applications (React Native)
- AR mode for mobile devices
- Social features (share passes)
- Premium features (detailed analytics)
- API for third-party developers

---

## Technical Implementation Details

### Satellite Position Calculation Algorithm

**SGP4 Propagation Steps:**

```
Input: TLE Data, Target Time (UTC)

1. Parse TLE
   - Extract orbital elements
   - Calculate epoch time
   - Validate checksum

2. Initialize SGP4 Propagator
   - Set gravitational constant
   - Initialize perturbation parameters
   - Calculate mean motion

3. Calculate Time Delta
   - Δt = Target Time - Epoch Time
   - Convert to minutes

4. Propagate Orbit
   - Apply secular effects
   - Apply periodic perturbations
   - Calculate position and velocity in ECI

5. Coordinate Transformation
   - ECI → ECEF (account for Earth rotation)
   - ECEF → Geodetic (lat, lon, alt)

6. Calculate Derived Parameters
   - Ground speed
   - Azimuth and elevation (from observer)
   - Sun angle (eclipse detection)
   - Footprint radius

Output: Satellite Position Object
```

**Implementation (TypeScript with satellite.js):**

```typescript
import * as satellite from 'satellite.js';

interface SatellitePosition {
  noradId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  azimuth: number;
  elevation: number;
  eclipsed: boolean;
}

function calculatePosition(
  tleLine1: string,
  tleLine2: string,
  time: Date
): SatellitePosition | null {
  try {
    // Parse TLE
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
    // Propagate to current time
    const positionAndVelocity = satellite.propagate(satrec, time);
    
    if (positionAndVelocity.position === false) {
      return null; // Propagation failed
    }
    
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
    
    // Calculate GMST for coordinate transformation
    const gmst = satellite.gstime(time);
    
    // Convert ECI to ECEF
    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    
    // Convert ECEF to Geodetic (lat, lon, alt)
    const positionGd = satellite.ecfToGeodetic(positionEcf);
    
    // Calculate velocity magnitude
    const velocity = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );
    
    // Eclipse detection (simplified)
    const eclipsed = isInEclipse(positionEci, time);
    
    return {
      noradId: satrec.satnum.toString(),
      timestamp: time.getTime(),
      latitude: satellite.degreesLat(positionGd.latitude),
      longitude: satellite.degreesLong(positionGd.longitude),
      altitude: positionGd.height,
      velocity: velocity,
      azimuth: 0, // Calculate from observer position
      elevation: 0, // Calculate from observer position
      eclipsed: eclipsed
    };
  } catch (error) {
    console.error('Position calculation error:', error);
    return null;
  }
}

function isInEclipse(positionEci: satellite.EciVec3<number>, time: Date): boolean {
  // Simplified eclipse detection
  // Calculate sun position
  const sunPosition = calculateSunPosition(time);
  
  // Calculate satellite position vector magnitude
  const satDistance = Math.sqrt(
    positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2
  );
  
  // Calculate angle between satellite and sun
  const dotProduct = 
    positionEci.x * sunPosition.x +
    positionEci.y * sunPosition.y +
    positionEci.z * sunPosition.z;
  
  const sunDistance = Math.sqrt(
    sunPosition.x ** 2 + sunPosition.y ** 2 + sunPosition.z ** 2
  );
  
  const angle = Math.acos(dotProduct / (satDistance * sunDistance));
  
  // Earth's shadow cone half-angle (simplified)
  const earthRadius = 6371; // km
  const shadowAngle = Math.asin(earthRadius / satDistance);
  
  return angle > (Math.PI - shadowAngle);
}

function calculateSunPosition(time: Date): satellite.EciVec3<number> {
  // Simplified sun position calculation
  // For production, use more accurate solar position algorithm
  const julianDate = (time.getTime() / 86400000) + 2440587.5;
  const n = julianDate - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda = L + 1.915 * Math.sin(g * Math.PI / 180);
  
  const AU = 149597870.7; // km
  const epsilon = 23.439 * Math.PI / 180;
  
  const x = AU * Math.cos(lambda * Math.PI / 180);
  const y = AU * Math.sin(lambda * Math.PI / 180) * Math.cos(epsilon);
  const z = AU * Math.sin(lambda * Math.PI / 180) * Math.sin(epsilon);
  
  return { x, y, z };
}
```

### Batch Position Calculation Service

```typescript
class PositionCalculationService {
  private tleCache: Map<string, { line1: string; line2: string }>;
  private updateInterval: number = 1000; // 1 second
  private timer: NodeJS.Timer | null = null;
  
  constructor(
    private satelliteRepository: SatelliteRepository,
    private redisClient: RedisClient,
    private wsServer: WebSocketServer
  ) {
    this.tleCache = new Map();
  }
  
  async start() {
    await this.loadTLECache();
    this.timer = setInterval(() => this.calculateAndBroadcast(), this.updateInterval);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  private async loadTLECache() {
    const satellites = await this.satelliteRepository.getActiveSatellites();
    for (const sat of satellites) {
      const tle = await this.satelliteRepository.getLatestTLE(sat.noradId);
      if (tle) {
        this.tleCache.set(sat.noradId, {
          line1: tle.line1,
          line2: tle.line2
        });
      }
    }
  }
  
  private async calculateAndBroadcast() {
    const startTime = Date.now();
    const currentTime = new Date();
    const positions: SatellitePosition[] = [];
    
    // Calculate positions for all satellites
    for (const [noradId, tle] of this.tleCache) {
      const position = calculatePosition(tle.line1, tle.line2, currentTime);
      if (position) {
        positions.push(position);
      }
    }
    
    // Cache results in Redis
    const cacheKey = `positions:${currentTime.getTime()}`;
    await this.redisClient.setex(
      cacheKey,
      5, // 5 second TTL
      JSON.stringify(positions)
    );
    
    // Broadcast to WebSocket clients
    this.wsServer.broadcast('position:update', {
      satellites: positions,
      timestamp: currentTime.getTime()
    });
    
    // Log performance
    const duration = Date.now() - startTime;
    console.log(`Calculated ${positions.length} positions in ${duration}ms`);
  }
}
```

### WebSocket Server Implementation

```typescript
import { Server } from 'socket.io';
import { Redis } from 'ioredis';

class SatelliteWebSocketServer {
  private io: Server;
  private redis: Redis;
  private subscriptions: Map<string, Set<string>>; // clientId -> Set<noradId>
  
  constructor(httpServer: any, redisClient: Redis) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });
    
    this.redis = redisClient;
    this.subscriptions = new Map();
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Initialize subscription set for this client
      this.subscriptions.set(socket.id, new Set());
      
      // Send connection acknowledgement
      socket.emit('connected', {
        clientId: socket.id,
        timestamp: new Date().toISOString()
      });
      
      // Subscribe to all satellites
      socket.on('subscribe:all', () => {
        console.log(`Client ${socket.id} subscribed to all satellites`);
        socket.join('all-satellites');
      });
      
      // Subscribe to specific satellites
      socket.on('subscribe:satellites', (data: { noradIds: string[] }) => {
        const clientSubs = this.subscriptions.get(socket.id);
        if (clientSubs) {
          data.noradIds.forEach(noradId => {
            clientSubs.add(noradId);
            socket.join(`satellite:${noradId}`);
          });
        }
        console.log(`Client ${socket.id} subscribed to ${data.noradIds.length} satellites`);
      });
      
      // Subscribe to category
      socket.on('subscribe:category', (data: { category: string }) => {
        socket.join(`category:${data.category}`);
        console.log(`Client ${socket.id} subscribed to category: ${data.category}`);
      });
      
      // Unsubscribe
      socket.on('unsubscribe', () => {
        const clientSubs = this.subscriptions.get(socket.id);
        if (clientSubs) {
          clientSubs.clear();
        }
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
        console.log(`Client ${socket.id} unsubscribed from all`);
      });
      
      // Track specific satellite
      socket.on('track:satellite', (data: { noradId: string }) => {
        socket.emit('tracking', { noradId: data.noradId });
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this.subscriptions.delete(socket.id);
        console.log(`Client disconnected: ${socket.id}`);
      });
      
      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }
  
  broadcast(event: string, data: any) {
    this.io.to('all-satellites').emit(event, data);
  }
  
  broadcastToSatellite(noradId: string, event: string, data: any) {
    this.io.to(`satellite:${noradId}`).emit(event, data);
  }
  
  broadcastToCategory(category: string, event: string, data: any) {
    this.io.to(`category:${category}`).emit(event, data);
  }
}
```

### TLE Update Service

```typescript
import axios from 'axios';
import * as cron from 'node-cron';

class TLEUpdateService {
  private celestrakUrl = 'https://celestrak.org/NORAD/elements/gp.php';
  
  constructor(
    private satelliteRepository: SatelliteRepository
  ) {}
  
  start() {
    // Run daily at 3 AM UTC
    cron.schedule('0 3 * * *', () => this.updateAllTLEs());
    
    // Run on startup
    this.updateAllTLEs();
  }
  
  private async updateAllTLEs() {
    console.log('Starting TLE update...');
    const startTime = Date.now();
    
    try {
      // Fetch TLEs by category
      const categories = [
        'stations',      // Space stations
        'starlink',      // Starlink
        'gps-ops',       // GPS
        'galileo',       // Galileo
        'beidou',        // BeiDou
        'active',        // Active satellites
        'analyst'        // Analyst satellites
      ];
      
      let totalUpdated = 0;
      
      for (const category of categories) {
        const count = await this.updateCategory(category);
        totalUpdated += count;
      }
      
      const duration = Date.now() - startTime;
      console.log(`TLE update complete: ${totalUpdated} satellites updated in ${duration}ms`);
    } catch (error) {
      console.error('TLE update failed:', error);
    }
  }
  
  private async updateCategory(category: string): Promise<number> {
    try {
      const response = await axios.get(this.celestrakUrl, {
        params: {
          GROUP: category,
          FORMAT: 'tle'
        }
      });
      
      const tleData = response.data;
      const lines = tleData.split('\n').filter((line: string) => line.trim());
      
      let count = 0;
      
      // Process TLE data in groups of 3 (name, line1, line2)
      for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 >= lines.length) break;
        
        const name = lines[i].trim();
        const line1 = lines[i + 1].trim();
        const line2 = lines[i + 2].trim();
        
        // Extract NORAD ID from line 1
        const noradId = line1.substring(2, 7).trim();
        
        // Validate TLE
        if (this.validateTLE(line1, line2)) {
          await this.satelliteRepository.updateTLE({
            noradId,
            name,
            line1,
            line2,
            category,
            fetchedAt: new Date()
          });
          count++;
        }
      }
      
      console.log(`Updated ${count} satellites in category: ${category}`);
      return count;
    } catch (error) {
      console.error(`Failed to update category ${category}:`, error);
      return 0;
    }
  }
  
  private validateTLE(line1: string, line2: string): boolean {
    // Basic validation
    if (line1.length !== 69 || line2.length !== 69) return false;
    if (line1[0] !== '1' || line2[0] !== '2') return false;
    
    // Validate checksums
    const checksum1 = this.calculateChecksum(line1);
    const checksum2 = this.calculateChecksum(line2);
    
    return (
      checksum1 === parseInt(line1[68]) &&
      checksum2 === parseInt(line2[68])
    );
  }
  
  private calculateChecksum(line: string): number {
    let sum = 0;
    for (let i = 0; i < 68; i++) {
      const char = line[i];
      if (char >= '0' && char <= '9') {
        sum += parseInt(char);
      } else if (char === '-') {
        sum += 1;
      }
    }
    return sum % 10;
  }
}
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────────┐
│     satellites      │
├─────────────────────┤
│ id (PK)             │
│ norad_id (UNIQUE)   │
│ name                │
│ intl_designator     │
│ category            │
│ launch_date         │
│ decay_date          │
│ country             │
│ active              │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐
│      tle_data       │
├─────────────────────┤
│ id (PK)             │
│ satellite_id (FK)   │
│ line1               │
│ line2               │
│ epoch               │
│ mean_motion         │
│ eccentricity        │
│ inclination         │
│ raan                │
│ arg_perigee         │
│ mean_anomaly        │
│ bstar               │
│ fetched_at          │
└─────────────────────┘

┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email (UNIQUE)      │
│ password_hash       │
│ name                │
│ created_at          │
│ last_login          │
└──────────┬──────────┘
           │
           │ 1:N
           │
┌──────────▼──────────┐
│   user_locations    │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ name                │
│ latitude            │
│ longitude           │
│ altitude            │
│ is_default          │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│   user_favorites    │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ satellite_id (FK)   │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│    observations     │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ satellite_id (FK)   │
│ location_id (FK)    │
│ observed_at         │
│ azimuth             │
│ elevation           │
│ magnitude           │
│ notes               │
│ photo_url           │
│ created_at          │
└─────────────────────┘
```

### Database Schema (PostgreSQL with PostGIS)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Satellites table
CREATE TABLE satellites (
  id SERIAL PRIMARY KEY,
  norad_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  intl_designator VARCHAR(20),
  category VARCHAR(100),
  launch_date DATE,
  decay_date DATE,
  country VARCHAR(100),
  rcs_size VARCHAR(20), -- Radar cross-section size
  launch_site VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for satellites
CREATE INDEX idx_satellites_norad_id ON satellites(norad_id);
CREATE INDEX idx_satellites_category ON satellites(category);
CREATE INDEX idx_satellites_active ON satellites(active);
CREATE INDEX idx_satellites_name ON satellites USING gin(to_tsvector('english', name));

-- TLE data table
CREATE TABLE tle_data (
  id SERIAL PRIMARY KEY,
  satellite_id INTEGER NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL,
  epoch TIMESTAMP NOT NULL,
  mean_motion DECIMAL(12, 8),
  eccentricity DECIMAL(10, 8),
  inclination DECIMAL(8, 4),
  raan DECIMAL(8, 4), -- Right Ascension of Ascending Node
  arg_perigee DECIMAL(8, 4),
  mean_anomaly DECIMAL(8, 4),
  bstar DECIMAL(12, 8),
  element_set_number INTEGER,
  classification CHAR(1),
  fetched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(satellite_id, epoch)
);

-- Indexes for TLE data
CREATE INDEX idx_tle_satellite_id ON tle_data(satellite_id);
CREATE INDEX idx_tle_epoch ON tle_data(epoch DESC);
CREATE INDEX idx_tle_satellite_epoch ON tle_data(satellite_id, epoch DESC);
CREATE INDEX idx_tle_fetched_at ON tle_data(fetched_at DESC);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);

-- User locations table
CREATE TABLE user_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  altitude DECIMAL(8, 2) DEFAULT 0, -- in meters
  timezone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add spatial index for locations
ALTER TABLE user_locations ADD COLUMN geom GEOGRAPHY(POINT, 4326);
UPDATE user_locations SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
CREATE INDEX idx_user_locations_geom ON user_locations USING GIST(geom);

-- Indexes for user locations
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_default ON user_locations(user_id, is_default);

-- User favorites table
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  satellite_id INTEGER NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, satellite_id)
);

-- Indexes for favorites
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_satellite_id ON user_favorites(satellite_id);

-- Observations table
CREATE TABLE observations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  satellite_id INTEGER NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES user_locations(id) ON DELETE SET NULL,
  observed_at TIMESTAMP NOT NULL,
  azimuth DECIMAL(6, 2), -- degrees
  elevation DECIMAL(5, 2), -- degrees
  magnitude DECIMAL(4, 2), -- visual magnitude
  notes TEXT,
  photo_url VARCHAR(500),
  weather_conditions VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for observations
CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_satellite_id ON observations(satellite_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at DESC);

-- Satellite passes table (for caching pass predictions)
CREATE TABLE satellite_passes (
  id SERIAL PRIMARY KEY,
  satellite_id INTEGER NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES user_locations(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  max_elevation_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  max_elevation DECIMAL(5, 2) NOT NULL,
  start_azimuth DECIMAL(6, 2),
  max_azimuth DECIMAL(6, 2),
  end_azimuth DECIMAL(6, 2),
  magnitude DECIMAL(4, 2),
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(satellite_id, location_id, start_time)
);

-- Indexes for passes
CREATE INDEX idx_passes_satellite_location ON satellite_passes(satellite_id, location_id);
CREATE INDEX idx_passes_start_time ON satellite_passes(start_time);
CREATE INDEX idx_passes_location_time ON satellite_passes(location_id, start_time);

-- System logs table
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL, -- INFO, WARN, ERROR
  service VARCHAR(100), -- TLE_UPDATE, POSITION_CALC, etc.
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for logs
CREATE INDEX idx_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_logs_level ON system_logs(level);
CREATE INDEX idx_logs_service ON system_logs(service);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_satellites_updated_at BEFORE UPDATE ON satellites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_locations_updated_at BEFORE UPDATE ON user_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Sample Queries

```sql
-- Get latest TLE for a satellite
SELECT t.* 
FROM tle_data t
JOIN satellites s ON s.id = t.satellite_id
WHERE s.norad_id = '25544'
ORDER BY t.epoch DESC
LIMIT 1;

-- Get all active satellites in a category
SELECT s.*, t.line1, t.line2
FROM satellites s
LEFT JOIN LATERAL (
  SELECT * FROM tle_data
  WHERE satellite_id = s.id
  ORDER BY epoch DESC
  LIMIT 1
) t ON true
WHERE s.active = true
  AND s.category = 'Space Stations';

-- Find satellites visible from a location (requires pass calculation)
SELECT sp.*, s.name
FROM satellite_passes sp
JOIN satellites s ON s.id = sp.satellite_id
WHERE sp.location_id = $1
  AND sp.start_time > NOW()
  AND sp.max_elevation > 30 -- above 30 degrees
ORDER BY sp.start_time
LIMIT 20;

-- Get user's favorite satellites with latest TLE
SELECT s.*, t.line1, t.line2, uf.created_at as favorited_at
FROM user_favorites uf
JOIN satellites s ON s.id = uf.satellite_id
LEFT JOIN LATERAL (
  SELECT * FROM tle_data
  WHERE satellite_id = s.id
  ORDER BY epoch DESC
  LIMIT 1
) t ON true
WHERE uf.user_id = $1
ORDER BY uf.created_at DESC;

-- Search satellites by name (full-text search)
SELECT s.*, 
  ts_rank(to_tsvector('english', s.name), query) as rank
FROM satellites s,
  to_tsquery('english', 'starlink') query
WHERE to_tsvector('english', s.name) @@ query
ORDER BY rank DESC
LIMIT 50;
```

---

## Performance Considerations

### Frontend Performance

#### Rendering Optimization

**1. Level of Detail (LOD) System**

```typescript
class SatelliteLODManager {
  private readonly LOD_LEVELS = {
    HIGH: { distance: 10000000, pointSize: 10, showLabel: true, showOrbit: true },
    MEDIUM: { distance: 30000000, pointSize: 6, showLabel: false, showOrbit: true },
    LOW: { distance: 50000000, pointSize: 3, showLabel: false, showOrbit: false }
  };
  
  updateLOD(satellite: SatelliteEntity, cameraDistance: number) {
    let lod = this.LOD_LEVELS.LOW;
    
    if (cameraDistance < this.LOD_LEVELS.HIGH.distance) {
      lod = this.LOD_LEVELS.HIGH;
    } else if (cameraDistance < this.LOD_LEVELS.MEDIUM.distance) {
      lod = this.LOD_LEVELS.MEDIUM;
    }
    
    satellite.point.pixelSize = lod.pointSize;
    satellite.label.show = lod.showLabel;
    satellite.path.show = lod.showOrbit;
  }
}
```

**2. Frustum Culling**

Only render satellites visible in the camera frustum.

**3. Instanced Rendering**

Use instanced rendering for satellites of the same type.

**4. Texture Atlases**

Combine multiple textures into a single atlas to reduce draw calls.

**5. Throttle Updates**

```typescript
const throttledUpdate = throttle((positions: SatellitePosition[]) => {
  updateSatellitePositions(positions);
}, 33); // ~30 FPS
```

#### Calculation Optimization

**1. WebWorkers for Heavy Computations**

```typescript
// worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;
  
  if (type === 'CALCULATE_POSITIONS') {
    const positions = calculatePositions(data.satellites, data.time);
    self.postMessage({ type: 'POSITIONS_CALCULATED', positions });
  }
};

// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url));

worker.postMessage({
  type: 'CALCULATE_POSITIONS',
  data: { satellites, time: Date.now() }
});

worker.onmessage = (e) => {
  if (e.data.type === 'POSITIONS_CALCULATED') {
    updateSatellites(e.data.positions);
  }
};
```

**2. Memoization**

Cache expensive calculations.

```typescript
const memoizedCalculation = useMemo(() => {
  return calculateOrbitalPath(satellite, duration);
}, [satellite.noradId, satellite.tle]);
```

#### Network Optimization

**1. WebSocket Compression**

Enable per-message deflate compression.

```typescript
const socket = io('ws://localhost:5000', {
  transports: ['websocket'],
  perMessageDeflate: true
});
```

**2. Delta Updates**

Send only changed data instead of full state.

```typescript
interface DeltaUpdate {
  noradId: string;
  changes: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    // ... only changed fields
  };
}
```

**3. Binary Protocol**

Use MessagePack or similar for smaller payloads.

```typescript
import msgpack from 'msgpack-lite';

// Server
const encoded = msgpack.encode(positions);
socket.emit('position:update', encoded);

// Client
socket.on('position:update', (data) => {
  const positions = msgpack.decode(data);
  updatePositions(positions);
});
```

### Backend Performance

#### Database Optimization

**1. Connection Pooling**

```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**2. Query Optimization**

Use prepared statements and indexes.

```sql
PREPARE get_latest_tle AS
SELECT * FROM tle_data 
WHERE satellite_id = $1 
ORDER BY epoch DESC 
LIMIT 1;

EXECUTE get_latest_tle(123);
```

**3. Batch Operations**

Update multiple records in a single query.

```typescript
async function batchUpdateTLEs(tles: TLEData[]) {
  const values = tles.map(tle => 
    `(${tle.satelliteId}, '${tle.line1}', '${tle.line2}', '${tle.epoch}')`
  ).join(',');
  
  await db.query(`
    INSERT INTO tle_data (satellite_id, line1, line2, epoch)
    VALUES ${values}
    ON CONFLICT (satellite_id, epoch) DO UPDATE
    SET line1 = EXCLUDED.line1, line2 = EXCLUDED.line2
  `);
}
```

#### Caching Strategy

**Redis Cache Layers:**

```
┌─────────────────────────────────────────────┐
│         Application Layer                   │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────▼─────────────┐
    │  L1: Position Cache       │
    │  TTL: 1-5 seconds         │
    │  Key: positions:{time}    │
    └─────────────┬─────────────┘
                  │ Miss
    ┌─────────────▼─────────────┐
    │  L2: TLE Cache            │
    │  TTL: 24 hours            │
    │  Key: tle:{noradId}       │
    └─────────────┬─────────────┘
                  │ Miss
    ┌─────────────▼─────────────┐
    │  PostgreSQL Database      │
    └───────────────────────────┘
```

**Implementation:**

```typescript
class CacheManager {
  private redis: Redis;
  
  async getPositions(timestamp: number): Promise<SatellitePosition[] | null> {
    const key = `positions:${timestamp}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setPositions(timestamp: number, positions: SatellitePosition[], ttl: number = 5) {
    const key = `positions:${timestamp}`;
    await this.redis.setex(key, ttl, JSON.stringify(positions));
  }
  
  async getTLE(noradId: string): Promise<TLEData | null> {
    const key = `tle:${noradId}`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const tle = await this.database.getLatestTLE(noradId);
    
    if (tle) {
      await this.redis.setex(key, 86400, JSON.stringify(tle));
    }
    
    return tle;
  }
}
```

#### Computation Optimization

**1. Parallel Processing**

Use worker threads for CPU-intensive tasks.

```typescript
import { Worker } from 'worker_threads';

class ParallelCalculator {
  private workers: Worker[] = [];
  
  constructor(numWorkers: number = 4) {
    for (let i = 0; i < numWorkers; i++) {
      this.workers.push(new Worker('./calculation-worker.js'));
    }
  }
  
  async calculateBatch(satellites: Satellite[]): Promise<SatellitePosition[]> {
    const chunkSize = Math.ceil(satellites.length / this.workers.length);
    const chunks = chunk(satellites, chunkSize);
    
    const promises = chunks.map((chunk, i) => 
      this.runWorker(this.workers[i], chunk)
    );
    
    const results = await Promise.all(promises);
    return results.flat();
  }
  
  private runWorker(worker: Worker, satellites: Satellite[]): Promise<SatellitePosition[]> {
    return new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.postMessage({ satellites, time: Date.now() });
    });
  }
}
```

**2. Result Caching**

Cache calculated positions with appropriate TTL.

### Scalability Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Concurrent Users** | 1,000+ | Horizontal scaling, load balancing |
| **Satellites Tracked** | 500+ | Efficient rendering, LOD |
| **Position Update Latency** | <100ms | Redis caching, WebSocket |
| **API Response Time** | <200ms | Database indexing, query optimization |
| **Database Queries/sec** | 1,000+ | Connection pooling, read replicas |
| **WebSocket Messages/sec** | 10,000+ | Binary protocol, compression |
| **Frontend FPS** | 30+ | Rendering optimization, throttling |

---

## Data Sources & APIs

### Primary TLE Sources

#### 1. CelesTrak

**URL:** https://celestrak.org/  
**Access:** Free, no authentication  
**Update Frequency:** Multiple times per day  
**Format:** TLE (3-line format)

**API Endpoints:**
```
# Get satellites by group
https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle

# Get specific satellite
https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle

# Available groups
- stations (Space Stations)
- starlink (Starlink constellation)
- gps-ops (GPS operational)
- galileo (Galileo constellation)
- beidou (BeiDou constellation)
- active (Active satellites)
- analyst (Analyst satellites)
```

**Usage Example:**
```typescript
async function fetchFromCelesTrak(group: string): Promise<string> {
  const url = 'https://celestrak.org/NORAD/elements/gp.php';
  const response = await axios.get(url, {
    params: {
      GROUP: group,
      FORMAT: 'tle'
    }
  });
  return response.data;
}
```

#### 2. Space-Track.org

**URL:** https://www.space-track.org/  
**Access:** Free registration required  
**Update Frequency:** Daily  
**Format:** TLE, JSON, XML, CSV

**Features:**
- Official US government source
- Most comprehensive database
- Historical TLE data
- Satellite decay predictions
- Maneuver detection

**API Example:**
```typescript
class SpaceTrackClient {
  private baseUrl = 'https://www.space-track.org';
  private cookie: string = '';
  
  async login(username: string, password: string) {
    const response = await axios.post(
      `${this.baseUrl}/ajaxauth/login`,
      new URLSearchParams({ identity: username, password })
    );
    this.cookie = response.headers['set-cookie'][0];
  }
  
  async getTLE(noradId: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/${noradId}/orderby/TLE_LINE1 asc/format/json`,
      { headers: { Cookie: this.cookie } }
    );
    return response.data;
  }
}
```

#### 3. N2YO API

**URL:** https://www.n2yo.com/  
**Access:** API key required (free tier available)  
**Features:** Real-time positions, pass predictions, satellite info

**API Endpoints:**
```
# Get satellite positions
https://api.n2yo.com/rest/v1/satellite/positions/{id}/{observer-lat}/{observer-lng}/{observer-alt}/{seconds}

# Get TLE
https://api.n2yo.com/rest/v1/satellite/tle/{id}

# Get visual passes
https://api.n2yo.com/rest/v1/satellite/visualpasses/{id}/{observer-lat}/{observer-lng}/{observer-alt}/{days}/{min-visibility}
```

### Update Strategy

**Recommended Approach:**
1. **Primary:** CelesTrak (free, reliable, frequent updates)
2. **Backup:** Space-Track.org (official source, requires auth)
3. **Enhancement:** N2YO (for additional features if needed)

**Update Schedule:**
- **Space Stations (ISS):** Every 3 hours
- **LEO Satellites:** Every 12 hours
- **MEO/GEO Satellites:** Every 24 hours
- **Full Refresh:** Once per day

**Implementation:**
```typescript
class TLESourceManager {
  private sources = {
    celestrak: new CelesTrakClient(),
    spacetrack: new SpaceTrackClient(),
    n2yo: new N2YOClient()
  };
  
  async fetchTLE(noradId: string): Promise<TLEData> {
    // Try CelesTrak first
    try {
      return await this.sources.celestrak.getTLE(noradId);
    } catch (error) {
      console.warn('CelesTrak failed, trying Space-Track');
    }
    
    // Fallback to Space-Track
    try {
      return await this.sources.spacetrack.getTLE(noradId);
    } catch (error) {
      console.warn('Space-Track failed, trying N2YO');
    }
    
    // Last resort: N2YO
    return await this.sources.n2yo.getTLE(noradId);
  }
}
```

---

## Deployment Architecture

### Production Infrastructure

```
                                    ┌─────────────────┐
                                    │   CloudFlare    │
                                    │   DNS + CDN     │
                                    └────────┬────────┘
                                             │
                                             │ HTTPS
                                             │
                                    ┌────────▼────────┐
                                    │  Load Balancer  │
                                    │  (AWS ELB/NLB)  │
                                    └────────┬────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                ┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
                │  Web Server 1  │  │  Web Server 2   │  │  Web Server N  │
                │   (Nginx +     │  │   (Nginx +      │  │   (Nginx +     │
                │   React App)   │  │   React App)    │  │   React App)   │
                └───────┬────────┘  └────────┬────────┘  └───────┬────────┘
                        │                    │                    │
                        └────────────────────┼────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                ┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
                │  API Server 1  │  │  API Server 2   │  │  API Server N  │
                │  (Node.js/     │  │  (Node.js/      │  │  (Node.js/     │
                │   Python)      │  │   Python)       │  │   Python)      │
                └───────┬────────┘  └────────┬────────┘  └───────┬────────┘
                        │                    │                    │
                        └────────────────────┼────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                ┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
                │   WS Server 1  │  │   WS Server 2   │  │   WS Server N  │
                │  (Socket.io)   │  │  (Socket.io)    │  │  (Socket.io)   │
                └───────┬────────┘  └────────┬────────┘  └───────┬────────┘
                        │                    │                    │
                        └────────────────────┼────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                ┌───────▼────────┐  ┌────────▼────────┐
                │ Redis Cluster  │  │   PostgreSQL    │
                │  (Cache + PubSub│  │   (Primary +    │
                │   + Sessions)  │  │   Read Replicas)│
                └────────────────┘  └─────────────────┘
                        │
                ┌───────▼────────┐
                │  Background    │
                │    Workers     │
                │ (TLE Updates,  │
                │  Calculations) │
                └────────────────┘
```

### Container Configuration

**Docker Compose (Production):**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - static_files:/usr/share/nginx/html
    depends_on:
      - api
      - websocket

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    volumes:
      - static_files:/app/dist

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/sattrack
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G

  websocket:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: npm run start:ws
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    deploy:
      replicas: 3

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: npm run start:worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/sattrack
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgis/postgis:14-3.3
    environment:
      - POSTGRES_DB=sattrack
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
  static_files:
  prometheus_data:
  grafana_data:
```

### Cloud Deployment Options

#### AWS Architecture

```
Components:
- ELB (Elastic Load Balancer)
- ECS/EKS for container orchestration
- RDS PostgreSQL with Multi-AZ
- ElastiCache Redis Cluster
- S3 for static assets
- CloudFront CDN
- Route 53 for DNS
- CloudWatch for monitoring
```

#### GCP Architecture

```
Components:
- Cloud Load Balancing
- GKE (Google Kubernetes Engine)
- Cloud SQL PostgreSQL
- Cloud Memorystore (Redis)
- Cloud Storage for static assets
- Cloud CDN
- Cloud DNS
- Cloud Monitoring
```

### Monitoring & Logging

**Prometheus Metrics:**
```yaml
# Application metrics
- http_requests_total
- http_request_duration_seconds
- websocket_connections_active
- satellite_calculations_total
- satellite_calculations_duration_seconds
- tle_updates_total
- cache_hits_total
- cache_misses_total
```

**Logging Stack:**
- **Application Logs:** Winston/Bunyan → Loki
- **Access Logs:** Nginx → Loki
- **Database Logs:** PostgreSQL → Loki
- **Visualization:** Grafana

---

## Development Timeline

### Month 1: Foundation (Weeks 1-4)

**Week 1:**
- Project setup and repository initialization
- Development environment configuration
- Database design and setup
- TLE fetcher implementation

**Week 2:**
- REST API development
- SGP4 integration
- Position calculation service
- Basic WebSocket server

**Week 3:**
- React project setup
- Cesium.js/Three.js integration
- Globe rendering
- Camera controls

**Week 4:**
- Satellite rendering
- Orbital path visualization
- Basic UI components
- API integration

### Month 2: Core Features (Weeks 5-8)

**Week 5:**
- Satellite list and search
- Information panel
- Real-time WebSocket integration
- State management

**Week 6:**
- Testing and bug fixes
- Performance optimization
- Code review and refactoring
- Documentation

**Week 7:**
- Deployment configuration
- CI/CD pipeline
- MVP release preparation
- User testing

**Week 8:**
- Bug fixes from user testing
- Performance tuning
- MVP release
- Post-release monitoring

### Month 3: Enhanced Features (Weeks 9-12)

**Week 9:**
- Satellite footprint visualization
- Ground track implementation
- Sun position and lighting

**Week 10:**
- Pass prediction algorithm
- Observer location features
- Visibility calculations

**Week 11:**
- Historical playback
- Multiple satellite comparison
- Constellation grouping

**Week 12:**
- Performance optimization
- Advanced testing
- Feature refinement

### Month 4-5: Advanced Features (Weeks 13-20)

- User authentication system
- Saved preferences and favorites
- Custom alerts and notifications
- Advanced analytics
- Mobile optimization
- AR mode development

### Month 6+: Scaling & Expansion (Weeks 21+)

- Mobile app development (React Native)
- API for third-party developers
- Premium features
- International expansion
- Performance scaling
- Community features

---

## Key Challenges & Solutions

### Challenge 1: Accurate Orbital Propagation

**Problem:**  
SGP4 propagation accuracy degrades over time, especially for satellites with high drag or frequent maneuvers.

**Solution:**
- Implement frequent TLE updates (every 3-12 hours for LEO)
- Use Space-Track.org for official TLE data
- Implement TLE validation and quality checks
- Show TLE age to users
- Provide accuracy estimates
- Fall back to multiple TLE sources

### Challenge 2: Real-time Performance at Scale

**Problem:**  
Calculating and broadcasting positions for 500+ satellites to 1000+ users every second is computationally expensive.

**Solution:**
- Multi-layer caching (Redis)
- Batch position calculations
- WebSocket rooms for selective updates
- Binary protocol (MessagePack)
- Horizontal scaling with load balancing
- CDN for static assets
- Database read replicas

### Challenge 3: 3D Rendering Performance

**Problem:**  
Rendering 500+ satellites with orbital paths at 30+ FPS on various devices.

**Solution:**
- Level-of-detail (LOD) system
- Frustum culling
- Instanced rendering
- Texture atlases
- WebGL optimizations
- Progressive loading
- Throttle update rate
- Mobile-specific optimizations

### Challenge 4: Coordinate System Transformations

**Problem:**  
Multiple coordinate systems (ECI, ECEF, Geodetic) with proper time handling (UTC, GMST).

**Solution:**
- Use well-tested libraries (satellite.js, Cesium)
- Comprehensive unit tests for transformations
- Reference implementation validation
- Clear documentation of coordinate systems
- Consistent time handling throughout system

### Challenge 5: WebSocket Connection Management

**Problem:**  
Handling thousands of WebSocket connections with reconnection, room management, and state synchronization.

**Solution:**
- Implement robust reconnection logic
- Use Socket.io with sticky sessions
- Redis adapter for multi-server scaling
- Connection pooling
- Graceful degradation
- Client-side state recovery
- Heartbeat/ping-pong for connection health

### Challenge 6: TLE Data Freshness

**Problem:**  
Ensuring TLE data is always up-to-date despite external source failures.

**Solution:**
- Multiple TLE sources with fallback
- Automated update scheduling
- TLE age monitoring and alerts
- Exponential backoff for retries
- Manual update triggers
- TLE validation before use
- Historical TLE storage

### Challenge 7: Browser Compatibility

**Problem:**  
WebGL and modern JavaScript features may not work on all browsers/devices.

**Solution:**
- Feature detection
- Graceful degradation
- Polyfills for older browsers
- WebGL fallback to Canvas
- Progressive enhancement
- Clear browser requirements
- Mobile-first responsive design

### Challenge 8: Time Zone Handling

**Problem:**  
Satellite passes and events need to be displayed in user's local time while calculations use UTC.

**Solution:**
- Always store times in UTC
- Convert to local time for display
- Use date-fns or Luxon for time handling
- Display timezone clearly to users
- Allow users to set preferred timezone
- ISO 8601 format for data exchange

---

## Success Metrics

### Technical Metrics

| Metric | Target | Critical | Monitoring |
|--------|--------|----------|------------|
| Position Update Latency | <100ms | <200ms | Prometheus |
| API Response Time (p95) | <200ms | <500ms | APM |
| Frontend FPS | >30 | >20 | Browser metrics |
| WebSocket Message Rate | 10,000/s | 5,000/s | Custom metrics |
| Database Query Time (p95) | <50ms | <100ms | pg_stat_statements |
| Cache Hit Rate | >90% | >80% | Redis INFO |
| Uptime | 99.9% | 99.5% | UptimeRobot |
| Error Rate | <0.1% | <1% | Sentry |

### Business Metrics

| Metric | Target (Month 6) | Notes |
|--------|------------------|-------|
| Daily Active Users | 1,000+ | Engaged users |
| Concurrent Users | 100+ | Peak hours |
| Session Duration | >5 min | Average |
| Satellites Tracked | 500+ | Active tracking |
| Page Load Time | <2s | First contentful paint |
| Mobile Traffic | 40%+ | Of total traffic |
| Retention Rate (D7) | >30% | 7-day retention |
| User Satisfaction | >4.5/5 | User surveys |

### Data Quality Metrics

| Metric | Target | Validation |
|--------|--------|------------|
| TLE Freshness | <24 hours | 95% of satellites |
| Position Accuracy | <1km | Compared to N2YO |
| TLE Update Success | >99% | Daily updates |
| Data Completeness | >95% | All satellites |

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| TLE source downtime | Medium | High | Multiple sources, caching |
| Database failure | Low | Critical | Backups, failover, replication |
| Performance degradation | Medium | High | Monitoring, auto-scaling |
| WebSocket scaling issues | Medium | High | Redis adapter, load balancing |
| Security vulnerabilities | Low | Critical | Regular audits, updates |
| Browser compatibility | Low | Medium | Testing, graceful degradation |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | Medium | High | Marketing, UX focus |
| High infrastructure costs | Medium | Medium | Optimization, scaling strategy |
| Competition | High | Medium | Unique features, quality |
| Legal/licensing issues | Low | High | Proper attribution, terms |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Insufficient monitoring | Medium | High | Comprehensive setup |
| Poor documentation | Medium | Medium | Continuous documentation |
| Team capacity | High | Medium | Realistic timeline |
| Technical debt | High | Medium | Code reviews, refactoring |

---

## Team Structure

### Recommended Team (Full-time equivalents)

**Phase 1 (MVP - Months 1-3):**
- 1x Full-Stack Developer (Lead)
- 1x Frontend Developer
- 1x Backend Developer
- 0.5x DevOps Engineer
- 0.5x UI/UX Designer

**Phase 2 (Enhanced Features - Months 4-5):**
- Add: 1x QA Engineer
- Add: 0.5x Technical Writer

**Phase 3 (Advanced Features - Months 6+):**
- Add: 1x Mobile Developer
- Add: 1x Data Engineer
- Add: 0.5x Product Manager

### Skill Requirements

**Must Have:**
- React and TypeScript expertise
- 3D graphics (WebGL/Three.js/Cesium)
- Backend development (Node.js or Python)
- PostgreSQL and Redis
- Orbital mechanics basics
- WebSocket real-time systems

**Nice to Have:**
- Kubernetes experience
- Mobile development (React Native)
- Data visualization
- Aerospace/satellite domain knowledge
- DevOps and monitoring

---

## Appendix

### Glossary

**TLE (Two-Line Element):** Standard format for orbital elements  
**SGP4:** Simplified General Perturbations model #4 (propagation algorithm)  
**NORAD ID:** Unique satellite catalog number  
**ECI:** Earth-Centered Inertial coordinate system  
**ECEF:** Earth-Centered Earth-Fixed coordinate system  
**GMST:** Greenwich Mean Sidereal Time  
**LEO:** Low Earth Orbit (160-2,000 km)  
**MEO:** Medium Earth Orbit (2,000-35,786 km)  
**GEO:** Geostationary Orbit (~35,786 km)  
**Pass:** When a satellite is visible from an observer location  
**Epoch:** Reference time for orbital elements

### References

- **CelesTrak:** https://celestrak.org/
- **Space-Track.org:** https://www.space-track.org/
- **Satellite.js:** https://github.com/shashwatak/satellite-js
- **Cesium.js:** https://cesium.com/
- **SGP4 Documentation:** https://celestrak.org/publications/AIAA/2006-6753/

### Version History

- **v1.0** - Initial development plan (January 2026)

---

**Document maintained by:** Development Team  
**Last updated:** January 27, 2026  
**Status:** Active Development