import { Router } from 'express';
import { getSatellites, getSatelliteById, getCategories, searchSatellites } from '../controllers/satelliteController';

const router = Router();

router.get('/', getSatellites);
router.get('/categories', getCategories); // Specific path before parameter path
router.post('/search', searchSatellites);
router.get('/:noradId', getSatelliteById);

export default router;
