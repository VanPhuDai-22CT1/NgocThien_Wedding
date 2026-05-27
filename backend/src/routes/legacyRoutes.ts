import { Router } from 'express';
import LegacyController from '../controllers/LegacyController';

const router = Router();

router.get('/', (req, res) => LegacyController.handle(req, res));
router.post('/', (req, res) => LegacyController.handle(req, res));

export default router;
