"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tleService_1 = require("../src/services/tleService");
describe('TLE Service', () => {
    describe('parseTLEData', () => {
        it('should parse valid TLE data correctly', () => {
            const sampleTLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537
COSMOS 2251 DEB
1 33591U 93036QJ  08264.45245710  .00000119  00000-0  31268-4 0  8234
2 33591  74.0583 327.5790 0031720 328.8633  31.0926 14.35844873788323`;
            const result = (0, tleService_1.parseTLEData)(sampleTLE);
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('ISS (ZARYA)');
            expect(result[0].line1).toContain('25544U');
            expect(result[0].line2).toContain('25544');
            expect(result[1].name).toBe('COSMOS 2251 DEB');
        });
        it('should handle empty input', () => {
            const result = (0, tleService_1.parseTLEData)('');
            expect(result).toHaveLength(0);
        });
        it('should handle incomplete TLE sets', () => {
            const incompleteTLE = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927`;
            const result = (0, tleService_1.parseTLEData)(incompleteTLE);
            expect(result).toHaveLength(0);
        });
        it('should filter out empty lines', () => {
            const tleWithEmptyLines = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537

`;
            const result = (0, tleService_1.parseTLEData)(tleWithEmptyLines);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('ISS (ZARYA)');
        });
    });
});
