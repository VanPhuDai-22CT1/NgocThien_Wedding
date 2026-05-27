import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', (req, res) => AuthController.login(req, res));
router.get('/me', authMiddleware, (req, res) => AuthController.me(req, res));

export default router;
