# Satellite Tracker Execution Plan

## Phase 1: MVP (Weeks 1-6)

### Week 1: Backend Foundation
**Goal**: Establish the project capability, database, and basic API.

- [ ] **Project Setup**
  - [ ] Initialize Git repository
  - [ ] Create `.gitignore` for Node/IDE files
  - [ ] Set up Monorepo structure (using manual folders or Turborepo)
  - [ ] Create `README.md` with project overview and setup instructions
  - [ ] Create `docker-compose.yml` for PostgreSQL and Redis
  - [ ] Verify local Docker containers are running

- [ ] **Database Initialization**
  - [ ] Install PostgreSQL and PostGIS locally
  - [ ] Create `satellites`, `tle_data`, `observations`, `users`, `user_locations` tables
  - [ ] Enable PostGIS extension (`CREATE EXTENSION postgis;`)
  - [ ] Create indexes for `norad_id`, `category`, and spatial columns
  - [ ] Set up database migration tool (Prisma/TypeORM/DbMate)
  - [ ] Create initial migration file for schema

- [ ] **TLE Data Service**
  - [ ] Implement TLE Fetcher Service (connect to CelesTrak)
  - [ ] Create TLE Parser (parse lines 1 & 2)
  - [ ] Implement validation logic for TLE checksums
  - [ ] Implement database insertion logic for TLEs
  - [ ] Create a script to manually trigger TLE fetch

- [ ] **REST API Implementation**
  - [ ] Set up Express/FastAPI server skeleton
  - [ ] Implement `GET /api/v1/satellites` (list with pagination)
  - [ ] Implement `GET /api/v1/satellites/:noradId` (details)
  - [ ] Implement `GET /api/v1/satellites/:noradId/position` (get latest known pos)
  - [ ] Implement `GET /api/v1/categories`
  - [ ] Implement `POST /api/v1/satellites/search`
  - [ ] Add basic error handling middleware
  - [ ] Add request logging (Morgan/Winston)

### Week 2: Real-time Data Pipeline
**Goal**: Enable real-time satellite position calculation and streaming.

- [ ] **SGP4 Integration**
  - [ ] Install `satellite.js` (or Python equivalent)
  - [ ] Implement propagation function: `TLE + Time -> ECI Coordinates`
  - [ ] Implement coordinate transform: `ECI -> ECEF -> Geodetic (Lat/Lon/Alt)`
  - [ ] Implement velocity vector calculation

- [ ] **Redis Caching Layer**
  - [ ] Install and configure Redis client
  - [ ] Design cache key schema (e.g., `sat:pos:{noradId}`)
  - [ ] Implement `setPos` and `getPos` helper functions
  - [ ] Implement cache expiration policies (TTL ~5s)

- [ ] **Position Calculation Service**
  - [ ] Create a "Worker" process for calculations
  - [ ] Implement batch processing loop (iterate all active satellites)
  - [ ] Connect Worker to Database (fetch active TLEs)
  - [ ] Connect Worker to Redis (write positions)
  - [ ] Benchmark calculation speed for 500+ satellites

- [ ] **WebSocket Server**
  - [ ] Set up Socket.io server
  - [ ] Implement `connection` handler
  - [ ] Implement room logic (join `all`, `category:X`, `sat:Y`)
  - [ ] Create broadcast loop (read Redis -> emit to rooms)
  - [ ] Test WebSocket connection with a simple client script

- [ ] **Background Jobs**
  - [ ] Set up a Cron job for Daily TLE updates (3 AM UTC)
  - [ ] Set up a Cron job for old data cleanup
  - [ ] Verify jobs run at expected intervals

### Week 3: Frontend - 3D Visualization
**Goal**: Visualize the Earth and satellites in 3D.

- [ ] **Frontend Application Setup**
  - [ ] Initialize React + Vite + TypeScript project
  - [ ] Install TailwindCSS and configure `tailwind.config.js`
  - [ ] Install Cesium.js (or Three.js) and configure build assets

