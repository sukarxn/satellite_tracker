import { Router } from 'express';
import { getSatellites, getSatelliteById, getCategories, searchSatellites, getSatellitePath } from '../controllers/satelliteController';

const router = Router();

router.get('/', getSatellites);
router.get('/categories', getCategories); // Specific path before parameter path
router.post('/search', searchSatellites);
router.get('/:noradId', getSatelliteById);
router.get('/:noradId/path', getSatellitePath);

export default router;
