"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../src/server");
const database_1 = require("../src/config/database");
describe('API Endpoints', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('ok');
        });
    });
    describe('GET /api/v1/satellites', () => {
        it('should return paginated satellite list', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/v1/satellites')
                .query({ page: 1, limit: 10 });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('page', 1);
            expect(response.body.meta).toHaveProperty('limit', 10);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        it('should use default pagination values', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/api/v1/satellites');
            expect(response.status).toBe(200);
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBe(20);
        });
    });
    describe('GET /api/v1/satellites/:noradId', () => {
        it('should return 400 for invalid NORAD ID', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/api/v1/satellites/invalid');
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        it('should return 404 for non-existent satellite', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/api/v1/satellites/99999999');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/v1/satellites/categories', () => {
        it('should return list of categories', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/api/v1/satellites/categories');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    describe('POST /api/v1/satellites/search', () => {
        it('should return 400 when query is missing', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/satellites/search')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        it('should search satellites by name', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/satellites/search')
                .send({ q: 'ISS' });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('should search satellites by NORAD ID', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/v1/satellites/search')
                .send({ q: '25544' });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    // Clean up after all tests
    afterAll(async () => {
        await database_1.prisma.$disconnect();
    });
});