- [ ] **Globe Component**
  - [ ] Create `GlobeContainer` component
  - [ ] Initialize Cesium Viewer (disable default widgets like timeline)
  - [ ] Set initial camera view to an interesting perspective
  - [ ] Add star background and atmosphere settings

- [ ] **Satellite Rendering**
  - [ ] Create `SatelliteManager` class/hook
  - [ ] Implement "Add Point" function (converting Lat/Lon/Alt to Cartesian3)
  - [ ] Implement "Update Point" function (smooth transitions)
  - [ ] Implement billboard/point styling (color based on category)

- [ ] **Interaction & Controls**
  - [ ] Implement basic mouse navigation (pan, zoom, tilt)
  - [ ] Add "Click to Select" raycasting
  - [ ] Show tooltip/label on hover
  - [ ] Implement "Focus Camera on Satellite" feature

- [ ] **Orbital Paths**
  - [ ] Create `OrbitPath` calculator (predict future points)
  - [ ] Render orbit lines using Polyline geometry
  - [ ] Optimize path rendering (limit segment count)

### Week 4: Frontend - UI & Integration
**Goal**: Connect UI to Real-time data and polish user experience.

- [ ] **UI Component Library**
  - [ ] Build key components: `Sidebar`, `Card`, `Button`, `Input`
  - [ ] Implement `Layout` wrapper (Header + Sidebar + Main)
  - [ ] Apply "Palantir-style" dark theme (colors, fonts, borders)

- [ ] **Search & Filter**
  - [ ] Create `SearchBox` component with debounce
  - [ ] Implement client-side filtering (by name/ID)
  - [ ] Build `CategorySelect` dropdown
  - [ ] Connect Search UI to global state

- [ ] **Satellite Info Panel**
  - [ ] Create `InfoPanel` component (slide-over or overlaid)
  - [ ] Display real-time parameters (Lat, Lon, Alt, Velocity)
  - [ ] Show static metadata (Launch year, Country, Owner)

- [ ] **Data Integration**
  - [ ] Create `useSocket` hook for WebSocket connection
  - [ ] Create `useSatelliteStore` (Zustand) for state management
  - [ ] Connect WebSocket events to Store updates
  - [ ] Optimize React rendering (prevent unnecessary re-renders)

- [ ] **Responsive Design**
  - [ ] Adjust Sidebar behavior for mobile (collapsible/drawer)
  - [ ] Resize Globe canvas on window resize
  - [ ] Ensure touch controls work on mobile

### Week 5: Testing & Refinement
**Goal**: Ensure stability, accuracy, and performance.

- [ ] **Backend Testing**
  - [ ] Write unit tests for TLE Parser
  - [ ] Write unit tests for SGP4 math (verify against known data)
  - [ ] Write integration tests for API endpoints
  - [ ] Stress test WebSocket server (simulating 100s of clients)

- [ ] **Frontend Testing**
  - [ ] Write component tests (using Vitest/RTL)
  - [ ] Verify WebSocket reconnection logic
  - [ ] Profile rendering performance (FPS check)

- [ ] **Bug Fixes & Polish**
  - [ ] Fix any interpolation jitters
  - [ ] Handle TLE fetch failures gracefully
  - [ ] Improve error messages for the user
  - [ ] Refine visual styles (glow effects, grid lines)

- [ ] **Deployment Prep**
  - [ ] Finalize Dockerfile for production
  - [ ] Set up CI/CD pipeline (GitHub Actions)
  - [ ] Create deployment documentation

## Phase 2: Enhanced Features (Weeks 7-16)

### Week 6: Advanced Visualization
**Goal**: Add visual fidelity and complex geospatial features.

- [ ] **Satellite Footprint**
  - [ ] Implement visibility cone calculation (based on altitude)
  - [ ] Render semi-transparent cone geometry in 3D
  - [ ] Render ground track circle on Earth surface
  - [ ] Optimize footprint transparency/blending

- [ ] **Ground Tracks**
  - [ ] Calculate previous orbit ground track (past 90 mins)
  - [ ] Calculate  future orbit ground track (future 90 mins)
  - [ ] Render lines clamped to ground (PolylineOnTerrain)
  - [ ] Add color gradient (fading for past, solid for future)

