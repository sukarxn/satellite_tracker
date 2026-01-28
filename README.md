# Satellite Tracker

A real-time satellite monitoring and analysis system.

## Project Structure

- `backend/`: Node.js/Express API server (TypeScript)
- `frontend/`: React/Vite Frontend (Coming Week 3)
- `docker-compose.yml`: Local development environment (PostgreSQL + Redis)

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### 2. Start Services
Start the database and cache services:
```bash
docker compose up -d
```

### 3. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 4. Database Migration
Once Docker is running, initialize the database schema:
```bash
npx prisma migrate dev --name init
```

### 5. Fetch Initial Data
Populate the database with satellite TLE data from CelesTrak:
```bash
npm run update-tle
```

### 6. Run Development Server
Start the backend server:
```bash
npm run dev
```
The server will be available at `http://localhost:3000`.

## API Endpoints (v1)

- `GET /api/v1/satellites`: List satellites (pagination support)
- `GET /api/v1/satellites/:noradId`: Get satellite details
- `GET /api/v1/satellites/categories`: Get satellite categories
- `POST /api/v1/satellites/search`: Search satellites by name or ID

## implementation Status

- [x] Week 1: Backend Foundation (Setup, DB, TLE Service, API Skeleton)
- [x] Week 2: Real-time Pipeline (SGP4, Redis, WebSocket)
- [] Week 3: Frontend Setup
