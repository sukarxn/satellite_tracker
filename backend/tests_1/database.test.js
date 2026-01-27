"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/config/database");
describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
        const result = await database_1.prisma.$queryRaw `SELECT 1 as value`;
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
    });
    it('should be able to query satellite table', async () => {
        const count = await database_1.prisma.satellite.count();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });
    it('should be able to query TLE table', async () => {
        const count = await database_1.prisma.tLE.count();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });
    afterAll(async () => {
        await database_1.prisma.$disconnect();
    });
});