- [ ] **Lighting & Environment**
  - [ ] Implement Sun position calculator (Julian Date based)
  - [ ] Enable day/night terminator on the Globe
  - [ ] Implement eclipse detection (is satellite in shadow?)
  - [ ] Add visual indicator for "eclipsed" satellites (dimmed color)

- [ ] **View Modes**
  - [ ] Add 2D Map projection toggle (Equirectangular)
  - [ ] Implement "Satellite POV" camera mode
  - [ ] Add split-screen capability (optional)

### Week 7: User Features
**Goal**: Add tools for analysis and planning.

- [ ] **Observer Location**
  - [ ] Create "Set Location" UI (Autocomplete or Map Click)
  - [ ] Persist user location in local storage (or DB)
  - [ ] Calculate Azimuth/Elevation relative to observer
  - [ ] Display "Look Angles" in Info Panel

- [ ] **Pass Predictions**
  - [ ] Implement Pass Prediction algorithm (AOS/LOS times)
  - [ ] Filter passes by minimum elevation (e.g., > 10°)
  - [ ] Display "Next Visible Pass" in UI
  - [ ] Create "Pass Table" view for next 24 hours

- [ ] **Comparison & Grouping**
  - [ ] Implement "Multi-Select" satellites
  - [ ] Create "Constellation View" (group Starlink, GPS, etc.)
  - [ ] Draw connection lines between grouped satellites (if applicable)

- [ ] **Historical Playback**
  - [ ] Add "Time Slider" UI component
  - [ ] Modify SGP4 propagator to accept arbitrary time overrides
  - [ ] Implement "Play/Pause" and speed controls (1x, 10x, 100x)
  - [ ] Visual indicator for "Simulated Time" vs "Live Time"

### Week 8: Performance Enhancements & Optimization
**Goal**: Ensure smooth operation with high object counts.

- [ ] **Rendering Optimization**
  - [ ] Implement LOD (Level of Detail) system
    - [ ] Near: 3D Model/High-res Sprite + Label + Orbit
    - [ ] Mid: Dot Sprite + Label
    - [ ] Far: Pixel Dot (no label)
  - [ ] Implement Frustum Culling (don't update hidden satellites)
  - [ ] Use Instanced Mesh Rendering for identical markers

- [ ] **Calculation Offloading**
  - [ ] Move heavy SGP4 predictions (e.g. 24h passes) to WebWorkers
  - [ ] Implement result caching for frequent calculations (memoization)

- [ ] **Network Optimization**
  - [ ] Implement Delta Compression (only send changed values)
  - [ ] Evaluate MessagePack (binary) instead of JSON for WebSocket
  - [ ] Implement "Selective Subscription" (only stream visible satellites)

## Phase 3: Advanced Features (Weeks 17+)

### Week 9: User Accounts & Personalization
**Goal**: Enable user-specific data persistence.

- [ ] **Authentication System**
  - [ ] Implement User Registration/Login API (JWT/Session)
  - [ ] Create Login/Signup UI pages
  - [ ] Secure API endpoints with Auth Middleware

- [ ] **User Data**
  - [ ] Create "Favorites" system (Save satellites to profile)
  - [ ] Save "Custom Locations" to database
  - [ ] Sync preferences (theme, default view) across devices

- [ ] **Alerts & Notifications**
  - [ ] Implement backend notification worker
  - [ ] Create "Pass Alert" trigger logic (e.g. "Notify 10m before ISS")
  - [ ] Use Web Push Notifications or Email service

### Week 10: Mobile & Scaling
**Goal**: Expand platform reach and robustness.

- [ ] **Mobile App**
  - [ ] Initialize React Native project
  - [ ] Port business logic (SGP4/API calls)
  - [ ] Implement AR View (Camera overlay for satellite tracking)

- [ ] **Public API**
  - [ ] Document public API endpoints (Swagger/OpenAPI)
  - [ ] Implement API Key generation and rate limiting
  - [ ] Release developer documentation

- [ ] **Social Features**
  - [ ] Add "Share Pass" feature (generate unique link)
  - [ ] Add social media meta tags for shared links
