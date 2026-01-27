# Test Suite Documentation

## Overview
This test suite validates the core functionality of the Satellite Tracker backend, including:
- TLE data parsing
- API endpoints
- Database connectivity

## Test Files

### 1. `tleService.test.ts`
Tests for the TLE (Two-Line Element) parsing service.

**Test Cases:**
- ✅ Parse valid TLE data correctly
- ✅ Handle empty input
- ✅ Handle incomplete TLE sets
- ✅ Filter out empty lines

### 2. `api.test.ts`
Integration tests for REST API endpoints.

**Test Cases:**
- ✅ Health check endpoint
- ✅ Satellite list with pagination
- ✅ Satellite details by NORAD ID
- ✅ Category listing
- ✅ Satellite search functionality
- ✅ Error handling (400, 404 responses)

### 3. `database.test.ts`
Database connection and schema validation tests.

**Test Cases:**
- ✅ Database connection
- ✅ Satellite table access
- ✅ TLE table access

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run with coverage:
```bash
npm test -- --coverage
```

## Prerequisites

Before running tests, ensure:
1. Docker containers are running (`docker compose up -d`)
2. Database migrations are applied (`npx prisma migrate dev`)
3. Environment variables are set in `.env`

## Test Environment

- **Framework**: Jest with ts-jest
- **HTTP Testing**: Supertest
- **Database**: PostgreSQL (same as development)
- **Timeout**: 10 seconds per test

## Notes

- Tests use the same database as development (consider using a separate test database in production)
- Database connections are properly closed after test suites complete
- The server doesn't start on a port during tests (NODE_ENV=test prevents this)
